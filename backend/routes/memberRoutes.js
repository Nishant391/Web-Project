const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Member Routes
router.get('/me', requireAuth, memberController.getMyProfile);
router.get('/profile', requireAuth, memberController.getMyProfile);
router.get('/', requireAuth, requireRole('ADMIN', 'TRAINER'), memberController.getAllMembers);
router.get('/:id', requireAuth, memberController.getMemberById);
router.post('/', requireAuth, requireRole('ADMIN', 'TRAINER'), memberController.createMember);
router.put('/:id', requireAuth, memberController.updateMember);
router.delete('/:id', requireAuth, requireRole('ADMIN'), memberController.deleteMember);

module.exports = router;
