const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Validation
const addReviewValidation = [
  body('book_id').isInt().withMessage('ID sách không hợp lệ'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Đánh giá phải từ 1-5 sao'),
  body('comment').optional().isString()
];

// Public route - xem đánh giá
router.get('/book/:book_id', reviewController.getBookReviews);

// Protected routes - thêm/xóa đánh giá
router.post('/', protect, addReviewValidation, handleValidationErrors, reviewController.addReview);
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;

