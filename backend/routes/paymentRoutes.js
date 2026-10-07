const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Payment Routes
router.get('/', requireAuth, paymentController.getAllPayments);
router.get('/stats', requireAuth, requireRole('ADMIN'), paymentController.getPaymentStats);
router.get('/:id', requireAuth, paymentController.getPaymentById);
router.post('/', requireAuth, requireRole('ADMIN'), paymentController.createPayment);
router.put('/:id/status', requireAuth, requireRole('ADMIN'), paymentController.updatePaymentStatus);

module.exports = router;
