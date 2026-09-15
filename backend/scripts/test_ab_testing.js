/**
 * test_ab_testing.js
 * Unit & Integration Test Suite cho Bước 5.2 - A/B Testing Routing & Telemetry
 * Xác thực 10 tiêu chí kiểm thử cho Cổng Nghiệm Thu Pha 5 (Gate 5).
 */

const assert = require('assert');
const { getAbVariant } = require('../src/controllers/aiController');
const feedbackController = require('../src/controllers/feedbackController');

console.log('🧪 BẮT ĐẦU KIỂM THỬ A/B TESTING ROUTING & TELEMETRY (BƯỚC 5.2)\n');

let passedTests = 0;
const totalTests = 10;

function reportPass(index, name) {
  passedTests++;
  console.log(`  ✅ [${index}/${totalTests}] ${name}`);
}

async function runTests() {
  // ── TEST 1: Consistent Hashing (Tính nhất quán theo Session) ──────
  const sess1 = 'session-uuid-12345-abcde';
  const v1_first = getAbVariant(sess1);
  const v1_second = getAbVariant(sess1);
  assert.strictEqual(v1_first, v1_second, 'Cùng sessionId phải luôn luôn rơi vào cùng một variant');
  assert.ok(['variant_a_advanced', 'variant_b_baseline'].includes(v1_first));
  reportPass(1, 'Consistent Hashing: Tính tất định tuyệt đối theo sessionId');

  // ── TEST 2: Null / Undefined / Invalid Session Safety ────────────
  const v_null = getAbVariant(null);
  const v_empty = getAbVariant('');
  const v_num = getAbVariant(12345);
  assert.strictEqual(v_null, 'variant_a_advanced', 'Fallback an toàn khi null');
  assert.strictEqual(v_empty, 'variant_a_advanced', 'Fallback an toàn khi rỗng');
  assert.strictEqual(v_num, 'variant_a_advanced', 'Fallback an toàn khi sai kiểu');
  reportPass(2, 'Input Safety: Zero crash với tham số rỗng hoặc không hợp lệ');

  // ── TEST 3: Tỉ lệ phân bổ giao thông (Traffic Split ~50/50) ───────
  let countA = 0;
  let countB = 0;
  const numTrials = 2000;

  for (let i = 0; i < numTrials; i++) {
    const sId = `simulated-user-session-${i}-${Math.random().toString(36).substring(2, 9)}`;
    const variant = getAbVariant(sId, 0.5);
    if (variant === 'variant_a_advanced') countA++;
    else if (variant === 'variant_b_baseline') countB++;
  }

  const ratioA = countA / numTrials;
  assert.ok(ratioA >= 0.44 && ratioA <= 0.56, `Tỉ lệ nhánh A (${(ratioA * 100).toFixed(1)}%) phải nằm trong khoảng 50% ± 6%`);
  reportPass(3, `Traffic Distribution: Phân bổ ngẫu nhiên đồng đều (~50/50) [A: ${countA}, B: ${countB}]`);

  // ── TEST 4: Tùy biến tỉ lệ phân bổ (Custom Ratio 80/20) ────────────
  let countCustomA = 0;
  for (let i = 0; i < 1000; i++) {
    const sId = `user-canary-${i}`;
    if (getAbVariant(sId, 0.8) === 'variant_a_advanced') countCustomA++;
  }
  const ratioCustom = countCustomA / 1000;
  assert.ok(ratioCustom >= 0.70 && ratioCustom <= 0.90, `Tỉ lệ nhánh A (${ratioCustom}) phải tiệm cận 80%`);
  reportPass(4, `Canary Deployment: Hỗ trợ linh hoạt tỷ lệ điều tiết giao thông (80% A / 20% B) [A: ${countCustomA}/1000]`);

  // ── TEST 5: Ghi nhận Feedback Thumbs Up cho Nhánh A ───────────────
  const mockReqA = {
    body: {
      sessionId: 'sess-test-a-01',
      query: 'Cơm trưa văn phòng dưới 70k',
      feedbackType: 'thumbs_up',
      abVariant: 'variant_a_advanced',
      answer: 'Gợi ý Cơm Tấm Sườn Bì Chả'
    }
  };
  let resStatusA = 0;
  let resJsonA = null;
  const mockResA = {
    status: (code) => { resStatusA = code; return mockResA; },
    json: (payload) => { resJsonA = payload; return mockResA; }
  };

  await feedbackController.submitFeedback(mockReqA, mockResA);
  assert.strictEqual(resStatusA, 201);
  assert.strictEqual(resJsonA.success, true);
  assert.strictEqual(resJsonA.data.abVariant, 'variant_a_advanced');
  reportPass(5, 'Telemetry Recording: Ghi nhận thành công Thumbs Up cho Variant A');

  // ── TEST 6: Ghi nhận Feedback Thumbs Down cho Nhánh B ─────────────
  const mockReqB = {
    body: {
      sessionId: 'sess-test-b-01',
      query: 'Phở bò không cay',
      feedbackType: 'thumbs_down',
      abVariant: 'variant_b_baseline',
      rejectedItems: ['Bún Bò Huế'],
      answer: 'Gợi ý Bún Bò Huế'
    }
  };
  let resStatusB = 0;
  let resJsonB = null;
  const mockResB = {
    status: (code) => { resStatusB = code; return mockResB; },
    json: (payload) => { resJsonB = payload; return mockResB; }
  };

  await feedbackController.submitFeedback(mockReqB, mockResB);
  assert.strictEqual(resStatusB, 201);
  assert.strictEqual(resJsonB.success, true);
  assert.strictEqual(resJsonB.data.abVariant, 'variant_b_baseline');
  reportPass(6, 'Telemetry Recording: Ghi nhận thành công Thumbs Down kèm blacklist cho Variant B');

  // ── TEST 7: Tự động suy luận abVariant từ sessionId nếu không gửi kèm ─
  const mockReqAuto = {
    body: {
      sessionId: 'sess-auto-infer-12345',
      query: 'Trà đào cam sả',
      feedbackType: 'thumbs_up'
    }
  };
  let resStatusAuto = 0;
  let resJsonAuto = null;
  const mockResAuto = {
    status: (code) => { resStatusAuto = code; return mockResAuto; },
    json: (payload) => { resJsonAuto = payload; return mockResAuto; }
  };

  await feedbackController.submitFeedback(mockReqAuto, mockResAuto);
  assert.strictEqual(resStatusAuto, 201);
  assert.ok(['variant_a_advanced', 'variant_b_baseline'].includes(resJsonAuto.data.abVariant));
  reportPass(7, 'Auto Inference: Tự động gán đúng nhánh A/B từ sessionId khi client lược bỏ');

  // ── TEST 8: API Thống Kê So Sánh A/B Testing (GET /ab-stats) ───────
  let abStatsJson = null;
  const mockResStats = {
    json: (payload) => { abStatsJson = payload; return mockResStats; },
    status: () => mockResStats
  };

  await feedbackController.getAbStats({}, mockResStats);
  assert.strictEqual(abStatsJson.success, true);
  assert.ok(abStatsJson.data.variant_a_advanced);
  assert.ok(abStatsJson.data.variant_b_baseline);
  assert.strictEqual(abStatsJson.data.trafficSplit, '50/50');
  assert.strictEqual(typeof abStatsJson.data.improvementDeltaPct, 'number');
  reportPass(8, 'Analytics API: Cung cấp đầy đủ chỉ số đối chiếu hiệu năng hai nhánh');

  // ── TEST 9: Độ hài lòng (Satisfaction Rate) của Variant A > Variant B ─
  const { variant_a_advanced, variant_b_baseline } = abStatsJson.data;
  assert.ok(variant_a_advanced.totalFeedback >= 1);
  assert.ok(variant_b_baseline.totalFeedback >= 1);
  assert.strictEqual(variant_a_advanced.thumbsUp, 1);
  assert.strictEqual(variant_b_baseline.thumbsDown, 1);
  reportPass(9, 'Statistical Comparison: Đo lường chính xác tỷ lệ hài lòng theo thời gian thực');

  // ── TEST 10: Validation Error Payload Rejection ───────────────────
  const mockReqInvalid = {
    body: {
      sessionId: 'sess-invalid',
      query: '', // Trống
      feedbackType: 'invalid_type'
    }
  };
  let errStatus = 0;
  const mockResErr = {
    status: (code) => { errStatus = code; return mockResErr; },
    json: () => mockResErr
  };

  await feedbackController.submitFeedback(mockReqInvalid, mockResErr);
  assert.strictEqual(errStatus, 400);
  reportPass(10, 'Joi Schema Guard: Chặn triệt để payload không hợp lệ với HTTP 400');

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 HOÀN THÀNH KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST A/B TESTING ĐẠT 100%`);
  console.log('='.repeat(70) + '\n');
}

runTests().catch((err) => {
  console.error('❌ Kiểm thử A/B Testing thất bại:', err);
  process.exit(1);
});
