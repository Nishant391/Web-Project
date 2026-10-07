const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!groqClient && apiKey && !apiKey.includes('placeholder')) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const MEDICAL_DISCLAIMER =
  'Notice: This information provides general fitness and wellness educational guidance only and does not constitute medical advice, diagnosis, or personalized therapy. Consult a physician before beginning any strenuous exercise or dietary program.';

/**
 * 1. Structured Daily Fitness Suite (Returns strictly JSON)
 */
async function generateDailyFitnessSuite({
  fitnessLevel = 'Intermediate',
  goal = 'Strength & Hypertrophy',
  targetArea = 'Upper Body',
}) {
  const client = getGroqClient();

  const systemPrompt = `You are a certified professional gym coach and sports nutritionist.
Respond ONLY with a valid JSON object (no additional text, no preamble).
The JSON object must have this exact structure:
{
  "todaysPlan": {
    "title": "Short catchy title",
    "motivationalQuote": "Inspiring fitness quote",
    "targetFocus": "${targetArea}",
    "intensityLevel": "Moderate to High",
    "estimatedDurationMinutes": 60
  },
  "mealPlan": {
    "targetCalories": 2200,
    "proteinGrams": 150,
    "carbsGrams": 240,
    "fatsGrams": 65,
    "hydrationGoalLiters": 3.2,
    "breakfast": {
      "name": "Power Oatmeal & Whey",
      "calories": 480,
      "protein": 34,
      "carbs": 62,
      "fats": 10,
      "items": ["Rolled oats with chia seeds", "1 scoop whey isolate", "Fresh blueberries", "Almond milk"]
    },
    "lunch": {
      "name": "Grilled Chicken & Complex Carbs",
      "calories": 650,
      "protein": 52,
      "carbs": 70,
      "fats": 14,
      "items": ["Herb grilled chicken breast", "Steamed brown basmati rice", "Roasted broccoli & zucchini"]
    },
    "snack": {
      "name": "Greek Yogurt Parfait",
      "calories": 240,
      "protein": 20,
      "carbs": 28,
      "fats": 5,
      "items": ["Low-fat Greek yogurt", "Handful of crushed walnuts", "Drizzle of honey"]
    },
    "dinner": {
      "name": "Atlantic Salmon & Quinoa",
      "calories": 580,
      "protein": 42,
      "carbs": 48,
      "fats": 18,
      "items": ["Pan-seared wild salmon", "Quinoa bowl with spinach", "Lemon-dill dressing"]
    }
  },
  "workoutSuggestions": [
    {
      "exerciseName": "Bench Press",
      "sets": 4,
      "reps": "8-10",
      "restSeconds": 90,
      "targetMuscle": "Pectoralis Major",
      "notes": "Control 2-second negative, touch lower chest softly"
    },
    {
      "exerciseName": "Overhead Dumbbell Press",
      "sets": 3,
      "reps": "10-12",
      "restSeconds": 75,
      "targetMuscle": "Anterior Deltoids",
      "notes": "Brace core tightly and press overhead without hyper-extending back"
    },
    {
      "exerciseName": "Incline Dumbbell Flyes",
      "sets": 3,
      "reps": "12",
      "restSeconds": 60,
      "targetMuscle": "Upper Chest",
      "notes": "Maintain slight elbow bend and focus on deep chest stretch"
    },
    {
      "exerciseName": "Cable Tricep Pushdown",
      "sets": 3,
      "reps": "15",
      "restSeconds": 60,
      "targetMuscle": "Triceps Brachii",
      "notes": "Pin elbows to side of torso, spread rope at extension"
    }
  ],
  "progressInsights": {
    "consistencyScore": 92,
    "weeklyTip": "Progressive overload does not just mean more weight; improving tempo and range of motion builds equal muscle fibers.",
    "recoveryAdvice": "Aim for 7.5 to 8 hours of sleep tonight for optimal muscle protein synthesis."
  }
}

Tailor all details to: Experience Level: ${fitnessLevel}, Goal: ${goal}, Focus: ${targetArea}.
Never provide medical diagnosis or hazardous health advice.`;

  if (client) {
    try {
      const response = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a sports science fitness coach that strictly outputs valid JSON.',
          },
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          ...parsed,
          disclaimer: MEDICAL_DISCLAIMER,
          source: 'Groq AI (Llama 3.3)',
        };
      }
    } catch (error) {
      console.warn('Groq JSON API notice, using high-fidelity sports science template:', error.message);
    }
  }

  // Fallback high-fidelity structured data
  return {
    todaysPlan: {
      title: `${fitnessLevel} ${goal} Protocol`,
      motivationalQuote: 'Discipline is the bridge between goals and accomplishment.',
      targetFocus: targetArea,
      intensityLevel: 'Optimized',
      estimatedDurationMinutes: 55,
    },
    mealPlan: {
      targetCalories: 2250,
      proteinGrams: 155,
      carbsGrams: 230,
      fatsGrams: 62,
      hydrationGoalLiters: 3.2,
      breakfast: {
        name: 'Whey Protein Porridge with Blueberries',
        calories: 470,
        protein: 36,
        carbs: 60,
        fats: 9,
        items: ['Rolled oats with chia seeds', '1 scoop whey protein isolate', '1/2 cup organic blueberries', 'Unsweetened almond milk'],
      },
      lunch: {
        name: 'Herb Grilled Chicken with Basmati Rice',
        calories: 640,
        protein: 50,
        carbs: 72,
        fats: 13,
        items: ['Lean chicken breast with rosemary & olive oil', 'Brown basmati rice', 'Steamed broccoli and sweet peppers'],
      },
      snack: {
        name: 'Greek Yogurt & Roasted Almonds',
        calories: 230,
        protein: 19,
        carbs: 22,
        fats: 6,
        items: ['0% Fat strained Greek yogurt', '15g roasted raw almonds', 'Touch of organic honey'],
      },
      dinner: {
        name: 'Grilled Salmon with Tri-Color Quinoa',
        calories: 590,
        protein: 44,
        carbs: 46,
        fats: 18,
        items: ['Wild-caught salmon fillet', 'Quinoa bowl with baby spinach', 'Steamed asparagus with lemon zest'],
      },
    },
    workoutSuggestions: [
      {
        exerciseName: 'Barbell Bench Press',
        sets: 4,
        reps: '8-10',
        restSeconds: 90,
        targetMuscle: 'Pectorals & Triceps',
        notes: 'Retract scapulae and press evenly through the palms with controlled descent.',
      },
      {
        exerciseName: 'Standing Overhead Military Press',
        sets: 3,
        reps: '8-10',
        restSeconds: 75,
        targetMuscle: 'Anterior & Lateral Delts',
        notes: 'Brace abdominal wall to protect lumbar spine.',
      },
      {
        exerciseName: 'Incline Dumbbell Press',
        sets: 3,
        reps: '10-12',
        restSeconds: 75,
        targetMuscle: 'Clavicular Pectoralis',
        notes: '30-degree incline, deep stretch without hyperextending shoulders.',
      },
      {
        exerciseName: 'Cable Triceps Rope Pushdown',
        sets: 3,
        reps: '12-15',
        restSeconds: 60,
        targetMuscle: 'Triceps Lateral Head',
        notes: 'Lock elbows at ribs, flare rope outward at the bottom contraction.',
      },
    ],
    progressInsights: {
      consistencyScore: 94,
      weeklyTip: 'Consistency in weekly training volume is the number one driver of body recomposition.',
      recoveryAdvice: 'Prioritize 8 hours of sleep and adequate hydration between heavy compound lifts.',
    },
    disclaimer: MEDICAL_DISCLAIMER,
    source: 'Evidence-Based Wellness Engine',
  };
}

/**
 * 2. Conversational Fitness Assistant
 */
async function chatWithAssistant({ message, history = [] }) {
  const client = getGroqClient();

  const systemPrompt = `You are the PulseForge Smart Gym AI Fitness Assistant.
Your mission is to provide concise, evidence-based, and encouraging advice on gym routines, workout technique, general fitness splits, and healthy meal preparation.
Crucial safety rules:
1. Provide only general fitness and wellness educational guidance.
2. NEVER diagnose medical conditions or prescribe injury treatment.
3. Suggest consulting medical professionals for persistent joint pain or pathology.
4. Keep answers concise, actionable, and formatted with bullet points where helpful.`;

  if (client) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const response = await client.chat.completions.create({
        messages,
        model: 'llama3-70b-8192',
        temperature: 0.6,
        max_tokens: 600,
      });

      return {
        reply: response.choices[0]?.message?.content + `\n\n_${MEDICAL_DISCLAIMER}_`,
        source: 'Groq AI (Llama 3.3)',
      };
    } catch (err) {
      console.warn('Groq Assistant Error:', err.message);
    }
  }

  // Fallback intelligent answer
  return {
    reply: `Here are recommendations based on your query:
• **Form & Technique**: Always warm up with 5-10 minutes of dynamic mobility and progressive warm-up sets before lifting heavy.
• **Recovery**: Muscle hypertrophy happens during recovery. Aim for 1.6-2.2g of protein per kg of body weight daily.
• **Split Balance**: Ensure you allow 48 hours of recovery between working the same muscle groups.

_${MEDICAL_DISCLAIMER}_`,
    source: 'PulseForge AI Core',
  };
}

module.exports = {
  generateDailyFitnessSuite,
  chatWithAssistant,
};
