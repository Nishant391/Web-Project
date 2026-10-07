const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/clerkAuth');

// Dashboard Routes
router.get('/stats', requireAuth, dashboardController.getDashboardStats);

module.exports = router;
