const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../../middleware/auth');
const adminUserController = require('../../controllers/adminUserController');

// All admin user routes require admin authentication
router.use(protect, isAdmin);

router.get('/', adminUserController.getAllCustomers);
router.get('/:id', adminUserController.getCustomerDetail);
router.patch('/:id/lock', adminUserController.toggleLockAccount);
router.patch('/:id/active', adminUserController.toggleActiveAccount);

module.exports = router;

