const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Public routes - không cần đăng nhập
router.get('/', bookController.getAllBooks);
router.get('/search', bookController.searchBooks);
router.get('/filter', bookController.filterBooks);
router.get('/categories', bookController.getCategories);
router.get('/:id', bookController.getBookById);

module.exports = router;

