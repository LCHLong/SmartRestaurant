/**
 * guestProfileController.js
 * Quản lý Bộ nhớ Dài hạn Khách quen (Archival & Recall Memory)
 * Căn cứ: MemGPT: Towards LLMs as Operating Systems (UC Berkeley, 2023)
 */

const Joi = require('joi');
const redis = require('../config/redisClient');
const supabase = require('../config/supabaseClient');
const { getEmbedding } = require('../services/pipecatClient');

const CACHE_TTL_SECONDS = 3600; // 1 hour

/**
 * Chuẩn hóa danh sách chuỗi: trim, lowercase, loại bỏ phần tử rỗng và trùng lặp
 * @param {Array<string>} list
 * @returns {Array<string>}
 */
const normalizeList = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (!item || typeof item !== 'string') continue;
    const cleaned = item.trim().toLowerCase();
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }
  return result.sort();
};

/**
 * Chuẩn hóa danh sách món ăn yêu thích: trim, giữ nguyên viết hoa, loại bỏ trùng lặp (không phân biệt hoa thường)
 * @param {Array<string>} list
 * @returns {Array<string>}
 */
const normalizeFavorites = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (trimmed && !seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
};

// Schema kiểm thực cập nhật hồ sơ khách
const profileUpdateSchema = Joi.object({
  allergies: Joi.array().items(Joi.string().max(100)).optional(),
  dietary_preferences: Joi.object().optional(),
  favorite_dishes: Joi.array().items(Joi.string().max(150)).optional(),
  spice_preference: Joi.string().valid('không cay', 'ít cay', 'vừa', 'cay', 'cay nồng', 'rất cay').optional(),
  preferred_zone: Joi.string().max(100).allow(null, '').optional(),
  special_notes: Joi.string().max(500).allow(null, '').optional(),
  special_dates: Joi.array().items(Joi.object({
    event: Joi.string().required(),
    date: Joi.string().required()
  })).optional()
});

// Schema lưu tóm tắt phiên ngầm (Session Summary)
const sessionSummarySchema = Joi.object({
  userId: Joi.string().uuid().required(),
  sessionId: Joi.string().max(100).optional().allow(null, ''),
  detectedAllergies: Joi.array().items(Joi.string()).default([]),
  detectedSpice: Joi.string().valid('không cay', 'ít cay', 'vừa', 'cay', 'cay nồng', 'rất cay').optional().allow(null, ''),
  detectedZone: Joi.string().max(100).optional().allow(null, ''),
  favoriteDishes: Joi.array().items(Joi.string()).default([]),
  newSpecialNotes: Joi.string().max(500).optional().allow(null, ''),
  memoryFacts: Joi.array().items(Joi.string()).default([]),
  incrementVisit: Joi.boolean().optional(),
  isSessionEnd: Joi.boolean().optional()
});

/**
 * Lấy hồ sơ dài hạn của khách quen
 * GET /api/guest-profile/me
 */
exports.getMyProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập hồ sơ khách quen' });
  }

  const cacheKey = `guest_profile:${userId}`;
  try {
    if (redis && typeof redis.get === 'function') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
      }
    }
  } catch (_) { /* cache miss */ }

  try {
    const { data, error } = await supabase
      .from('guest_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = Not found
      console.warn('[guestProfile] Query error:', error.message);
      throw error;
    }

    const profile = data || {
      user_id: userId,
      allergies: [],
      dietary_preferences: {},
      favorite_dishes: [],
      spice_preference: 'vừa',
      preferred_zone: null,
      special_notes: null,
      special_dates: [],
      visit_count: 1
    };

    try {
      if ((!error || error.code === 'PGRST116') && redis && typeof redis.set === 'function') {
        await redis.set(cacheKey, JSON.stringify(profile), { EX: CACHE_TTL_SECONDS });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, data: profile, cached: false });
  } catch (err) {
    console.error('[guestProfile] getMyProfile error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy hồ sơ khách quen' });
  }
};

/**
 * Cập nhật hồ sơ dài hạn của khách quen
 * PUT /api/guest-profile/me
 */
exports.updateMyProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để cập nhật hồ sơ' });
  }

  const { error, value } = profileUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu cập nhật hồ sơ không hợp lệ',
      details: error.details.map(d => d.message)
    });
  }

  try {
    // 1. Phân biệt người dùng chủ động sửa vs AI tự động trích xuất:
    // - Khi người dùng chủ động cập nhật qua PUT /api/guest-profile/me:
    //   Nếu gửi 'allergies' (kể cả mảng rỗng []), cho phép ghi đè (Explicit Overwrite)
    //   để người dùng có thể xóa bỏ dị ứng bị gán nhầm.
    // - Nếu không gửi 'allergies', bảo lưu mảng dị ứng hiện tại trong CSDL.
    let targetAllergies;
    if (value.allergies !== undefined) {
      targetAllergies = normalizeList(value.allergies);
    } else {
      const { data: currentProfile, error: readErr } = await supabase
        .from('guest_profiles')
        .select('allergies')
        .eq('user_id', userId)
        .single();
      if (readErr && readErr.code !== 'PGRST116') {
        console.warn('[guestProfile] updateMyProfile read error:', readErr.message);
        throw readErr;
      }
      targetAllergies = normalizeList(currentProfile?.allergies || []);
    }

    const cleanFavorites = value.favorite_dishes !== undefined
      ? normalizeFavorites(value.favorite_dishes)
      : undefined;

    const upsertData = {
      user_id: userId,
      ...value,
      allergies: targetAllergies,
      ...(cleanFavorites !== undefined && { favorite_dishes: cleanFavorites }),
      updated_at: new Date().toISOString()
    };

    const { data, error: upsertErr } = await supabase
      .from('guest_profiles')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertErr) {
      throw upsertErr;
    }

    // Invalidate Redis cache
    const cacheKey = `guest_profile:${userId}`;
    try {
      if (redis && typeof redis.del === 'function') {
        await redis.del(cacheKey);
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ khách quen thành công',
      data: data
    });
  } catch (err) {
    console.error('[guestProfile] updateMyProfile error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật hồ sơ khách quen' });
  }
};

/**
 * Lấy các mẩu ký ức hồi tưởng (Recall Memory)
 * GET /api/guest-profile/memories
 */
exports.getMyMemories = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
  }

  try {
    const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 20, 1), 100);

    let query = supabase
      .from('guest_memories')
      .select('id, memory_type, content, metadata, created_at')
      .eq('user_id', userId);

    if (req.query?.memory_type) {
      query = query.eq('memory_type', req.query.memory_type);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[guestProfile] getMyMemories error:', error.message);
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[guestProfile] getMyMemories error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy ký ức' });
  }
};

/**
 * Endpoint xử lý tóm tắt phiên ngầm (Session Summary Ingestion)
 * POST /api/guest-profile/session-summary
 * Được gọi bởi tác vụ nền hoặc AI Service sau khi kết thúc phiên
 */
exports.ingestSessionSummary = async (req, res) => {
  const { error, value } = sessionSummarySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Payload không hợp lệ', details: error.details });
  }

  const { userId, sessionId, detectedAllergies, detectedSpice, detectedZone, favoriteDishes, newSpecialNotes, memoryFacts } = value;

  try {
    // 1. Lấy profile hiện tại
    const { data: current, error: readErr } = await supabase
      .from('guest_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (readErr && readErr.code !== 'PGRST116') {
      console.warn('[guestProfile] ingestSessionSummary query error:', readErr.message);
      throw readErr;
    }

    // Chuẩn hóa và thực thi Allergy Safety Latch (Union không trùng lặp hoa/thường)
    const existingAllergies = normalizeList(current?.allergies || []);
    const newAllergies = normalizeList(detectedAllergies || []);
    const mergedAllergies = Array.from(new Set([...existingAllergies, ...newAllergies])).sort();

    const existingFavorites = normalizeFavorites(current?.favorite_dishes || []);
    const newFavorites = normalizeFavorites(favoriteDishes || []);
    const mergedFavorites = normalizeFavorites([...existingFavorites, ...newFavorites]);

    // Cơ chế Idempotent cho visit_count: Chỉ tăng 1 lần cho mỗi phiên (sessionId)
    let newVisitCount;
    if (!current) {
      newVisitCount = 1;
    } else if (value.incrementVisit === false) {
      newVisitCount = current.visit_count || 1;
    } else if (sessionId) {
      const sessionCountedKey = `session_counted:${userId}:${sessionId}`;
      try {
        if (redis && typeof redis.set === 'function') {
          const lockResult = await redis.set(sessionCountedKey, '1', { NX: true, EX: 86400 });
          newVisitCount = (lockResult === 'OK') ? ((current.visit_count || 1) + 1) : (current.visit_count || 1);
        } else {
          // Fallback khi không có Redis: Kiểm tra xem session này đã từng được lưu ký ức trước đó chưa
          const { data: existingSessionMemory } = await supabase
            .from('guest_memories')
            .select('id')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .limit(1);
          const isFirstInSession = !existingSessionMemory || existingSessionMemory.length === 0;
          newVisitCount = isFirstInSession ? ((current.visit_count || 1) + 1) : (current.visit_count || 1);
        }
      } catch (_) {
        newVisitCount = current.visit_count || 1;
      }
    } else {
      newVisitCount = (current.visit_count || 1) + 1;
    }

    const updatePayload = {
      user_id: userId,
      allergies: mergedAllergies,
      favorite_dishes: mergedFavorites,
      spice_preference: detectedSpice || current?.spice_preference || 'vừa',
      preferred_zone: detectedZone || current?.preferred_zone || null,
      special_notes: newSpecialNotes || current?.special_notes || null,
      visit_count: newVisitCount,
      last_visit: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase.from('guest_profiles').upsert(updatePayload, { onConflict: 'user_id' });

    // 2. Thêm các fact ký ức vào guest_memories kèm vector embedding 768 chiều (pgvector)
    if (memoryFacts && memoryFacts.length > 0) {
      const memoryRows = [];
      for (const fact of memoryFacts) {
        if (!fact || typeof fact !== 'string' || !fact.trim()) continue;
        const cleanFact = fact.trim();
        let embedding = null;
        try {
          embedding = await getEmbedding(cleanFact, 768);
        } catch (_) {}

        memoryRows.push({
          user_id: userId,
          session_id: sessionId || null,
          memory_type: 'conversation_fact',
          content: cleanFact,
          embedding: (Array.isArray(embedding) && embedding.length === 768) ? embedding : null,
          metadata: { source: 'session_summarizer' }
        });
      }

      if (memoryRows.length > 0) {
        await supabase.from('guest_memories').insert(memoryRows);
      }
    }

    // 3. Xoá Redis cache để lượt sau nạp ngay dữ liệu mới
    if (redis && typeof redis.del === 'function') {
      await redis.del(`guest_profile:${userId}`).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Đã tổng hợp phiên ngầm và cập nhật MemGPT Archival Memory thành công'
    });
  } catch (err) {
    console.error('[guestProfile] ingestSessionSummary error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi ghi nhận tóm tắt phiên' });
  }
};
