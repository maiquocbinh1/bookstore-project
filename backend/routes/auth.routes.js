const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { registerLimiter, loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải chứa chữ hoa, chữ thường và số'),
  body('full_name').notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').optional().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token không được để trống'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải chứa chữ hoa, chữ thường và số')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải chứa chữ hoa, chữ thường và số')
];

// Public routes
router.post('/register', registerLimiter, registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.post('/change-password', protect, changePasswordValidation, handleValidationErrors, authController.changePassword);

module.exports = router;

