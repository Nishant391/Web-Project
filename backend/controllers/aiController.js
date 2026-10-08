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

// POST /api/ai/workout - Specialized workout routine generator (Markdown format)
async function generateWorkout(req, res, next) {
  try {
    const { fitnessLevel, goal, daysPerWeek, targetArea, equipmentAvailable } = req.body;

    const data = await groqService.generateWorkoutRoutine({
      fitnessLevel: fitnessLevel || 'Intermediate',
      goal: goal || 'Muscle Hypertrophy',
      daysPerWeek: daysPerWeek ? parseInt(daysPerWeek, 10) : 4,
      targetArea: targetArea || 'Full Body',
      equipmentAvailable: equipmentAvailable || 'Commercial Gym',
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/ai/meal-plan - Specialized meal plan generator (Markdown format)
async function generateMealPlan(req, res, next) {
  try {
    const { dietPreference, dailyCalories, goal, mealsCount, restrictions } = req.body;

    const data = await groqService.generateMealPlanArchitecture({
      dietPreference: dietPreference || 'Balanced High-Protein',
      dailyCalories: dailyCalories ? parseInt(dailyCalories, 10) : 2200,
      goal: goal || 'Lean Muscle Maintenance',
      mealsCount: mealsCount ? parseInt(mealsCount, 10) : 4,
      restrictions: restrictions || 'None',
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
    const message = req.body.message || req.body.question || req.body.prompt || req.body.query;
    const history = req.body.history || [];

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message prompt string is required',
      });
    }

    const data = await groqService.chatWithAssistant({
      message,
      history,
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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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
  generateWorkout,
  generateMealPlan,
  chatAssistant,
  logNutrition,
  getNutritionLogs,
};
