const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

// Middleware kiểm tra Token
exports.verifyToken = async (req, res, next) => {
  // Lấy token từ header: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_tam_thoi');

    // Check if user is banned (is_verified = false)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_verified, role')
      .eq('id', verified.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

/**
 * optionalAuth — Cho phép cả guest và authenticated user
 * Nếu có token hợp lệ → set req.user; không có hoặc invalid → req.user = null
 */
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_tam_thoi');
    req.user = verified;
  } catch (_) {
    req.user = null;
  }
  next();
};

const crypto = require('crypto');

/**
 * verifyInternalOrUserAuth
 * Bảo vệ endpoint nội bộ khỏi tấn công IDOR & Unauthenticated Access (P0 Defect 1).
 * 1. Cho phép gọi bằng Internal Service Secret (x-internal-secret header) với timingSafeEqual.
 * 2. Nếu không có secret, yêu cầu verifyToken hợp lệ và KHÔNG cho phép cập nhật hồ sơ người dùng khác.
 */
exports.verifyInternalOrUserAuth = async (req, res, next) => {
  const internalSecret = req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || process.env.INTERNAL_SERVICE_KEY || 'aria-ai-internal-service-secret';

  if (internalSecret) {
    try {
      const a = Buffer.from(String(internalSecret));
      const b = Buffer.from(String(expectedSecret));
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        req.isInternalService = true;
        return next();
      }
    } catch (_) {}
    return res.status(403).json({ success: false, message: 'Invalid internal service secret' });
  }

  // Fallback to user token verification
  return exports.verifyToken(req, res, () => {
    // Ngăn chặn IDOR: người dùng không được truyền userId khác với id của chính mình
    if (req.body && req.body.userId && req.body.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật hồ sơ của người dùng khác'
      });
    }
    // Gán userId bằng token đã xác thực để đảm bảo an toàn tuyệt đối
    if (req.body) {
      req.body.userId = req.user.id;
    }
    return next();
  });
};