const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Validation
const createOrderValidation = [
  body('address_id').isInt().withMessage('ID địa chỉ không hợp lệ'),
  body('payment_method').isIn(['cod', 'bank_transfer', 'credit_card', 'e_wallet']).withMessage('Phương thức thanh toán không hợp lệ')
];

const processPaymentValidation = [
  body('order_id').isInt().withMessage('ID đơn hàng không hợp lệ'),
  body('payment_info').isObject().withMessage('Thông tin thanh toán không hợp lệ')
];

const addAddressValidation = [
  body('recipient_name').notEmpty().withMessage('Tên người nhận không được để trống'),
  body('phone').isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  body('address_line').notEmpty().withMessage('Địa chỉ không được để trống'),
  body('city').notEmpty().withMessage('Thành phố không được để trống')
];

// All order routes require authentication
router.use(protect);

// Order routes
router.post('/', createOrderValidation, handleValidationErrors, orderController.createOrder);
router.post('/payment', processPaymentValidation, handleValidationErrors, orderController.processPayment);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

// Address routes
router.get('/addresses/list', orderController.getAddresses);
router.post('/addresses', addAddressValidation, handleValidationErrors, orderController.addAddress);

module.exports = router;

