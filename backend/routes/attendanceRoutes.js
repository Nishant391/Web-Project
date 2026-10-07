const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/clerkAuth');

// Attendance Routes
router.get('/', requireAuth, attendanceController.getAllAttendance);
router.get('/stats', requireAuth, attendanceController.getAttendanceStats);
router.post('/check-in', requireAuth, attendanceController.checkIn);
router.post('/check-out', requireAuth, attendanceController.checkOut);

module.exports = router;
