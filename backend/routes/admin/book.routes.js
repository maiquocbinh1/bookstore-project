const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validation');
const { protect, isAdmin } = require('../../middleware/auth');
const upload = require('../../config/multerConfig');
const adminBookController = require('../../controllers/adminBookController');

// Validation
const bookValidation = [
  body('isbn').notEmpty().withMessage('ISBN không được để trống'),
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('author').notEmpty().withMessage('Tác giả không được để trống'),
  body('price').isFloat({ min: 0 }).withMessage('Giá phải là số dương')
];

const categoryValidation = [
  body('category_name').notEmpty().withMessage('Tên thể loại không được để trống')
];

// All admin book routes require admin authentication
router.use(protect, isAdmin);

// Book management
router.post('/', bookValidation, handleValidationErrors, adminBookController.createBook);
router.put('/:id', bookValidation, handleValidationErrors, adminBookController.updateBook);
router.delete('/:id', adminBookController.deleteBook);
router.post('/:id/upload-image', upload.single('image'), adminBookController.uploadBookImage);
router.patch('/:id/stock', adminBookController.updateStock);

// Category management
router.post('/categories', categoryValidation, handleValidationErrors, adminBookController.createCategory);
router.put('/categories/:id', categoryValidation, handleValidationErrors, adminBookController.updateCategory);
router.delete('/categories/:id', adminBookController.deleteCategory);

module.exports = router;

