const groqService = require('../services/groqService');
const prisma = require('../config/prisma');

// POST /api/ai/daily-plan - Get structured daily fitness, meal, and exercise suggestions
async function getDailyPlan(req, res, next) {
  try {
    const { fitnessLevel, goal, targetArea } = req.body;

    const data = await groqService.generateDailyFitnessSuite({
      fitnessLevel: fitnessLevel || 'Intermediate',
      goal: goal || 'Strength & Hypertrophy',
      targetArea: targetArea || 'Upper Body',
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/ai/assistant - Conversational AI Assistant
async function chatAssistant(req, res, next) {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message prompt string is required',
      });
    }

    const data = await groqService.chatWithAssistant({
      message,
      history: history || [],
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/ai/nutrition - Member logs a meal to daily tracker
async function logNutrition(req, res, next) {
  try {
    const userRole = req.user.role;
    let targetMemberId;

    if (userRole === 'MEMBER') {
      targetMemberId = req.user.memberId;
    } else {
      targetMemberId = req.body.memberId ? parseInt(req.body.memberId, 10) : null;
    }

    if (!targetMemberId) {
      return res.status(400).json({ success: false, message: 'Valid memberId is required' });
    }

    const { mealType = 'SNACK', foodName, calories, protein, carbs, fats } = req.body;

    if (!foodName || !calories) {
      return res.status(400).json({
        success: false,
        message: 'Food name and estimated calories are required',
      });
    }

    const newLog = await prisma.nutritionLog.create({
      data: {
        memberId: targetMemberId,
        mealType: mealType.toUpperCase(),
        foodName,
        calories: parseInt(calories, 10),
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
        date: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Nutrition entry recorded successfully',
      data: newLog,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/ai/nutrition - Fetch today's logged nutrition
async function getNutritionLogs(req, res, next) {
  try {
    const userRole = req.user.role;
    let targetMemberId;

    if (userRole === 'MEMBER') {
      targetMemberId = req.user.memberId;
    } else {
      targetMemberId = req.query.memberId ? parseInt(req.query.memberId, 10) : req.user.memberId;
    }

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

    const logs = await prisma.nutritionLog.findMany({
      where: {
        memberId: targetMemberId,
        date: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCalories = logs.reduce((sum, item) => sum + item.calories, 0);

    res.json({
      success: true,
      totalCalories,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyPlan,
  chatAssistant,
  logNutrition,
  getNutritionLogs,
};
