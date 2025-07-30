const express = require('express');
const router = express.Router();
const { requireAuth, requireElder } = require('../middleware/auth');
const elderController = require('../controllers/elderController');

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireElder);

// Routes
router.get('/dashboard', elderController.dashboard);
router.get('/create-request', elderController.showCreateRequest);
router.post('/create-request', elderController.createRequest);
router.get('/my-requests', elderController.myRequests);
router.get('/feedback/:id', elderController.showFeedback);
router.post('/feedback/:id', elderController.submitFeedback);
router.get('/profile', elderController.profile);
router.put('/profile', elderController.updateProfile);
router.post('/profile', elderController.updateProfile); // Temporary fallback

module.exports = router;
