const express = require('express');
const router = express.Router();
const { requireAuth, requireVolunteer } = require('../middleware/auth');
const volunteerController = require('../controllers/volunteerController');

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireVolunteer);

// Routes
router.get('/dashboard', volunteerController.dashboard);
router.get('/browse-requests', volunteerController.browseRequests);
router.post('/accept-request/:id', volunteerController.acceptRequest);
router.get('/my-tasks', volunteerController.myTasks);
router.put('/task/:id/status', volunteerController.updateTaskStatus);
router.get('/profile', volunteerController.profile);
router.put('/profile', volunteerController.updateProfile);
// Temporary POST route fallback for debugging
router.post('/profile', volunteerController.updateProfile);

module.exports = router;
