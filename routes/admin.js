const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

// Routes
router.get('/dashboard', adminController.dashboard);
router.get('/verify-volunteers', adminController.verifyVolunteers);
router.put('/verify-volunteer/:id', adminController.updateVerification);
router.get('/manage-requests', adminController.manageRequests);
router.get('/analytics', adminController.analytics);

// User management routes
router.get('/manage-users', adminController.manageUsers);
router.get('/user/:id', adminController.getUserDetails);
router.put('/user/:id', adminController.updateUser);
router.delete('/user/:id', adminController.deleteUser);
router.post('/bulk-actions', adminController.bulkUserActions);

module.exports = router;
