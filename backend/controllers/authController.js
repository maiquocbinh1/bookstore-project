const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Tạo JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// KH-01: Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Kiểm tra email đã tồn tại
    const [existingUsers] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, full_name, phone || null, 'customer']
    );

    // Tạo token
    const token = signToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          user_id: result.insertId,
          email,
          full_name,
          phone,
          role: 'customer'
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký tài khoản',
      error: error.message
    });
  }
};

// KH-02: Đăng nhập với cơ chế khóa tài khoản
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    // Kiểm tra tài khoản bị khóa
    if (user.is_locked) {
      // Kiểm tra thời gian khóa
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        return res.status(403).json({
          success: false,
          message: `Tài khoản đã bị khóa tạm thời. Vui lòng thử lại sau ${minutesLeft} phút.`
        });
      } else {
        // Mở khóa tự động nếu đã hết thời gian
        await pool.query(
          'UPDATE users SET is_locked = FALSE, locked_until = NULL, failed_login_attempts = 0 WHERE user_id = ?',
          [user.user_id]
        );
      }
    }

    // Kiểm tra tài khoản không active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Tăng số lần đăng nhập thất bại
      const newAttempts = user.failed_login_attempts + 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3;

      if (newAttempts >= maxAttempts) {
        // Khóa tài khoản
        const lockTime = parseInt(process.env.LOCK_TIME) || 15; // phút
        const lockedUntil = new Date(Date.now() + lockTime * 60000);

        await pool.query(
          'UPDATE users SET failed_login_attempts = ?, is_locked = TRUE, locked_until = ? WHERE user_id = ?',
          [newAttempts, lockedUntil, user.user_id]
        );

        return res.status(403).json({
          success: false,
          message: `Đăng nhập thất bại ${maxAttempts} lần. Tài khoản đã bị khóa trong ${lockTime} phút.`
        });
      } else {
        // Cập nhật số lần thất bại
        await pool.query(
          'UPDATE users SET failed_login_attempts = ? WHERE user_id = ?',
          [newAttempts, user.user_id]
        );

        return res.status(401).json({
          success: false,
          message: `Email hoặc mật khẩu không đúng. Còn ${maxAttempts - newAttempts} lần thử.`
        });
      }
    }

    // Đăng nhập thành công - Reset failed attempts
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = ?',
      [user.user_id]
    );

    // Tạo token
    const token = signToken(user.user_id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng nhập',
      error: error.message
    });
  }
};

// KH-03: Yêu cầu đặt lại mật khẩu (gửi email với token hết hạn sau 5 phút)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Tìm user
    const [users] = await pool.query(
      'SELECT user_id, email, full_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Không tiết lộ thông tin user có tồn tại hay không
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi'
      });
    }

    const user = users[0];

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Lưu token vào database (hết hạn sau 5 phút)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, hashedToken, expiresAt]
    );

    // Gửi email
    const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.full_name);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.'
      });
    }

    res.json({
      success: true,
      message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn. Link có hiệu lực trong 5 phút.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý yêu cầu',
      error: error.message
    });
  }
};

// KH-03: Đặt lại mật khẩu với token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash token để so sánh
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm token trong database
    const [tokens] = await pool.query(
      `SELECT prt.*, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.user_id
       WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    const resetData = tokens[0];

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    await pool.query(
      'UPDATE users SET password_hash = ?, failed_login_attempts = 0, is_locked = FALSE, locked_until = NULL WHERE user_id = ?',
      [password_hash, resetData.user_id]
    );

    // Đánh dấu token đã sử dụng
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token_id = ?',
      [resetData.token_id]
    );

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lại mật khẩu',
      error: error.message
    });
  }
};

// Lấy thông tin user hiện tại
exports.getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, email, full_name, phone, role, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

// Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;

    await pool.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?',
      [full_name, phone || null, req.user.user_id]
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message
    });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Lấy thông tin user
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [password_hash, req.user.user_id]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi mật khẩu',
      error: error.message
    });
  }
};
