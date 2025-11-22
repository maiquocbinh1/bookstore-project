const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { orderValidation } = require('../middleware/validation');

// Tất cả routes orders cần authentication

// KH-09: Tạo đơn hàng
router.post('/', authenticate, orderValidation, orderController.createOrder);

// KH-10, KH-11: Xử lý thanh toán
router.post('/payment', authenticate, orderController.processPayment);

// KH-13: Lấy danh sách đơn hàng của user
router.get('/my-orders', authenticate, orderController.getMyOrders);

// KH-14: Lấy chi tiết đơn hàng
router.get('/:id', authenticate, orderController.getOrderById);

// KH-15: Tải hóa đơn PDF
router.get('/:id/invoice', authenticate, orderController.downloadInvoice);

// Yêu cầu hủy đơn hàng
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;

