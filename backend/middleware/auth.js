const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware xác thực JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Kiểm tra token từ header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Hoặc từ cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ database
      const [users] = await pool.query(
        'SELECT user_id, email, full_name, role, is_active, is_locked FROM users WHERE user_id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      const user = users[0];

      // Kiểm tra tài khoản có bị khóa
      if (user.is_locked) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        });
      }

      // Kiểm tra tài khoản có active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị vô hiệu hóa'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

// Middleware phân quyền theo role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Người dùng với vai trò '${req.user.role}' không có quyền truy cập tài nguyên này`
      });
    }

    next();
  };
};

// Middleware kiểm tra quyền admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Chỉ quản trị viên mới có quyền truy cập'
    });
  }
};

// Middleware kiểm tra quyền customer
exports.isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Chỉ khách hàng mới có quyền truy cập'
    });
  }
};
