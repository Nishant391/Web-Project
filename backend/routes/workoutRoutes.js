const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Completions tracking
router.get('/completions', requireAuth, workoutController.getWorkoutCompletions);
router.post('/completions', requireAuth, workoutController.logWorkoutCompletion);

// Main workouts
router.get('/', requireAuth, workoutController.getAllWorkouts);
router.get('/:id', requireAuth, workoutController.getWorkoutById);
router.post('/', requireAuth, requireRole('ADMIN', 'TRAINER'), workoutController.createWorkout);
router.put('/:id', requireAuth, requireRole('ADMIN', 'TRAINER'), workoutController.updateWorkout);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'TRAINER'), workoutController.deleteWorkout);

module.exports = router;
