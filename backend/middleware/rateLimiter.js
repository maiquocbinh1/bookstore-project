const rateLimit = require('express-rate-limit');

// Rate limiter cho API chung
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests mỗi 15 phút
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter cho đăng nhập (đã tắt trong development)
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests (đã tăng từ 5)
  skipSuccessfulRequests: true, // Không đếm requests thành công
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
  }
});

// Middleware: Tắt rate limiting trong development
exports.loginLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Bỏ qua rate limiting trong development
  }
  return loginRateLimit(req, res, next);
};

// Rate limiter cho đặt lại mật khẩu
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Giới hạn 3 requests
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ'
  }
});

// Rate limiter cho đăng ký
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Giới hạn 5 tài khoản mới mỗi giờ
  message: {
    success: false,
    message: 'Quá nhiều tài khoản được tạo từ IP này, vui lòng thử lại sau'
  }
});

