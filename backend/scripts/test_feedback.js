/**
 * test_feedback.js
 * Unit/Integration Test cho feedbackController (Bước 4.2 Kế Hoạch 05)
 */

const feedbackController = require('../src/controllers/feedbackController');
const crypto = require('crypto');

// Mock req & res helpers
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('🧪 Bắt đầu kiểm thử feedbackController (Bước 4.2 - Telemetry & Feedback Loop)...');
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // --- Test 1: Validation lỗi khi thiếu sessionId / query ---
  {
    const req = {
      body: {
        feedbackType: 'thumbs_up'
        // thiếu sessionId và query
      }
    };
    const res = createMockRes();
    await feedbackController.submitFeedback(req, res);
    assert(res.statusCode === 400, 'Test 1.1: Trả về HTTP 400 khi thiếu thông tin bắt buộc');
    assert(res.data.success === false, 'Test 1.2: success === false');
    assert(res.data.errors && res.data.errors.length >= 2, 'Test 1.3: Trả về danh sách lỗi validation');
  }

  // --- Test 2: Ghi nhận Thumbs Up hợp lệ ---
  const testSessionId = crypto.randomUUID();
  {
    const req = {
      body: {
        sessionId: testSessionId,
        tableId: 'Table_5',
        query: 'Cho tôi 1 bát phở bò tái lăn',
        answer: 'Dạ quán có **Phở Bò Tái Lăn** 85,000đ rất ngon ạ!',
        feedbackType: 'thumbs_up',
        contextIds: ['dish_pho_bo_tai_lan_01'],
        comment: 'Gợi ý chuẩn xác'
      }
    };
    const res = createMockRes();
    const t0 = performance.now();
    await feedbackController.submitFeedback(req, res);
    const latency = performance.now() - t0;

    assert(res.statusCode === 201, 'Test 2.1: Trả về HTTP 201 khi Thumbs Up hợp lệ');
    assert(res.data.success === true, 'Test 2.2: success === true');
    assert(res.data.data.rating === 1, 'Test 2.3: rating tự động gán bằng 1 cho thumbs_up');
    assert(res.data.feedbackId !== undefined, 'Test 2.4: Sinh UUID feedbackId');
    assert(latency < 50.0, `Test 2.5: Độ trễ xử lý < 50ms (thực tế: ${latency.toFixed(2)}ms)`);
  }

  // --- Test 3: Ghi nhận Thumbs Down kèm rejectedItems ---
  {
    const req = {
      body: {
        sessionId: testSessionId,
        tableId: 'Table_5',
        query: 'Đổi món khác, tôi không thích phở bò',
        answer: 'Aria gợi ý món Bún Chả Hà Nội thay thế...',
        feedbackType: 'thumbs_down',
        rejectedItems: ['Phở Bò Tái Lăn'],
        contextIds: ['dish_bun_cha_02']
      }
    };
    const res = createMockRes();
    await feedbackController.submitFeedback(req, res);
    assert(res.statusCode === 201, 'Test 3.1: Trả về HTTP 201 khi Thumbs Down hợp lệ');
    assert(res.data.data.rating === -1, 'Test 3.2: rating tự động gán bằng -1 cho thumbs_down');
    assert(res.data.data.rejectedItems.includes('Phở Bò Tái Lăn'), 'Test 3.3: Lưu vết đúng rejectedItems');
  }

  // --- Test 4: Lấy danh sách phản hồi theo sessionId ---
  {
    const req = { params: { sessionId: testSessionId } };
    const res = createMockRes();
    await feedbackController.getFeedbacksBySession(req, res);
    assert(res.statusCode === 200, 'Test 4.1: Trả về HTTP 200 khi lấy feedback theo session');
    assert(res.data.success === true, 'Test 4.2: success === true');
    assert(res.data.count >= 2, `Test 4.3: Tìm thấy ít nhất 2 bản ghi cho session (thực tế: ${res.data.count})`);
  }

  // --- Test 5: Thống kê Telemetry Metrics (Stats) ---
  {
    const req = {};
    const res = createMockRes();
    await feedbackController.getFeedbackStats(req, res);
    assert(res.statusCode === 200, 'Test 5.1: Trả về HTTP 200 khi lấy thống kê stats');
    assert(res.data.success === true, 'Test 5.2: success === true');
    assert(res.data.stats.totalFeedback >= 2, `Test 5.3: Tổng số feedback >= 2 (thực tế: ${res.data.stats.totalFeedback})`);
    assert(res.data.stats.thumbsUp >= 1, `Test 5.4: Có ít nhất 1 thumbs up (thực tế: ${res.data.stats.thumbsUp})`);
    assert(res.data.stats.thumbsDown >= 1, `Test 5.5: Có ít nhất 1 thumbs down (thực tế: ${res.data.stats.thumbsDown})`);
    assert(typeof res.data.stats.satisfactionRatePct === 'number', 'Test 5.6: satisfactionRatePct có kiểu số');
  }

  console.log(`\n==================================================`);
  console.log(`🏁 Kết quả kiểm thử: ${passed} PASS, ${failed} FAIL`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error('Lỗi ngoại lệ trong test suite:', err);
  process.exit(1);
});
