const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/clerkAuth');

// AI Wellness & Coaching Endpoints
router.post('/daily-plan', requireAuth, aiController.getDailyPlan);
router.post('/assistant', requireAuth, aiController.chatAssistant);
router.post('/nutrition', requireAuth, aiController.logNutrition);
router.get('/nutrition', requireAuth, aiController.getNutritionLogs);

module.exports = router;
