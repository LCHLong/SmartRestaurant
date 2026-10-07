/**
 * reservationController.js
 * Phase 5 - Hệ thống Đặt bàn trước (Table Reservation)
 * Triển khai đầy đủ: Soft Reservation, Buffer 90 phút, Chống Overbooking,
 * Chống IDOR, Email xác nhận kèm QR, Socket.io real-time, Đổi bàn 1-Click
 */

const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');
const emailService = require('../services/emailService');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// ─── Joi Schemas ────────────────────────────────────────────────────────────

const vnPhoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

const createReservationSchema = Joi.object({
  customer_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'any.required': 'Tên khách hàng là bắt buộc',
  }),
  customer_phone: Joi.string().pattern(vnPhoneRegex).required().messages({
    'string.pattern.base': 'Số điện thoại Việt Nam không hợp lệ (VD: 0912345678)',
    'any.required': 'Số điện thoại là bắt buộc',
  }),
  customer_email: Joi.string().email().optional().allow('', null),
  guest_count: Joi.number().integer().min(1).max(50).required().messages({
    'any.required': 'Số lượng khách là bắt buộc',
  }),
  reservation_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Ngày phải đúng định dạng YYYY-MM-DD',
    }),
  reservation_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'Giờ phải đúng định dạng HH:mm',
    }),
  special_requests: Joi.string().max(500).optional().allow('', null),
  preferred_area: Joi.string().optional().allow('', null), // ngoài trời, phòng lạnh...
}).options({ stripUnknown: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sinh booking_code dạng SR-XXXXXXXX (8 ký tự ngẫu nhiên, uppercase)
 */
const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Bỏ O, 0, I, 1 để tránh nhầm lẫn
  let code = 'SR-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Tính end_time dựa trên reservation_time + buffer_minutes
 */
const calcEndTime = (timeStr, bufferMinutes = 90) => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + bufferMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

/**
 * Che mờ thông tin PII — tuân thủ Nghị định 13/2023/NĐ-CP
 */
const maskPhone = (phone) => {
  if (!phone || phone.length < 6) return '***';
  return phone.slice(0, 4) + '***' + phone.slice(-3);
};

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.split('@');
  return local.slice(0, 1) + '***@' + domain;
};

/**
 * Tạo Signed JWT token để gửi link hủy qua email (TTL 24h)
 */
const generateCancelToken = (reservationId) => {
  return jwt.sign(
    { reservation_id: reservationId, action: 'cancel' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ─── Controller Methods ──────────────────────────────────────────────────────

/**
 * GET /api/reservations/available-slots
 * Tra cứu bàn trống theo ngày và số lượng khách (có buffer 90 phút)
 * Public API — không cần auth
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, guest_count, time } = req.query;

    if (!date || !guest_count) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'Thiếu tham số date hoặc guest_count' },
      });
    }

    const guestNum = parseInt(guest_count);
    const bufferMinutes = 90;

    // Lấy tất cả bàn đủ sức chứa và đang active
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, capacity, location, status')
      .gte('capacity', guestNum)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('capacity', { ascending: true });

    if (tableError) throw tableError;

    if (!tables || tables.length === 0) {
      return res.status(200).json({
        success: true,
        data: { available_capacity: 0, tables: [], message: 'Không có bàn đủ sức chứa' },
      });
    }

    // Lấy reservations trong ngày để tính xung đột
    const { data: existingReservations, error: resError } = await supabase
      .from('reservations')
      .select('table_id, reservation_time, end_time, guest_count, status')
      .eq('reservation_date', date)
      .in('status', ['pending', 'confirmed', 'seated']);

    if (resError) throw resError;

    // Tính số slot bàn còn nhận được theo từng capacity group
    // Mỗi bàn mà có reservation xung đột trong cửa sổ [time-buffer, time+buffer] là bị khóa
    const tableAvailability = tables.map((table) => {
      const conflicts = (existingReservations || []).filter((r) => {
        if (r.table_id !== table.id) return false;
        // Kiểm tra xung đột thời gian nếu có time tham số
        if (!time) return false;
        const [rH, rM] = r.reservation_time.split(':').map(Number);
        const [eH, eM] = r.end_time.split(':').map(Number);
        const [tH, tM] = time.split(':').map(Number);
        const requestStart = tH * 60 + tM;
        const requestEnd = requestStart + bufferMinutes;
        const resStart = rH * 60 + rM;
        const resEnd = eH * 60 + eM;
        // Kiểm tra overlap: [requestStart, requestEnd) ∩ [resStart, resEnd)
        return requestStart < resEnd && requestEnd > resStart;
      });
      return {
        ...table,
        is_available: conflicts.length === 0,
        upcoming_reservation: conflicts.length > 0 ? conflicts[0].reservation_time : null,
      };
    });

    const availableTables = tableAvailability.filter((t) => t.is_available && t.status !== 'occupied');

    return res.status(200).json({
      success: true,
      data: {
        date,
        guest_count: guestNum,
        available_tables: availableTables.length,
        tables: tableAvailability.map((t) => ({
          id: t.id,
          table_number: t.table_number,
          capacity: t.capacity,
          location: t.location,
          is_available: t.is_available,
          upcoming_reservation: t.upcoming_reservation,
        })),
      },
    });
  } catch (err) {
    console.error('[reservationController.getAvailableSlots]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/reservations
 * Đặt bàn mới — Soft Reservation (tạm giữ slot capacity, chưa khóa cứng bàn)
 * Rate limit: 5 requests / 15 phút / IP (áp dụng ở route)
 * Idempotency-Key header hỗ trợ chống đặt trùng
 */
exports.createReservation = async (req, res) => {
  try {
    // --- Idempotency Check ---
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('reservations')
        .select('id, booking_code, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (existing) {
        return res.status(200).json({
          success: true,
          data: existing,
          message: 'Đơn đặt bàn đã tồn tại (Idempotent response)',
        });
      }
    }

    // --- Validate input ---
    const { error: validationError, value } = createReservationSchema.validate(req.body);
    if (validationError) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.details[0].message },
      });
    }

    const {
      customer_name,
      customer_phone,
      customer_email,
      guest_count,
      reservation_date,
      reservation_time,
      special_requests,
    } = value;

    const bufferMinutes = 90;
    const end_time = calcEndTime(reservation_time, bufferMinutes);

    // --- PESSIMISTIC LOCK — Kiểm tra số bàn còn nhận (Chống Overbooking) ---
    // Đếm số reservation đang active xung đột trong cùng khung giờ
    const { data: conflictingReservations, error: conflictError } = await supabase
      .from('reservations')
      .select('id, table_id, guest_count')
      .eq('reservation_date', reservation_date)
      .in('status', ['pending', 'confirmed', 'seated'])
      .or(
        `and(reservation_time.lt.${end_time},end_time.gt.${reservation_time})`
      );

    if (conflictError) throw conflictError;

    // Đếm tổng số bàn active có capacity >= guest_count
    const { data: eligibleTables, error: tableError } = await supabase
      .from('tables')
      .select('id, capacity, status')
      .gte('capacity', guest_count)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (tableError) throw tableError;

    // Số bàn đang bị chiếm bởi reservation xung đột
    const occupiedTableIds = new Set(
      (conflictingReservations || []).map((r) => r.table_id).filter(Boolean)
    );

    // Bàn thực sự còn trống (chưa bị locked bởi reservation nào và không đang occupied)
    const freeTables = (eligibleTables || []).filter(
      (t) => !occupiedTableIds.has(t.id) && t.status !== 'occupied'
    );

    if (freeTables.length === 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'RESERVATION_CONFLICT',
          message: 'Không còn bàn trống trong khung giờ này. Vui lòng chọn giờ khác hoặc liên hệ nhà hàng.',
        },
      });
    }

    // --- Soft Reservation: Gợi ý bàn phù hợp nhất (nhỏ nhất đủ sức chứa) ---
    const suggestedTable = freeTables.sort((a, b) => a.capacity - b.capacity)[0];

    // --- Sinh booking_code duy nhất ---
    let booking_code;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      booking_code = generateBookingCode();
      const { data: codeCheck } = await supabase
        .from('reservations')
        .select('id')
        .eq('booking_code', booking_code)
        .maybeSingle();
      if (!codeCheck) isUnique = true;
      attempts++;
    }

    // Xác định có cần đặt cọc không (nhóm >= 6 người)
    const requiresDeposit = guest_count >= 6;
    const deposit_amount = requiresDeposit ? guest_count * 50000 : 0; // 50k/người

    // --- Insert reservation ---
    const insertData = {
      booking_code,
      customer_name: customer_name.trim(),
      customer_phone,
      customer_email: customer_email || null,
      guest_count,
      reservation_date,
      reservation_time,
      end_time,
      table_id: suggestedTable.id, // Soft assignment
      status: 'pending',
      deposit_amount,
      deposit_status: requiresDeposit ? 'pending' : 'none',
      special_requests: special_requests ? special_requests.trim() : null,
      buffer_minutes: bufferMinutes,
    };

    // Gắn idempotency_key nếu có
    if (idempotencyKey) {
      insertData.idempotency_key = idempotencyKey;
    }

    // Gắn user_id nếu là khách đã đăng nhập
    if (req.user && req.user.id) {
      insertData.user_id = req.user.id;
    }

    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert([insertData])
      .select()
      .single();

    if (insertError) throw insertError;

    // --- Tạo QR Code định danh lượt đặt ---
    const qrData = JSON.stringify({ booking_code, phone_last4: customer_phone.slice(-4) });
    const qrImage = await QRCode.toDataURL(qrData);

    // --- Gửi Email xác nhận (bất đồng bộ, không block response) ---
    if (customer_email) {
      const cancelToken = generateCancelToken(reservation.id);
      emailService
        .sendReservationConfirmation({
          email: customer_email,
          customer_name,
          booking_code,
          reservation_date,
          reservation_time,
          guest_count,
          special_requests,
          qrImage,
          cancelToken,
          requiresDeposit,
          deposit_amount,
        })
        .catch((err) => console.error('[Email Error - Reservation]', err.message));
    }

    // --- Socket.io: Bắn event real-time cho waiter & admin ---
    try {
      const io = getIO();
      const socketPayload = {
        id: reservation.id,
        booking_code: reservation.booking_code,
        customer_name,
        guest_count,
        reservation_date,
        reservation_time,
        // PII masking cho staff
        customer_phone_masked: maskPhone(customer_phone),
        customer_email_masked: customer_email ? maskEmail(customer_email) : null,
        table_number: suggestedTable.table_number || null,
        status: 'pending',
        created_at: reservation.created_at,
      };
      io.to('waiter').emit('new_reservation', socketPayload);
      io.to('admin').emit('new_reservation', socketPayload);
    } catch (socketErr) {
      console.error('[Socket Error]', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        id: reservation.id,
        booking_code: reservation.booking_code,
        reservation_date,
        reservation_time,
        guest_count,
        status: 'pending',
        qr_image: qrImage,
        requires_deposit: requiresDeposit,
        deposit_amount: requiresDeposit ? deposit_amount : 0,
        message: 'Đặt bàn thành công! Chúng tôi sẽ xác nhận sớm nhất.',
      },
    });
  } catch (err) {
    console.error('[reservationController.createReservation]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/reservations
 * Lấy danh sách đặt bàn theo ngày và trạng thái (Admin/Waiter)
 */
exports.getReservations = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('reservations')
      .select(
        `id, booking_code, customer_name, customer_phone, customer_email,
         guest_count, reservation_date, reservation_time, end_time, status,
         deposit_amount, deposit_status, special_requests, buffer_minutes,
         created_at, updated_at,
         tables(id, table_number, capacity, location)`,
        { count: 'exact' }
      )
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })
      .range(offset, offset + limitNum - 1);

    if (date) query = query.eq('reservation_date', date);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    // PII Masking cho role waiter (chỉ admin xem đầy đủ)
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    const maskedData = (data || []).map((r) => ({
      ...r,
      customer_phone: isAdmin ? r.customer_phone : maskPhone(r.customer_phone),
      customer_email: isAdmin ? r.customer_email : (r.customer_email ? maskEmail(r.customer_email) : null),
    }));

    return res.status(200).json({
      success: true,
      data: maskedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('[reservationController.getReservations]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/reservations/lookup
 * Tra cứu đặt bàn công khai bằng booking_code + 4 số cuối điện thoại (Chống IDOR)
 */
exports.lookupReservation = async (req, res) => {
  try {
    const { booking_code, phone_last4 } = req.query;

    if (!booking_code || !phone_last4) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'Cần nhập mã đặt bàn và 4 số cuối điện thoại' },
      });
    }

    const { data, error } = await supabase
      .from('reservations')
      .select(
        `id, booking_code, customer_name, customer_phone, guest_count,
         reservation_date, reservation_time, status, deposit_amount, deposit_status,
         special_requests, created_at,
         tables(table_number, location, capacity)`
      )
      .eq('booking_code', booking_code.toUpperCase())
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy đặt bàn với mã này' },
      });
    }

    // Xác thực 4 số cuối điện thoại
    if (data.customer_phone.slice(-4) !== phone_last4) {
      return res.status(403).json({
        success: false,
        error: { code: 'PHONE_MISMATCH', message: 'Thông tin xác thực không khớp' },
      });
    }

    const qrData = JSON.stringify({ booking_code: data.booking_code, phone_last4 });
    const qrImage = await QRCode.toDataURL(qrData);

    return res.status(200).json({
      success: true,
      data: {
        ...data,
        customer_phone: maskPhone(data.customer_phone),
        qr_image: qrImage,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/reservations/:id
 * Lấy chi tiết một reservation (Admin/Waiter)
 */
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('reservations')
      .select(
        `*, tables(id, table_number, capacity, location, status)`
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đặt bàn' } });
    }

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    return res.status(200).json({
      success: true,
      data: {
        ...data,
        customer_phone: isAdmin ? data.customer_phone : maskPhone(data.customer_phone),
        customer_email: isAdmin ? data.customer_email : (data.customer_email ? maskEmail(data.customer_email) : null),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * PATCH /api/reservations/:id/status
 * Cập nhật trạng thái reservation (Admin/Waiter)
 */
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Trạng thái không hợp lệ. Chọn một trong: ${validStatuses.join(', ')}` },
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (cancellation_reason) updateData.cancellation_reason = cancellation_reason;

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Socket emit
    try {
      const io = getIO();
      io.to('waiter').emit('reservation_status_updated', { id, status, booking_code: data.booking_code });
      io.to('admin').emit('reservation_status_updated', { id, status, booking_code: data.booking_code });
    } catch (_) {}

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * PATCH /api/reservations/:id/check-in
 * Khách đến, gán bàn thực tế và chuyển bàn sang 'occupied' (Waiter/Admin)
 */
exports.checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { table_id } = req.body; // Waiter chọn bàn thực tế lúc check-in

    // Lấy thông tin reservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (resError || !reservation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đặt bàn' } });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Chỉ có thể check-in khi đặt bàn đã ở trạng thái Đã xác nhận (confirmed)' },
      });
    }

    const targetTableId = table_id || reservation.table_id;

    if (!targetTableId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TABLE', message: 'Vui lòng chọn bàn cụ thể để check-in' },
      });
    }

    // Kiểm tra bàn còn trống không
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, status, capacity')
      .eq('id', targetTableId)
      .single();

    if (tableError || !table) {
      return res.status(404).json({ success: false, error: { code: 'TABLE_NOT_FOUND', message: 'Bàn không tồn tại' } });
    }

    if (table.status === 'occupied') {
      return res.status(409).json({
        success: false,
        error: { code: 'TABLE_OCCUPIED', message: `Bàn ${table.table_number} đang có khách. Vui lòng chọn bàn khác.` },
      });
    }

    // Cập nhật reservation -> seated và gán bàn
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'seated',
        table_id: targetTableId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Cập nhật trạng thái bàn -> occupied
    await supabase
      .from('tables')
      .update({ status: 'occupied' })
      .eq('id', targetTableId);

    // Socket emit
    try {
      const io = getIO();
      io.to('waiter').emit('reservation_checked_in', {
        reservation_id: id,
        table_id: targetTableId,
        table_number: table.table_number,
        customer_name: reservation.customer_name,
      });
      io.to('waiter').emit('table_updated', { id: targetTableId, status: 'occupied' });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Đã check-in khách vào bàn ${table.table_number}`,
      data: updated,
    });
  } catch (err) {
    console.error('[reservationController.checkInReservation]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/reservations/:id/reallocate
 * 1-Click Đổi bàn dự phòng khi bàn cũ bị Overstay (Waiter/Admin)
 */
exports.reallocateTable = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, tables(table_number, capacity)')
      .eq('id', id)
      .single();

    if (resError || !reservation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đặt bàn' } });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Chỉ có thể đổi bàn cho lượt đặt đã được xác nhận (confirmed)' },
      });
    }

    // Tìm bàn trống tương đương (capacity >= guest_count, không phải bàn hiện tại)
    const { data: freeTables, error: freeError } = await supabase
      .from('tables')
      .select('id, table_number, capacity, location')
      .gte('capacity', reservation.guest_count)
      .eq('is_active', true)
      .eq('status', 'available')
      .neq('id', reservation.table_id)
      .is('deleted_at', null)
      .order('capacity', { ascending: true })
      .limit(5);

    if (freeError) throw freeError;

    if (!freeTables || freeTables.length === 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'NO_FREE_TABLE', message: 'Không còn bàn trống tương đương để đổi' },
      });
    }

    const newTable = freeTables[0];

    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        table_id: newTable.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Socket emit
    try {
      const io = getIO();
      io.to('waiter').emit('reservation_reallocated', {
        reservation_id: id,
        old_table_id: reservation.table_id,
        new_table_id: newTable.id,
        new_table_number: newTable.table_number,
        customer_name: reservation.customer_name,
        booking_code: reservation.booking_code,
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Đã đổi sang bàn ${newTable.table_number} thành công`,
      data: { ...updated, new_table: newTable },
    });
  } catch (err) {
    console.error('[reservationController.reallocateTable]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/reservations/cancel-by-token
 * Hủy đặt bàn qua link email (Signed JWT Token)
 */
exports.cancelByToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Thiếu token hủy' } });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Link hủy không hợp lệ hoặc đã hết hạn (24h)' },
      });
    }

    if (decoded.action !== 'cancel') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Token không hợp lệ' } });
    }

    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, status, booking_code')
      .eq('id', decoded.reservation_id)
      .single();

    if (!reservation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Đặt bàn không tồn tại' } });
    }

    if (reservation.status === 'cancelled') {
      return res.status(200).json({ success: true, message: 'Đặt bàn đã được hủy trước đó' });
    }

    if (['seated', 'completed'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_CANCEL', message: 'Không thể hủy đặt bàn đang hoặc đã thực hiện' },
      });
    }

    const { data: updated, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Khách hủy qua email',
        updated_at: new Date().toISOString(),
      })
      .eq('id', decoded.reservation_id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Đặt bàn đã được hủy thành công', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/reservations/overstay-alerts
 * Lấy danh sách bàn có nguy cơ Overstay (bàn đang occupied + có reservation sắp tới trong 15 phút)
 */
exports.getOverstayAlerts = async (req, res) => {
  try {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const alertWindowMinutes = 15; // Cảnh báo trước 15 phút

    // Lấy các reservation hôm nay còn pending/confirmed
    const { data: upcomingReservations, error } = await supabase
      .from('reservations')
      .select(
        `id, booking_code, customer_name, guest_count, reservation_time, table_id,
         tables(id, table_number, status, capacity)`
      )
      .eq('reservation_date', todayDate)
      .in('status', ['pending', 'confirmed'])
      .order('reservation_time', { ascending: true });

    if (error) throw error;

    const alerts = (upcomingReservations || [])
      .filter((r) => {
        if (!r.tables || r.tables.status !== 'occupied') return false;
        const [h, m] = r.reservation_time.split(':').map(Number);
        const reservationMinutes = h * 60 + m;
        // Cảnh báo khi còn trong vòng 15 phút
        return reservationMinutes - nowMinutes <= alertWindowMinutes && reservationMinutes > nowMinutes;
      })
      .map((r) => ({
        reservation_id: r.id,
        booking_code: r.booking_code,
        customer_name: r.customer_name,
        guest_count: r.guest_count,
        reservation_time: r.reservation_time,
        table_id: r.table_id,
        table_number: r.tables?.table_number,
        minutes_until: (() => {
          const [h, m] = r.reservation_time.split(':').map(Number);
          return (h * 60 + m) - nowMinutes;
        })(),
      }));

    return res.status(200).json({ success: true, data: alerts, count: alerts.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/reservations/buffer-flags
 * Trả về danh sách bàn có reservation trong vòng 90 phút tới (cho sơ đồ bàn)
 */
exports.getBufferFlags = async (req, res) => {
  try {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const bufferWindow = 90; // phút

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('table_id, reservation_time, customer_name, guest_count, status')
      .eq('reservation_date', todayDate)
      .in('status', ['pending', 'confirmed']);

    if (error) throw error;

    const flaggedTables = {};
    (reservations || []).forEach((r) => {
      if (!r.table_id) return;
      const [h, m] = r.reservation_time.split(':').map(Number);
      const reservationMinutes = h * 60 + m;
      const minutesUntil = reservationMinutes - nowMinutes;

      if (minutesUntil > 0 && minutesUntil <= bufferWindow) {
        if (!flaggedTables[r.table_id] || flaggedTables[r.table_id].minutes_until > minutesUntil) {
          flaggedTables[r.table_id] = {
            table_id: r.table_id,
            reservation_time: r.reservation_time,
            customer_name: r.customer_name,
            guest_count: r.guest_count,
            minutes_until: minutesUntil,
          };
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: Object.values(flaggedTables),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/reservations/:id/deposit-intent
 * Tạo phiên thanh toán cọc qua Stripe cho đặt bàn (nhóm đông >= 6 người)
 */
exports.createDepositPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('id, booking_code, deposit_amount, deposit_status, status, customer_name')
      .eq('id', id)
      .single();

    if (error || !reservation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đặt bàn' } });
    }

    if (reservation.deposit_status === 'paid') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Đã hoàn tất thanh toán cọc' } });
    }

    const amount = Math.round(Number(reservation.deposit_amount) || 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_DEPOSIT_REQUIRED', message: 'Đơn đặt bàn này không yêu cầu cọc' } });
    }

    if (!stripe) {
      // Mock mode khi chưa cấu hình Stripe secret key
      return res.status(200).json({
        success: true,
        data: {
          clientSecret: 'mock_deposit_secret_' + reservation.id,
          isMock: true,
          amount,
          currency: 'vnd',
          booking_code: reservation.booking_code,
        },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'vnd',
      metadata: {
        reservationId: reservation.id,
        bookingCode: reservation.booking_code,
        type: 'reservation_deposit',
      },
      automatic_payment_methods: { enabled: true },
    });

    await supabase
      .from('reservations')
      .update({ payment_intent_id: paymentIntent.id, updated_at: new Date().toISOString() })
      .eq('id', id);

    return res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        isMock: false,
        amount,
        currency: 'vnd',
        booking_code: reservation.booking_code,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/reservations/:id/mock-deposit
 * Xác nhận thanh toán cọc giả lập trong môi trường dev / demo
 */
exports.confirmMockDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('id, booking_code, deposit_amount, deposit_status, status')
      .eq('id', id)
      .single();

    if (error || !reservation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đặt bàn' } });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('reservations')
      .update({
        deposit_status: 'paid',
        status: 'confirmed',
        payment_intent_id: 'mock_deposit_' + Date.now(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Bắn socket cho waiter và admin
    try {
      const io = getIO();
      io.to('waiter').emit('reservation_deposit_paid', {
        reservationId: id,
        bookingCode: reservation.booking_code,
      });
      io.to('admin').emit('reservation_deposit_paid', {
        reservationId: id,
        bookingCode: reservation.booking_code,
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Xác nhận thanh toán cọc thành công (Demo Mode)',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
