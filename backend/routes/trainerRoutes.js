const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Trainer Routes
router.get('/me', requireAuth, requireRole('TRAINER'), trainerController.getMyTrainerProfile);
router.get('/profile', requireAuth, requireRole('TRAINER'), trainerController.getMyTrainerProfile);
router.get('/my-members', requireAuth, requireRole('TRAINER'), trainerController.getMyAssignedMembers);
router.get('/', requireAuth, trainerController.getAllTrainers);
router.get('/:id', requireAuth, trainerController.getTrainerById);
router.post('/', requireAuth, requireRole('ADMIN'), trainerController.createTrainer);
router.put('/:id', requireAuth, requireRole('ADMIN', 'TRAINER'), trainerController.updateTrainer);
router.delete('/:id', requireAuth, requireRole('ADMIN'), trainerController.deleteTrainer);

module.exports = router;
