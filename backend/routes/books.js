const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');

// KH-04, KH-05, KH-06: Lấy danh sách sách (có tìm kiếm và lọc)
router.get('/', bookController.getBooks);

// Lấy chi tiết sách
router.get('/:id', bookController.getBookById);

// KH-16: Thêm review (cần đăng nhập)
router.post('/reviews', authenticate, bookController.addReview);

// Lấy danh sách categories
router.get('/categories/all', bookController.getCategories);

module.exports = router;

