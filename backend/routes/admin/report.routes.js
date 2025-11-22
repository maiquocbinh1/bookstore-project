const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../../middleware/auth');
const adminReportController = require('../../controllers/adminReportController');

// All admin report routes require admin authentication
router.use(protect, isAdmin);

router.get('/dashboard', adminReportController.getDashboardStats);
router.get('/quarter', adminReportController.getCurrentQuarterReport);
router.get('/bestselling', adminReportController.getBestsellingBooks);
router.get('/new-customers', adminReportController.getNewCustomers);
router.get('/export/excel', adminReportController.exportReportExcel);
router.get('/export/pdf', adminReportController.exportReportPDF);

module.exports = router;

