const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  passwordResetRequestValidation,
  passwordResetValidation
} = require('../middleware/validation');

// KH-01: Đăng ký
router.post('/register', registerValidation, authController.register);

// KH-02: Đăng nhập
router.post('/login', loginValidation, authController.login);

// KH-03: Yêu cầu reset password
router.post('/password-reset-request', passwordResetRequestValidation, authController.requestPasswordReset);

// KH-03: Reset password
router.post('/password-reset', passwordResetValidation, authController.resetPassword);

// Lấy thông tin user hiện tại
router.get('/me', authenticate, authController.getCurrentUser);

// Cập nhật profile
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;

