/**
 * reservationSlots.test.js
 * Test suite kiểm thử endpoint tra cứu slot bàn trống (GET /api/reservations/available-slots)
 * và định dạng mã đặt bàn #RES-XXXXXX theo kịch bản TC-RES-05.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = require('../src/config/supabaseClient');
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
    // Lưu hàm gốc và giả lập sự cố mất kết nối mạng / CSDL Supabase (fetch failed)
    const originalFrom = supabase.from;
    try {
      supabase.from = () => {
        throw new Error('TypeError: fetch failed (Mocked Supabase network connection failure)');
      };

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

      // Kiểm tra tính tự phục hồi: không sập HTTP 500 mà trả về HTTP 200 OK qua Fallback Tables
      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.ok(jsonResult.data);
      assert.equal(jsonResult.data.guest_count, 4);
      assert.ok(jsonResult.data.tables.length > 0);

      // Xác minh các bàn trả về đúng là từ danh sách bàn dự phòng (DEFAULT_FALLBACK_TABLES)
      const fallbackTableNumbers = [
        'A1', 'A2', 'A3', 'A4', 'A5',
        'B1', 'B2', 'B3', 'B4', 'B5',
        'C1', 'C2', 'C3', 'C4', 'C5',
      ];
      assert.ok(
        jsonResult.data.tables.every((t) => fallbackTableNumbers.includes(t.table_number)),
        'Tất cả các bàn trả về phải thuộc danh sách Fallback Tables'
      );
    } finally {
      // Đảm bảo luôn khôi phục lại hàm gốc sau bài test
      supabase.from = originalFrom;
    }
  });
});
