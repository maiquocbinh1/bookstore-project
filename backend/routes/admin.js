const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { bookValidation, categoryValidation } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');

// Tất cả routes admin cần authentication và authorization

// ===== QUẢN LÝ SÁCH =====

// AD-01: Thêm sách (với upload ảnh)
router.post(
  '/books',
  authenticate,
  authorizeAdmin,
  upload.single('image'),
  handleUploadError,
  bookValidation,
  adminController.createBook
);

// AD-01: Cập nhật sách
router.put(
  '/books/:id',
  authenticate,
  authorizeAdmin,
  upload.single('image'),
  handleUploadError,
  bookValidation,
  adminController.updateBook
);

// AD-01: Xóa sách
router.delete('/books/:id', authenticate, authorizeAdmin, adminController.deleteBook);

// AD-03: Cập nhật tồn kho
router.patch('/books/:id/stock', authenticate, authorizeAdmin, adminController.updateStock);

// ===== QUẢN LÝ THỂ LOẠI =====

// AD-04: Thêm category
router.post('/categories', authenticate, authorizeAdmin, categoryValidation, adminController.createCategory);

// AD-04: Cập nhật category
router.put('/categories/:id', authenticate, authorizeAdmin, categoryValidation, adminController.updateCategory);

// AD-04: Xóa category
router.delete('/categories/:id', authenticate, authorizeAdmin, adminController.deleteCategory);

// ===== QUẢN LÝ KHÁCH HÀNG =====

// Lấy danh sách khách hàng
router.get('/customers', authenticate, authorizeAdmin, adminController.getCustomers);

// AD-05: Khóa/Mở khóa tài khoản
router.patch('/customers/:id/toggle-lock', authenticate, authorizeAdmin, adminController.toggleUserLock);

// ===== QUẢN LÝ ĐƠN HÀNG =====

// AD-06: Lấy tất cả đơn hàng
router.get('/orders', authenticate, authorizeAdmin, adminController.getAllOrders);

// AD-06: Cập nhật trạng thái đơn hàng
router.patch('/orders/:id/status', authenticate, authorizeAdmin, adminController.updateOrderStatus);

// ===== BÁO CÁO & THỐNG KÊ =====

// AD-07: Báo cáo doanh thu theo quý
router.get('/reports/quarterly', authenticate, authorizeAdmin, adminController.getQuarterlyReport);

// AD-08: Sách bán chạy nhất
router.get('/reports/bestsellers', authenticate, authorizeAdmin, adminController.getBestSellingBooks);

// AD-08: Khách hàng mới
router.get('/reports/new-customers', authenticate, authorizeAdmin, adminController.getNewCustomers);

// AD-09: Xuất báo cáo PDF
router.get('/reports/export/pdf', authenticate, authorizeAdmin, adminController.exportReportPDF);

// AD-09: Xuất báo cáo Excel
router.get('/reports/export/excel', authenticate, authorizeAdmin, adminController.exportReportExcel);

module.exports = router;

