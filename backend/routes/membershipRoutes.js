const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Membership Routes
router.get('/', requireAuth, membershipController.getAllMemberships);
router.get('/:id', requireAuth, membershipController.getMembershipById);
router.post('/', requireAuth, requireRole('ADMIN'), membershipController.createMembership);
router.put('/:id', requireAuth, requireRole('ADMIN'), membershipController.updateMembership);
router.delete('/:id', requireAuth, requireRole('ADMIN'), membershipController.deleteMembership);

module.exports = router;
