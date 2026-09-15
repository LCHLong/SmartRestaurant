/**
 * feedbackController.js
 * Controller ghi nhận Telemetry & Phản Hồi Đánh Giá (Thumbs Up / Down)
 * theo Paper 01: Advancing RAG for Structured Enterprise Data (Mục 3.4 & Bước 4.2 Kế Hoạch 05)
 */

const Joi = require('joi');
const crypto = require('crypto');
const redis = require('../config/redisClient');
const supabase = require('../config/supabaseClient');

// Bộ nhớ cache fallback in-memory phòng ngừa khi Redis / Supabase offline (Zero Crash)
const memoryFeedbackStore = new Map();
const memoryTelemetryMetrics = {
  total: 0,
  thumbs_up: 0,
  thumbs_down: 0,
  detailed: 0
};

// Bộ nhớ telemetry phân nhóm A/B testing
const memoryAbMetrics = {
  variant_a_advanced: { impressions: 0, total: 0, thumbs_up: 0, thumbs_down: 0 },
  variant_b_baseline: { impressions: 0, total: 0, thumbs_up: 0, thumbs_down: 0 }
};

function resolveVariant(sessionId) {
  if (!sessionId) return 'variant_a_advanced';
  let hash = 2166136261;
  for (let i = 0; i < sessionId.length; i++) {
    hash ^= sessionId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const score = (hash >>> 0) / 4294967296;
  return score < 0.5 ? 'variant_a_advanced' : 'variant_b_baseline';
}

// Joi Schema kiểm tra tính hợp lệ của request payload
const feedbackSchema = Joi.object({
  sessionId: Joi.string().max(100).required(),
  tableId: Joi.string().max(50).allow(null, '').optional(),
  query: Joi.string().min(1).max(1000).required(),
  answer: Joi.string().allow(null, '').optional(),
  feedbackType: Joi.string().valid('thumbs_up', 'thumbs_down', 'detailed').required(),
  rating: Joi.number().integer().min(-5).max(5).optional(),
  rejectedItems: Joi.array().items(Joi.string().max(255)).default([]),
  contextIds: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.number())).default([]),
  comment: Joi.string().max(1000).allow(null, '').optional(),
  metadata: Joi.object().default({}),
  abVariant: Joi.string().valid('variant_a_advanced', 'variant_b_baseline').optional()
});

/**
 * Ghi nhận phản hồi người dùng (POST /api/chat/feedback hoặc POST /api/ai/feedback)
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { error, value } = feedbackSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu phản hồi không hợp lệ',
        errors: error.details.map(d => d.message)
      });
    }

    const {
      sessionId,
      tableId = null,
      query,
      answer = null,
      feedbackType,
      rejectedItems = [],
      contextIds = [],
      comment = null,
      metadata = {},
      abVariant: inputVariant
    } = value;

    const abVariant = inputVariant || resolveVariant(sessionId);

    // Gán điểm số rating mặc định nếu không truyền
    let rating = value.rating;
    if (rating === undefined || rating === null) {
      if (feedbackType === 'thumbs_up') rating = 1;
      else if (feedbackType === 'thumbs_down') rating = -1;
      else rating = 0;
    }

    const feedbackId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const feedbackRecord = {
      id: feedbackId,
      sessionId,
      tableId,
      userId: req.user?.id || null,
      query,
      answer,
      feedbackType,
      rating,
      rejectedItems,
      contextIds,
      comment,
      metadata,
      abVariant,
      createdAt
    };

    // 1. Ghi nhận Telemetry Metrics & Session Feedback vào Redis
    try {
      if (redis && typeof redis.incr === 'function') {
        await Promise.allSettled([
          redis.incr('rag_telemetry:total_feedback'),
          redis.incr(`rag_telemetry:${feedbackType}`),
          redis.incr(`rag_telemetry:${abVariant}_total`),
          redis.incr(`rag_telemetry:${abVariant}_${feedbackType}`),
          redis.set(`feedback:${feedbackId}`, JSON.stringify(feedbackRecord), { EX: 86400 * 7 }) // Lưu 7 ngày
        ]);

        // Nếu là thumbs_down kèm món từ chối, lưu món blacklist tạm thời vào session Redis
        if (feedbackType === 'thumbs_down' && rejectedItems.length > 0) {
          const rejectKey = `ai_rejected_items:${sessionId}`;
          const existing = await redis.get(rejectKey);
          let currentList = existing ? JSON.parse(existing) : [];
          currentList = Array.from(new Set([...currentList, ...rejectedItems]));
          await redis.set(rejectKey, JSON.stringify(currentList), { EX: 1800 }); // 30 phút
        }
      }
    } catch (redisErr) {
      console.warn('⚠️ [feedbackController] Redis warning (bỏ qua & dùng fallback):', redisErr.message);
    }

    // 2. Ghi in-memory store phòng vệ
    memoryTelemetryMetrics.total += 1;
    if (memoryTelemetryMetrics[feedbackType] !== undefined) {
      memoryTelemetryMetrics[feedbackType] += 1;
    }
    if (memoryAbMetrics[abVariant]) {
      memoryAbMetrics[abVariant].total += 1;
      if (feedbackType === 'thumbs_up') memoryAbMetrics[abVariant].thumbs_up += 1;
      if (feedbackType === 'thumbs_down') memoryAbMetrics[abVariant].thumbs_down += 1;
    }
    if (!memoryFeedbackStore.has(sessionId)) {
      memoryFeedbackStore.set(sessionId, []);
    }
    memoryFeedbackStore.get(sessionId).push(feedbackRecord);

    // 3. Bất đồng bộ lưu vết lâu dài vào Supabase/PostgreSQL (bảng chat_feedbacks)
    if (supabase && typeof supabase.from === 'function') {
      supabase.from('chat_feedbacks').insert({
        id: feedbackId,
        session_id: sessionId,
        table_id: tableId,
        user_id: req.user?.id || null,
        query,
        answer,
        feedback_type: feedbackType,
        rating,
        rejected_items: rejectedItems,
        context_ids: contextIds,
        comment,
        metadata
      }).then(({ error: dbErr }) => {
        if (dbErr) {
          console.warn('⚠️ [feedbackController] Supabase insert warning:', dbErr.message);
        }
      }).catch(dbErr => {
        console.warn('⚠️ [feedbackController] Supabase catch warning:', dbErr.message);
      });
    }

    return res.status(201).json({
      success: true,
      feedbackId,
      message: 'Ghi nhận phản hồi telemetry thành công',
      data: {
        sessionId,
        abVariant,
        feedbackType,
        rating,
        rejectedItems,
        createdAt
      }
    });

  } catch (err) {
    console.error('❌ [feedbackController] Lỗi xử lý submitFeedback:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi ghi nhận phản hồi'
    });
  }
};

/**
 * Lấy danh sách phản hồi theo sessionId (GET /api/chat/feedback/session/:sessionId)
 */
exports.getFeedbacksBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId không được rỗng' });
    }

    // Ưu tiên truy xuất từ Supabase nếu có
    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('chat_feedbacks')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json({ success: true, count: data.length, data });
      }
    }

    // Fallback sang memory store
    const cached = memoryFeedbackStore.get(sessionId) || [];
    return res.json({ success: true, count: cached.length, data: cached });
  } catch (err) {
    console.error('❌ [feedbackController] Lỗi getFeedbacksBySession:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi truy xuất phản hồi' });
  }
};

/**
 * Báo cáo thống kê Telemetry (GET /api/chat/feedback/stats)
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    let total = memoryTelemetryMetrics.total;
    let thumbsUp = memoryTelemetryMetrics.thumbs_up;
    let thumbsDown = memoryTelemetryMetrics.thumbs_down;

    // Lấy số liệu thời gian thực từ Redis nếu khả dụng
    try {
      if (redis && typeof redis.get === 'function') {
        const [rTotal, rUp, rDown] = await Promise.all([
          redis.get('rag_telemetry:total_feedback'),
          redis.get('rag_telemetry:thumbs_up'),
          redis.get('rag_telemetry:thumbs_down')
        ]);
        if (rTotal !== null) total = parseInt(rTotal, 10) || total;
        if (rUp !== null) thumbsUp = parseInt(rUp, 10) || thumbsUp;
        if (rDown !== null) thumbsDown = parseInt(rDown, 10) || thumbsDown;
      }
    } catch (_) { /* fallback to memory counters */ }

    const satisfactionRate = total > 0 ? Number(((thumbsUp / total) * 100).toFixed(2)) : 100.0;

    return res.json({
      success: true,
      stats: {
        totalFeedback: total,
        thumbsUp,
        thumbsDown,
        satisfactionRatePct: satisfactionRate,
        dislikeRatePct: total > 0 ? Number(((thumbsDown / total) * 100).toFixed(2)) : 0.0
      }
    });
  } catch (err) {
    console.error('❌ [feedbackController] Lỗi getFeedbackStats:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy thống kê telemetry' });
  }
};

/**
 * Báo cáo so sánh A/B Testing giữa Advancing RAG và Baseline (GET /api/chat/feedback/ab-stats)
 */
exports.getAbStats = async (req, res) => {
  try {
    let aImpressions = memoryAbMetrics.variant_a_advanced.impressions;
    let aTotal = memoryAbMetrics.variant_a_advanced.total;
    let aUp = memoryAbMetrics.variant_a_advanced.thumbs_up;
    let aDown = memoryAbMetrics.variant_a_advanced.thumbs_down;

    let bImpressions = memoryAbMetrics.variant_b_baseline.impressions;
    let bTotal = memoryAbMetrics.variant_b_baseline.total;
    let bUp = memoryAbMetrics.variant_b_baseline.thumbs_up;
    let bDown = memoryAbMetrics.variant_b_baseline.thumbs_down;

    // Truy xuất số liệu từ Redis nếu khả dụng
    try {
      if (redis && typeof redis.get === 'function') {
        const [
          rAImp, rATot, rAUp, rADown,
          rBImp, rBTot, rBUp, rBDown
        ] = await Promise.all([
          redis.get('rag_telemetry:variant_a_advanced_impressions'),
          redis.get('rag_telemetry:variant_a_advanced_total'),
          redis.get('rag_telemetry:variant_a_advanced_thumbs_up'),
          redis.get('rag_telemetry:variant_a_advanced_thumbs_down'),
          redis.get('rag_telemetry:variant_b_baseline_impressions'),
          redis.get('rag_telemetry:variant_b_baseline_total'),
          redis.get('rag_telemetry:variant_b_baseline_thumbs_up'),
          redis.get('rag_telemetry:variant_b_baseline_thumbs_down'),
        ]);

        if (rAImp !== null) aImpressions = parseInt(rAImp, 10) || aImpressions;
        if (rATot !== null) aTotal = parseInt(rATot, 10) || aTotal;
        if (rAUp !== null) aUp = parseInt(rAUp, 10) || aUp;
        if (rADown !== null) aDown = parseInt(rADown, 10) || aDown;

        if (rBImp !== null) bImpressions = parseInt(rBImp, 10) || bImpressions;
        if (rBTot !== null) bTotal = parseInt(rBTot, 10) || bTotal;
        if (rBUp !== null) bUp = parseInt(rBUp, 10) || bUp;
        if (rBDown !== null) bDown = parseInt(rBDown, 10) || bDown;
      }
    } catch (_) { /* fallback to memory counters */ }

    const aSat = aTotal > 0 ? Number(((aUp / aTotal) * 100).toFixed(2)) : 100.0;
    const bSat = bTotal > 0 ? Number(((bUp / bTotal) * 100).toFixed(2)) : 100.0;

    return res.json({
      success: true,
      data: {
        trafficSplit: '50/50',
        variant_a_advanced: {
          name: 'Advancing RAG (Paper 01 Hybrid + Metadata + Reranker)',
          impressions: aImpressions,
          totalFeedback: aTotal,
          thumbsUp: aUp,
          thumbsDown: aDown,
          satisfactionRatePct: aSat
        },
        variant_b_baseline: {
          name: 'Baseline RAG (Simple Retrieval)',
          impressions: bImpressions,
          totalFeedback: bTotal,
          thumbsUp: bUp,
          thumbsDown: bDown,
          satisfactionRatePct: bSat
        },
        improvementDeltaPct: Number((aSat - bSat).toFixed(2))
      }
    });
  } catch (err) {
    console.error('❌ [feedbackController] Lỗi getAbStats:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy thống kê A/B testing' });
  }
};

