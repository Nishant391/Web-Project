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

// List of supported Groq models in fallback order
const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
].filter(Boolean);

// Unique candidate models
const FALLBACK_MODELS = [...new Set(CANDIDATE_MODELS)];

/**
 * Strip all HTML tags, tag names, and markup from text.
 * Also removes entire <think>...</think> reasoning blocks that
 * qwen/qwen3 thinking models include as internal chain-of-thought.
 */
function cleanAIText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    // Remove entire <think>...</think> blocks (qwen thinking model reasoning)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    // Remove other thinking/reasoning wrapper tags used by some models
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    // Replace breaks with real newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p>/gi, '')
    // Strip all remaining HTML tags (<tag>, </tag>, <tag .../>)
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Collapse more than 3 consecutive blank lines into 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Recursively clean all string values in an object or array
 */
function deepCleanStrings(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return cleanAIText(obj);
  if (Array.isArray(obj)) return obj.map(deepCleanStrings);
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = deepCleanStrings(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Execute chat completion with model fallback
 */
async function callGroqWithFallback(client, basePayload) {
  let lastError = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await client.chat.completions.create({
        ...basePayload,
        model,
      });
      return { response, modelUsed: model };
    } catch (err) {
      console.warn(`Groq attempt with model [${model}] failed:`, err.message);
      lastError = err;
      // Continue to next model in fallback list
    }
  }
  throw lastError || new Error('All Groq model attempts failed');
}

/**
 * Helper to get formatted current ongoing date/time string for AI system prompts
 */
function getOngoingTimeContext() {
  const now = new Date();
  return `Current Real Ongoing Date & Time: ${now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.`;
}

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
${getOngoingTimeContext()}
STRICT REQUIREMENT: Absolutely NEVER output any HTML tags or tag names (NO <br>, NO <br/>, NO <span>, NO <div>, NO <p>). Pure plain text values only.
Respond ONLY with a valid JSON object (no additional text, no markdown backticks, no preamble).
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
      "reps": "12-15",
      "restSeconds": 60,
      "targetMuscle": "Triceps Lateral Head",
      "notes": "Keep elbows fixed against torso, flare handle outward"
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
      const { response, modelUsed } = await callGroqWithFallback(client, {
        messages: [
          {
            role: 'system',
            content: 'You are a sports science fitness coach that strictly outputs valid JSON with no HTML tags.',
          },
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const cleaned = deepCleanStrings(parsed);
        return {
          ...cleaned,
          disclaimer: MEDICAL_DISCLAIMER,
          source: `Groq AI (${modelUsed})`,
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
${getOngoingTimeContext()}
Your mission is to provide concise, evidence-based, and encouraging advice on gym routines, workout technique, general fitness splits, and healthy meal preparation.

CRITICAL FORMATTING INSTRUCTIONS:
- Absolutely NEVER output any HTML tags or tag names (NO <br>, NO <br/>, NO <span>, NO <div>, NO <p>, NO HTML tags of any kind).
- Use ONLY clean Markdown with clean line breaks, bold labels, and standard bullet points (- or •).
- Do NOT use HTML tables.

Safety rules:
1. Provide only general fitness and wellness educational guidance.
2. NEVER diagnose medical conditions or prescribe injury treatment.
3. Suggest consulting medical professionals for persistent joint pain or pathology.`;

  if (client) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4).map((h) => ({ role: h.role, content: cleanAIText(h.content) })),
        { role: 'user', content: cleanAIText(message) },
      ];

      const { response, modelUsed } = await callGroqWithFallback(client, {
        messages,
        temperature: 0.6,
        max_tokens: 800,
      });

      const replyContent = response.choices[0]?.message?.content || '';
      const cleanedReply = cleanAIText(replyContent);
      const fullReply = cleanedReply + `\n\n_${MEDICAL_DISCLAIMER}_`;

      return {
        reply: fullReply,
        answer: fullReply,
        source: `Groq AI (${modelUsed})`,
      };
    } catch (err) {
      console.warn('Groq Assistant Error:', err.message);
    }
  }

  // Fallback intelligent answer
  const fallbackText = `Here are recommendations based on your query:
• **Form & Technique**: Always warm up with 5-10 minutes of dynamic mobility and progressive warm-up sets before lifting heavy.
• **Recovery**: Muscle hypertrophy happens during recovery. Aim for 1.6-2.2g of protein per kg of body weight daily.
• **Split Balance**: Ensure you allow 48 hours of recovery between working the same muscle groups.

_${MEDICAL_DISCLAIMER}_`;

  return {
    reply: fallbackText,
    answer: fallbackText,
    source: 'PulseForge AI Core',
  };
}

/**
 * 3. Specialized Workout Routine Generator (Markdown plan)
 */
async function generateWorkoutRoutine({
  fitnessLevel = 'Intermediate',
  goal = 'Muscle Hypertrophy',
  daysPerWeek = 4,
  targetArea = 'Full Body',
  equipmentAvailable = 'Commercial Gym',
}) {
  const client = getGroqClient();

  const prompt = `Design a comprehensive, periodized ${daysPerWeek}-day workout routine.
Athlete Profile:
- Experience Level: ${fitnessLevel}
- Primary Objective: ${goal}
- Target Muscle Focus: ${targetArea}
- Equipment Available: ${equipmentAvailable}
${getOngoingTimeContext()}

CRITICAL FORMATTING INSTRUCTIONS:
- Absolutely NEVER output any HTML tags or tag names (NO <br>, NO <br/>, NO <span>, NO <div>, NO <p>, NO HTML tags of any kind).
- DO NOT use HTML tables or markdown tables with embedded tags.
- Present each workout day using clear Markdown headings (### Day 1: Upper Body Power) followed by clean bullet lists (- Exercise Name: Sets x Reps | Rest | Cue).
- Use pure Markdown formatting with normal newlines only.

Format your output with:
1. **Overview & Periodization Strategy**
2. **Day-by-Day Split Breakdown** (Exercise, Sets x Reps, Rest, Technique Cue)
3. **Warm-up & Cool-down Protocol**
4. **Progressive Overload Rule**
Provide safe, evidence-based recommendations only.`;

  if (client) {
    try {
      const { response, modelUsed } = await callGroqWithFallback(client, {
        messages: [
          {
            role: 'system',
            content: 'You are an elite sports conditioning specialist and CSCS-certified strength coach. You strictly output pure Markdown with ZERO HTML tags.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const rawPlan = response.choices[0]?.message?.content || '';
      const cleanedPlan = cleanAIText(rawPlan);
      const planText = cleanedPlan + `\n\n_${MEDICAL_DISCLAIMER}_`;

      return {
        plan: planText,
        source: `Groq AI (${modelUsed})`,
        disclaimer: MEDICAL_DISCLAIMER,
      };
    } catch (err) {
      console.warn('Groq Workout Generator Error:', err.message);
    }
  }

  // High-fidelity fallback
  const fallbackPlan = `### **${fitnessLevel} ${goal} Protocol (${daysPerWeek} Days/Week)**

**Primary Focus**: ${targetArea} | **Equipment**: ${equipmentAvailable}

#### **Day 1: Upper Body Power & Hypertrophy**
- **Barbell Bench Press**: 4 sets x 6-8 reps (90s rest) — *Focus: Retract scapulae, control eccentric phase*
- **Chest-Supported Dumbbell Rows**: 4 sets x 8-10 reps (90s rest) — *Focus: Full lat extension, pause at contraction*
- **Standing Overhead Press**: 3 sets x 8-10 reps (75s rest) — *Focus: Brace core, press directly upward*
- **Incline Dumbbell Curls & Skullcrushers Superset**: 3 sets x 12 reps (60s rest)

#### **Day 2: Lower Body Strength & Posterior Chain**
- **Barbell Back Squats**: 4 sets x 6-8 reps (120s rest) — *Focus: Drive knees out, hit parallel depth*
- **Romanian Deadlifts (RDL)**: 3 sets x 8-10 reps (90s rest) — *Focus: Hip hinge, maintain neutral spine*
- **Bulgarian Split Squats**: 3 sets x 10 reps/leg (60s rest)
- **Standing Calf Raises**: 4 sets x 15 reps (45s rest)

#### **Day 3: Pull & Core Engine**
- **Lat Pulldowns / Weighted Pull-ups**: 4 sets x 8-10 reps (90s rest)
- **Seated Cable Rows**: 3 sets x 10-12 reps (75s rest)
- **Face Pulls**: 4 sets x 15 reps (60s rest) — *Focus: Rear delts and external rotators*
- **Hanging Leg Raises**: 3 sets x 12-15 reps (45s rest)

#### **Day 4: Push & Deltoid Sculpting**
- **Incline Dumbbell Press**: 4 sets x 8-10 reps (90s rest)
- **Dips (Bodyweight or Weighted)**: 3 sets x 10-12 reps (75s rest)
- **Lateral Cable Raises**: 4 sets x 12-15 reps (45s rest)
- **Tricep Overhead Cable Extensions**: 3 sets x 12-15 reps (60s rest)

---
*Progressive Overload Rule: Add 1-2.5 kg or 1 rep once you reach the upper rep ceiling for all sets.*

_${MEDICAL_DISCLAIMER}_`;

  return {
    plan: fallbackPlan,
    source: 'PulseForge Conditioning Engine',
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

/**
 * 4. Specialized Meal Plan Generator (Markdown plan)
 */
async function generateMealPlanArchitecture({
  dietPreference = 'Balanced High-Protein',
  dailyCalories = 2200,
  goal = 'Lean Muscle Maintenance',
  mealsCount = 4,
  restrictions = 'None',
}) {
  const client = getGroqClient();

  const prompt = `Construct an optimal, evidence-based daily nutritional plan.
Athlete Nutrition Parameters:
- Dietary Preference: ${dietPreference}
- Target Daily Intake: ${dailyCalories} kcal
- Primary Goal: ${goal}
- Frequency: ${mealsCount} meals per day
- Dietary Restrictions / Allergies: ${restrictions}
${getOngoingTimeContext()}

CRITICAL FORMATTING INSTRUCTIONS:
- Absolutely NEVER output any HTML tags or tag names (NO <br>, NO <br/>, NO <span>, NO <div>, NO <p>, NO HTML tags of any kind).
- DO NOT use HTML tables or markdown tables with embedded <br> tags.
- Present each meal using clear Markdown headings (### Meal 1: Breakfast) followed by clean bullet lists (- Item: portion size, macros).
- Use pure Markdown formatting with normal newlines only.

Format your output with:
1. **Target Macronutrient Breakdown** (Protein, Carbohydrates, Healthy Fats, Hydration Target)
2. **Detailed Meal-by-Meal Breakdown** (Portion sizes, exact food items, and estimated macros per meal)
3. **Peri-Workout Nutrition Strategy** (Pre-workout fuel and post-workout recovery)
4. **Micronutrient & Supplementation Considerations**
Safe dietary education only.`;

  if (client) {
    try {
      const { response, modelUsed } = await callGroqWithFallback(client, {
        messages: [
          {
            role: 'system',
            content: 'You are a sports science nutritionist and performance dietitian. You strictly output pure Markdown with ZERO HTML tags.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const rawPlan = response.choices[0]?.message?.content || '';
      const cleanedPlan = cleanAIText(rawPlan);
      const planText = cleanedPlan + `\n\n_${MEDICAL_DISCLAIMER}_`;

      return {
        plan: planText,
        source: `Groq AI (${modelUsed})`,
        disclaimer: MEDICAL_DISCLAIMER,
      };
    } catch (err) {
      console.warn('Groq Meal Planner Error:', err.message);
    }
  }

  // High-fidelity fallback
  const proteinTarget = Math.round((dailyCalories * 0.3) / 4);
  const carbsTarget = Math.round((dailyCalories * 0.45) / 4);
  const fatsTarget = Math.round((dailyCalories * 0.25) / 9);

  const fallbackMeal = `### **${dietPreference} Performance Nutrition Plan**

**Target Calories**: ${dailyCalories} kcal | **Goal**: ${goal} | **Restrictions**: ${restrictions}

#### **Macronutrient Architecture**
- **Protein**: ~${proteinTarget}g (~${Math.round(proteinTarget * 4)} kcal) — *Optimal for muscle protein synthesis*
- **Carbohydrates**: ~${carbsTarget}g (~${Math.round(carbsTarget * 4)} kcal) — *Primary fuel for intense sessions*
- **Fats**: ~${fatsTarget}g (~${Math.round(fatsTarget * 9)} kcal) — *Hormone synthesis & joint health*
- **Hydration**: 3.5 Liters of water daily + electrolyte replenishment

---

#### **Meal Schedule (${mealsCount} Meals)**

**Meal 1 — Morning Fuel (~${Math.round(dailyCalories * 0.25)} kcal)**
- 3 Whole Eggs + 2 Egg Whites scrambled with spinach
- 1 Slice 100% whole grain sourdough toast with 1/4 avocado
- 1 Cup black coffee or green tea + 500ml water

**Meal 2 — Mid-Day High-Protein Anchor (~${Math.round(dailyCalories * 0.3)} kcal)**
- 180g Herb-roasted chicken breast or extra-firm tofu
- 1 Cup steamed brown basmati rice or tri-color quinoa
- 1.5 Cups roasted broccoli, zucchini, and bell peppers in olive oil

**Meal 3 — Pre/Post Workout Fuel (~${Math.round(dailyCalories * 0.2)} kcal)**
- 1 Scoop Whey Protein Isolate mixed in cold water or almond milk
- 1 Medium banana with 1 tbsp natural almond butter
- 1 Rice cake with organic honey

**Meal 4 — Evening Recovery Dinner (~${Math.round(dailyCalories * 0.25)} kcal)**
- 180g Atlantic salmon fillet or lean sirloin
- 1 Large baked sweet potato with cinnamon
- Crisp arugula, cherry tomato, and cucumber salad with lemon-dill dressing

---
_${MEDICAL_DISCLAIMER}_`;

  return {
    plan: fallbackMeal,
    source: 'PulseForge Nutrition Sciences',
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

module.exports = {
  generateDailyFitnessSuite,
  chatWithAssistant,
  generateWorkoutRoutine,
  generateMealPlanArchitecture,
};
