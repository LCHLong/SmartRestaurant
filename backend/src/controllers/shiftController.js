/**
 * shiftController.js
 * Phase 5 - Hệ thống Quản lý ca làm việc (Staff Shift Scheduling)
 * Triển khai: CRUD shifts, Phân công lịch tuần, Đổi ca, Điểm danh QR động
 */

const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// ─── Joi Schemas ────────────────────────────────────────────────────────────

const createShiftSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({ 'any.required': 'Tên ca là bắt buộc' }),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .required()
    .messages({ 'string.pattern.base': 'Giờ bắt đầu phải đúng định dạng HH:mm' })
    .custom((val) => (val.length === 8 ? val.substring(0, 5) : val)),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .required()
    .messages({ 'string.pattern.base': 'Giờ kết thúc phải đúng định dạng HH:mm' })
    .custom((val) => (val.length === 8 ? val.substring(0, 5) : val)),
  min_staff: Joi.object({
    waiter: Joi.number().integer().min(0).default(2),
    kitchen: Joi.number().integer().min(0).default(2),
    admin: Joi.number().integer().min(0).default(1),
  })
    .default({ waiter: 2, kitchen: 2, admin: 1 })
    .optional(),
}).options({ stripUnknown: true });

const assignShiftSchema = Joi.object({
  shift_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().required(),
  shift_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Ngày phải đúng định dạng YYYY-MM-DD' }),
  notes: Joi.string().max(300).optional().allow('', null),
}).options({ stripUnknown: true });

const swapRequestSchema = Joi.object({
  assignment_id: Joi.string().uuid().required(),
  target_user_id: Joi.string().uuid().required(),
  reason: Joi.string().max(500).optional().allow('', null),
}).options({ stripUnknown: true });

// ─── Shifts CRUD ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/shifts
 * Lấy danh sách ca làm việc (Admin)
 */
exports.getShifts = async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = supabase.from('shifts').select('*').order('start_time', { ascending: true });
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/admin/shifts
 * Tạo ca mới (Admin)
 */
exports.createShift = async (req, res) => {
  try {
    const { error: validationError, value } = createShiftSchema.validate(req.body);
    if (validationError) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.details[0].message },
      });
    }

    const { data, error } = await supabase.from('shifts').insert([value]).select().single();
    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * PUT /api/admin/shifts/:id
 * Cập nhật ca (Admin)
 */
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = createShiftSchema.validate(req.body);
    if (validationError) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.details[0].message },
      });
    }

    const { data, error } = await supabase
      .from('shifts')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * DELETE /api/admin/shifts/:id
 * Xóa mềm ca (tắt is_active) — không xóa cứng do có FK
 */
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('shifts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Ca đã được vô hiệu hóa' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ─── Roster (Phân công lịch tuần) ────────────────────────────────────────────

/**
 * GET /api/admin/rosters
 * Lấy lịch trực tuần (Admin) — truyền week_start=YYYY-MM-DD
 */
exports.getRosters = async (req, res) => {
  try {
    const { week_start, week_end, user_id } = req.query;

    let query = supabase
      .from('shift_assignments')
      .select(
        `id, shift_date, status, check_in_time, check_out_time, notes,
         shifts(id, name, start_time, end_time, min_staff),
         users(id, full_name, email, role)`
      )
      .order('shift_date', { ascending: true });

    if (week_start) query = query.gte('shift_date', week_start);
    if (week_end) query = query.lte('shift_date', week_end);
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query;
    if (error) throw error;

    // Tổ chức dữ liệu theo ngày và ca
    const rosterMap = {};
    (data || []).forEach((assignment) => {
      const dateKey = assignment.shift_date;
      if (!rosterMap[dateKey]) rosterMap[dateKey] = {};

      const shiftId = assignment.shifts?.id;
      if (!rosterMap[dateKey][shiftId]) {
        rosterMap[dateKey][shiftId] = {
          shift: assignment.shifts,
          assignments: [],
        };
      }
      rosterMap[dateKey][shiftId].assignments.push({
        id: assignment.id,
        status: assignment.status,
        check_in_time: assignment.check_in_time,
        check_out_time: assignment.check_out_time,
        notes: assignment.notes,
        user: assignment.users,
      });
    });

    return res.status(200).json({ success: true, data: rosterMap, raw: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/admin/rosters/my-shifts
 * Xem lịch trực cá nhân của staff đang đăng nhập
 */
exports.getMyShifts = async (req, res) => {
  try {
    const { week_start, week_end } = req.query;
    const userId = req.user.id;

    let query = supabase
      .from('shift_assignments')
      .select(
        `id, shift_date, status, check_in_time, check_out_time, notes,
         shifts(id, name, start_time, end_time)`
      )
      .eq('user_id', userId)
      .order('shift_date', { ascending: true });

    if (week_start) query = query.gte('shift_date', week_start);
    if (week_end) query = query.lte('shift_date', week_end);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/admin/rosters/assign
 * Gán nhân viên vào ca trực (Admin) — kiểm tra trùng ca
 */
exports.assignShift = async (req, res) => {
  try {
    const { error: validationError, value } = assignShiftSchema.validate(req.body);
    if (validationError) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.details[0].message },
      });
    }

    const { shift_id, user_id, shift_date, notes } = value;

    // Kiểm tra nhân viên đã có trong ca này chưa
    const { data: existing } = await supabase
      .from('shift_assignments')
      .select('id')
      .eq('user_id', user_id)
      .eq('shift_id', shift_id)
      .eq('shift_date', shift_date)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ASSIGNMENT', message: 'Nhân viên đã được phân ca này trong ngày này' },
      });
    }

    // Kiểm tra nhân viên không bị xếp 2 ca cùng lúc (chồng giờ)
    const { data: dayShifts } = await supabase
      .from('shift_assignments')
      .select('id, shifts(start_time, end_time)')
      .eq('user_id', user_id)
      .eq('shift_date', shift_date)
      .not('status', 'eq', 'swapped');

    const { data: newShiftData } = await supabase.from('shifts').select('start_time, end_time').eq('id', shift_id).single();

    if (newShiftData && dayShifts && dayShifts.length > 0) {
      const [nSH, nSM] = newShiftData.start_time.split(':').map(Number);
      const [nEH, nEM] = newShiftData.end_time.split(':').map(Number);
      const newStart = nSH * 60 + nSM;
      const newEnd = nEH * 60 + nEM;

      for (const existing of dayShifts) {
        if (!existing.shifts) continue;
        const [eSH, eSM] = existing.shifts.start_time.split(':').map(Number);
        const [eEH, eEM] = existing.shifts.end_time.split(':').map(Number);
        const existStart = eSH * 60 + eSM;
        const existEnd = eEH * 60 + eEM;

        if (newStart < existEnd && newEnd > existStart) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'SHIFT_OVERLAP',
              message: `Nhân viên đã có ca trực xung đột giờ trong ngày ${shift_date}`,
            },
          });
        }
      }
    }

    const { data, error } = await supabase
      .from('shift_assignments')
      .insert([{ shift_id, user_id, shift_date, notes, status: 'scheduled' }])
      .select(
        `id, shift_date, status,
         shifts(id, name, start_time, end_time),
         users(id, full_name, email, role)`
      )
      .single();

    if (error) throw error;

    // Notify nhân viên qua socket nếu có
    try {
      const io = getIO();
      io.to(`user_${user_id}`).emit('shift_assigned', { assignment: data });
    } catch (_) {}

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[shiftController.assignShift]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * DELETE /api/admin/rosters/:id
 * Hủy phân công ca (Admin)
 */
exports.removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('shift_assignments').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Đã hủy phân công ca' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ─── Shift Swap (Đổi ca) ─────────────────────────────────────────────────────

/**
 * POST /api/shifts/swap-requests
 * Nhân viên gửi yêu cầu đổi ca
 */
exports.createSwapRequest = async (req, res) => {
  try {
    const { error: validationError, value } = swapRequestSchema.validate(req.body);
    if (validationError) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.details[0].message },
      });
    }

    const { assignment_id, target_user_id, reason } = value;
    const requester_id = req.user.id;

    // Kiểm tra assignment thuộc về requester không
    const { data: assignment } = await supabase
      .from('shift_assignments')
      .select('id, user_id, shift_date, shifts(name)')
      .eq('id', assignment_id)
      .single();

    if (!assignment || assignment.user_id !== requester_id) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Bạn không có quyền đổi ca này' },
      });
    }

    // Kiểm tra target_user tồn tại
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', target_user_id)
      .single();

    if (!targetUser) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Nhân viên nhận đổi ca không tồn tại' } });
    }

    const { data, error } = await supabase
      .from('shift_swap_requests')
      .insert([{
        assignment_id,
        requester_id,
        target_user_id,
        reason,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    // Notify target_user qua socket
    try {
      const io = getIO();
      io.to(`user_${target_user_id}`).emit('swap_request_received', {
        swap_request_id: data.id,
        requester_id,
        shift_date: assignment.shift_date,
        shift_name: assignment.shifts?.name,
        reason,
      });
    } catch (_) {}

    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/shifts/swap-requests
 * Lấy danh sách yêu cầu đổi ca (có thể filter theo status)
 */
exports.getSwapRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    let query = supabase
      .from('shift_swap_requests')
      .select(
        `id, status, reason, created_at,
         shift_assignments(shift_date, shifts(name, start_time, end_time)),
         requester:requester_id(id, full_name, email),
         target_user:target_user_id(id, full_name, email)`
      )
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      // Staff chỉ thấy yêu cầu liên quan đến mình
      query = query.or(`requester_id.eq.${userId},target_user_id.eq.${userId}`);
    }
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * PATCH /api/shifts/swap-requests/:id/respond
 * Đồng nghiệp xác nhận hoặc từ chối yêu cầu đổi ca
 */
exports.respondSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'reject'
    const userId = req.user.id;

    const { data: swapReq } = await supabase
      .from('shift_swap_requests')
      .select('*, shift_assignments(user_id, shift_date, shift_id)')
      .eq('id', id)
      .single();

    if (!swapReq) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Yêu cầu đổi ca không tồn tại' } });
    }

    if (swapReq.target_user_id !== userId) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Bạn không phải người nhận yêu cầu này' } });
    }

    const newStatus = action === 'accept' ? 'accepted_by_peer' : 'rejected';

    const { data: updated, error } = await supabase
      .from('shift_swap_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify requester
    try {
      const io = getIO();
      io.to(`user_${swapReq.requester_id}`).emit('swap_request_responded', {
        swap_request_id: id,
        status: newStatus,
        responded_by: userId,
      });
    } catch (_) {}

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * PATCH /api/admin/shifts/swap-requests/:id/approve
 * Admin duyệt yêu cầu đổi ca đã được peer xác nhận
 * Tự động hoán đổi shift_assignment giữa 2 nhân viên
 */
exports.approveSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: swapReq } = await supabase
      .from('shift_swap_requests')
      .select('*, shift_assignments(id, user_id, shift_id, shift_date)')
      .eq('id', id)
      .single();

    if (!swapReq) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Yêu cầu đổi ca không tồn tại' } });
    }

    if (swapReq.status !== 'accepted_by_peer') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Chỉ có thể duyệt yêu cầu đã được đồng nghiệp xác nhận' },
      });
    }

    const originalAssignment = swapReq.shift_assignments;

    // Tìm assignment của target user trong cùng ngày (nếu có) để hoán đổi
    const { data: targetAssignment } = await supabase
      .from('shift_assignments')
      .select('id, shift_id, shift_date')
      .eq('user_id', swapReq.target_user_id)
      .eq('shift_date', originalAssignment.shift_date)
      .maybeSingle();

    // Cập nhật: chuyển ca gốc sang target user
    await supabase
      .from('shift_assignments')
      .update({
        user_id: swapReq.target_user_id,
        status: 'swapped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', originalAssignment.id);

    // Nếu target có ca trong ngày đó, chuyển lại cho requester
    if (targetAssignment) {
      await supabase
        .from('shift_assignments')
        .update({
          user_id: swapReq.requester_id,
          status: 'swapped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetAssignment.id);
    } else {
      // Target không có ca: tạo mới ca cho requester? Tùy nghiệp vụ - để trống
    }

    // Đóng swap request
    const { data: updatedReq, error } = await supabase
      .from('shift_swap_requests')
      .update({ status: 'approved_by_admin', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data: updatedReq, message: 'Đã duyệt và thực hiện đổi ca thành công' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ─── Attendance (Điểm danh) ───────────────────────────────────────────────────

/**
 * GET /api/shifts/attendance/qr-token
 * Lấy QR Token động (TTL 30 giây) để hiển thị trên màn hình POS (Admin/Waiter)
 * Không phải QR tĩnh — phải gọi lại API sau mỗi 30 giây
 */
exports.getAttendanceQRToken = async (req, res) => {
  try {
    const token = jwt.sign(
      {
        purpose: 'attendance_check_in',
        restaurant_id: 'default',
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: '30s' } // TTL 30 giây
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        expires_in_seconds: 30,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/shifts/attendance/check-in
 * Nhân viên quét QR để điểm danh bắt đầu ca (kiểm tra IP nội bộ)
 */
exports.checkInShift = async (req, res) => {
  try {
    const { qr_token, assignment_id } = req.body;
    const staffId = req.user.id;

    // Verify QR token
    let decoded;
    try {
      decoded = jwt.verify(qr_token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: { code: 'EXPIRED_QR', message: 'Mã QR đã hết hạn (30 giây). Vui lòng quét lại.' },
      });
    }

    if (decoded.purpose !== 'attendance_check_in') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_QR', message: 'QR không hợp lệ' } });
    }

    // Kiểm tra IP Subnet nội bộ (nếu INTERNAL_SUBNET được cấu hình)
    const allowedSubnet = process.env.INTERNAL_SUBNET;
    if (allowedSubnet) {
      const clientIp = req.ip || req.connection?.remoteAddress || '';
      // Kiểm tra IP thuộc subnet (đơn giản: check prefix)
      const subnetPrefix = allowedSubnet.split('/')[0].split('.').slice(0, 3).join('.');
      if (!clientIp.startsWith(subnetPrefix) && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
        return res.status(403).json({
          success: false,
          error: { code: 'IP_NOT_ALLOWED', message: 'Điểm danh chỉ được thực hiện trong mạng Wifi nội bộ của quán' },
        });
      }
    }

    // Tìm assignment hôm nay của nhân viên
    const todayDate = new Date().toISOString().split('T')[0];
    let assignmentQuery = supabase
      .from('shift_assignments')
      .select('id, status, shift_id, shifts(start_time, end_time, name)')
      .eq('user_id', staffId)
      .eq('shift_date', todayDate);

    if (assignment_id) {
      assignmentQuery = assignmentQuery.eq('id', assignment_id);
    } else {
      assignmentQuery = assignmentQuery.eq('status', 'scheduled');
    }

    const { data: assignments } = await assignmentQuery;

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_ASSIGNMENT', message: 'Không tìm thấy ca trực hôm nay chưa điểm danh' },
      });
    }

    const assignment = assignments[0];

    if (assignment.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CHECKED_IN', message: 'Bạn đã điểm danh vào ca này rồi' },
      });
    }

    const clientIp = req.ip || req.connection?.remoteAddress;

    const { data: updated, error } = await supabase
      .from('shift_assignments')
      .update({
        status: 'checked_in',
        check_in_time: new Date().toISOString(),
        attendance_ip: clientIp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignment.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Điểm danh thành công! Ca ${assignment.shifts?.name} (${assignment.shifts?.start_time} - ${assignment.shifts?.end_time})`,
      data: updated,
    });
  } catch (err) {
    console.error('[shiftController.checkInShift]', err);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * POST /api/shifts/attendance/check-out
 * Nhân viên điểm danh kết thúc ca
 */
exports.checkOutShift = async (req, res) => {
  try {
    const { assignment_id } = req.body;
    const staffId = req.user.id;

    const { data: assignment, error: findErr } = await supabase
      .from('shift_assignments')
      .select('id, status, check_in_time')
      .eq('id', assignment_id)
      .eq('user_id', staffId)
      .single();

    if (findErr || !assignment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy ca trực' } });
    }

    if (assignment.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_CHECKED_IN', message: 'Bạn chưa điểm danh vào ca này' },
      });
    }

    const { data: updated, error } = await supabase
      .from('shift_assignments')
      .update({
        status: 'checked_out',
        check_out_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignment_id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Điểm danh kết thúc ca thành công', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

/**
 * GET /api/admin/shifts/attendance
 * Admin xem báo cáo điểm danh
 */
exports.getAttendanceReport = async (req, res) => {
  try {
    const { date, shift_id } = req.query;

    let query = supabase
      .from('shift_assignments')
      .select(
        `id, shift_date, status, check_in_time, check_out_time, attendance_ip, notes,
         shifts(id, name, start_time, end_time),
         users(id, full_name, email, role)`
      )
      .order('shift_date', { ascending: false })
      .order('check_in_time', { ascending: true });

    if (date) query = query.eq('shift_date', date);
    if (shift_id) query = query.eq('shift_id', shift_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
