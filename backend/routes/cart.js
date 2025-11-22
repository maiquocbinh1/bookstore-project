const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { cartValidation } = require('../middleware/validation');

// Tất cả routes cart cần authentication

// KH-07: Lấy giỏ hàng
router.get('/', authenticate, cartController.getCart);

// KH-07: Thêm vào giỏ hàng
router.post('/', authenticate, cartValidation, cartController.addToCart);

// KH-07: Cập nhật số lượng
router.put('/:id', authenticate, cartController.updateCartItem);

// KH-07: Xóa khỏi giỏ hàng
router.delete('/:id', authenticate, cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;

