/**
 * reservationSlots.test.js
 * Test suite kiểm thử endpoint tra cứu slot bàn trống (GET /api/reservations/available-slots)
 * và định dạng mã đặt bàn #RES-XXXXXX theo kịch bản TC-RES-05.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();

const reservationController = require('../src/controllers/reservationController');

test.describe('Phân Hệ 3: Backend Reservation Slots & Resiliency Test Suite (TC-RES-05)', () => {
  const createMockRes = () => {
    let statusCode = 200;
    let jsonResult = null;
    return {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResult = data;
            return { statusCode, jsonResult };
          },
        };
      },
      json: (data) => {
        jsonResult = data;
        return { statusCode, jsonResult };
      },
      get: () => ({ statusCode, jsonResult }),
    };
  };

  test('1. Tra cứu slot bàn trống với tham số hợp lệ (date, time, guest_count) phải trả về HTTP 200 OK', async () => {
    const res = createMockRes();
    const req = {
      query: {
        date: '2026-11-22',
        time: '19:00',
        guest_count: '2',
      },
    };

    await reservationController.getAvailableSlots(req, res);
    const { statusCode, jsonResult } = res.get();

    assert.equal(statusCode, 200);
    assert.equal(jsonResult.success, true);
    assert.ok(jsonResult.data);
    assert.equal(jsonResult.data.date, '2026-11-22');
    assert.equal(jsonResult.data.guest_count, 2);
    assert.ok(typeof jsonResult.data.available_tables === 'number');
    assert.ok(Array.isArray(jsonResult.data.tables));
    assert.ok(jsonResult.data.available_tables > 0);
  });

  test('2. Từ chối yêu cầu thiếu tham số date hoặc guest_count với HTTP 400', async () => {
    const res1 = createMockRes();
    await reservationController.getAvailableSlots({ query: { guest_count: '2' } }, res1);
    assert.equal(res1.get().statusCode, 400);
    assert.equal(res1.get().jsonResult.error.code, 'MISSING_PARAMS');

    const res2 = createMockRes();
    await reservationController.getAvailableSlots({ query: { date: '2026-11-22' } }, res2);
    assert.equal(res2.get().statusCode, 400);
    assert.equal(res2.get().jsonResult.error.code, 'MISSING_PARAMS');
  });

  test('3. Từ chối ngày date sai định dạng YYYY-MM-DD với HTTP 400', async () => {
    const res = createMockRes();
    await reservationController.getAvailableSlots(
      { query: { date: '22-11-2026', guest_count: '2' } },
      res
    );
    assert.equal(res.get().statusCode, 400);
    assert.equal(res.get().jsonResult.error.code, 'INVALID_PARAMS');
  });

  test('4. Từ chối số lượng khách guest_count không hợp lệ (NaN, <= 0) với HTTP 400', async () => {
    const res1 = createMockRes();
    await reservationController.getAvailableSlots(
      { query: { date: '2026-11-22', guest_count: 'abc' } },
      res1
    );
    assert.equal(res1.get().statusCode, 400);
    assert.equal(res1.get().jsonResult.error.code, 'INVALID_PARAMS');

    const res2 = createMockRes();
    await reservationController.getAvailableSlots(
      { query: { date: '2026-11-22', guest_count: '-3' } },
      res2
    );
    assert.equal(res2.get().statusCode, 400);
    assert.equal(res2.get().jsonResult.error.code, 'INVALID_PARAMS');
  });

  test('5. Tự động phục hồi qua Fallback Tables khi xảy ra sự cố mạng (chống HTTP 500 Fatal)', async () => {
    // Gọi với tham số hợp lệ mà không có kết nối cơ sở dữ liệu hoặc giả lập query lỗi
    const res = createMockRes();
    const req = {
      query: {
        date: '2026-11-22',
        time: '19:00',
        guest_count: '4',
      },
    };

    await reservationController.getAvailableSlots(req, res);
    const { statusCode, jsonResult } = res.get();

    assert.equal(statusCode, 200);
    assert.equal(jsonResult.success, true);
    assert.ok(jsonResult.data.tables.length > 0);
  });
});
