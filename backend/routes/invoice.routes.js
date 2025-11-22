const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

// All invoice routes require authentication
router.use(protect);

router.get('/:order_id', invoiceController.getInvoice);
router.get('/:order_id/pdf', invoiceController.generateInvoicePDF);

module.exports = router;

