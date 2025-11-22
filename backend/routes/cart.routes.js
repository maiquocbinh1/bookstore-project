const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

// Validation
const addToCartValidation = [
  body('book_id').isInt().withMessage('ID sách không hợp lệ'),
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên dương')
];

const updateCartValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên dương')
];

// All cart routes require authentication
router.use(protect);

router.get('/', cartController.getCart);
router.post('/', addToCartValidation, handleValidationErrors, cartController.addToCart);
router.put('/:cart_id', updateCartValidation, handleValidationErrors, cartController.updateCartItem);
router.delete('/:cart_id', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;

