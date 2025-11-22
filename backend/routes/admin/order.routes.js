const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validation');
const { protect, isAdmin } = require('../../middleware/auth');
const adminOrderController = require('../../controllers/adminOrderController');

// Validation
const updateStatusValidation = [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ')
];

// All admin order routes require admin authentication
router.use(protect, isAdmin);

router.get('/', adminOrderController.getAllOrders);
router.get('/stats', adminOrderController.getOrderStatusStats);
router.get('/:id', adminOrderController.getOrderDetail);
router.patch('/:id/status', updateStatusValidation, handleValidationErrors, adminOrderController.updateOrderStatus);

module.exports = router;

