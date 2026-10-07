import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Send,
  Droplets,
  Flame,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { aiApi } from '../../services/api';
import { Button } from '../ui/Button';

export function AIFitnessHub({ memberGoal = 'Strength & Hypertrophy', initialFitnessLevel = 'Intermediate' }) {
  const [activeTab, setActiveTab] = useState('PLAN'); // 'PLAN' | 'MEALS' | 'CALORIES' | 'WORKOUT' | 'INSIGHTS' | 'ASSISTANT'
  const [aiData, setAiData] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [errorPlan, setErrorPlan] = useState(null);

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your PulseForge AI Fitness Assistant. Ask me about exercise form cues, recovery routines, warm-ups, or balanced meal ideas.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Calorie & Nutrition Logs State
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: 'BREAKFAST',
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

  useEffect(() => {
    fetchDailyPlan();
    fetchNutritionLogs();
  }, []);

  const fetchDailyPlan = async () => {
    try {
      setLoadingPlan(true);
      setErrorPlan(null);
      const res = await aiApi.getDailyPlan({
        fitnessLevel: initialFitnessLevel,
        goal: memberGoal,
        targetArea: 'Full Body Conditioning',
      });
      if (res.success && res.data) {
        setAiData(res.data);
      }
    } catch (err) {
      console.error('Failed to load AI daily plan:', err);
      setErrorPlan(err.message || 'Unable to generate AI fitness plan right now.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const fetchNutritionLogs = async () => {
    try {
      const res = await aiApi.getNutrition();
      if (res.success && res.data) {
        setNutritionLogs(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch nutrition logs:', err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await aiApi.askAssistant({
        message: userMsg,
        history: chatMessages.slice(-4),
      });

      if (res.success && res.data?.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.data.reply, source: res.data.source },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I could not reach the AI service right now. Please try again in a few moments.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!newMeal.foodName || !newMeal.calories) return;

    try {
      const res = await aiApi.logNutrition(newMeal);
      if (res.success && res.data) {
        setNutritionLogs((prev) => [res.data, ...prev]);
        setShowAddMealModal(false);
        setNewMeal({
          mealType: 'BREAKFAST',
          foodName: '',
          calories: '',
          protein: '',
          carbs: '',
          fats: '',
        });
      }
    } catch (err) {
      alert(`Could not log meal: ${err.message}`);
    }
  };

  const totalCaloriesLogged = nutritionLogs.reduce((sum, item) => sum + item.calories, 0);
  const targetCalories = aiData?.mealPlan?.targetCalories || 2200;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-100 text-purple-700">
              <Sparkles size={16} />
            </span>
            <h3 className="text-xl font-bold text-ink">AI Fitness & Wellness Suite</h3>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
              Groq Llama 3.3
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Evidence-based daily fitness planning, structured nutrition breakdown, and interactive wellness assistant.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchDailyPlan}
          disabled={loadingPlan}
          className="border-slate-200 text-xs shrink-0"
        >
          <RefreshCw size={13} className={loadingPlan ? 'animate-spin' : ''} /> Regenerate Protocol
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {[
          { id: 'PLAN', label: "Today's Plan", icon: Sparkles },
          { id: 'MEALS', label: 'Diet & Meal Suggestions', icon: UtensilsCrossed },
          { id: 'CALORIES', label: 'Calorie Tracker', icon: Flame },
          { id: 'WORKOUT', label: 'Workout Suggestions', icon: Dumbbell },
          { id: 'INSIGHTS', label: 'Progress Insights', icon: CheckCircle2 },
          { id: 'ASSISTANT', label: 'Fitness Assistant', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Error state */}
      {errorPlan && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <p className="font-bold">Notice</p>
          <p className="mt-0.5">{errorPlan}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loadingPlan && activeTab !== 'ASSISTANT' && activeTab !== 'CALORIES' && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-44 rounded-2xl bg-slate-100" />
            <div className="h-44 rounded-2xl bg-slate-100" />
          </div>
        </div>
      )}

      {/* TAB 1: TODAY'S PLAN */}
      {!loadingPlan && activeTab === 'PLAN' && aiData?.todaysPlan && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-900 to-indigo-950 p-6 text-white">
            <span className="rounded-full bg-purple-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200 border border-purple-300/30">
              {aiData.todaysPlan.intensityLevel} Intensity
            </span>
            <h4 className="mt-2 text-xl font-bold">{aiData.todaysPlan.title}</h4>
            <p className="mt-2 text-xs text-purple-200 italic max-w-xl">
              "{aiData.todaysPlan.motivationalQuote}"
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-purple-100">
              <span className="flex items-center gap-1.5">
                <Dumbbell size={14} className="text-purple-300" /> Focus: {aiData.todaysPlan.targetFocus}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-purple-300" /> Duration: ~{aiData.todaysPlan.estimatedDurationMinutes} mins
              </span>
            </div>
          </div>

          {/* Quick macro highlights */}
          {aiData.mealPlan && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Target Calories</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{aiData.mealPlan.targetCalories} kcal</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Daily Protein</p>
                <p className="mt-1 text-2xl font-extrabold text-brand-600">{aiData.mealPlan.proteinGrams}g</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Complex Carbs</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-600">{aiData.mealPlan.carbsGrams}g</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Hydration Goal</p>
                <p className="mt-1 text-2xl font-extrabold text-blue-600">{aiData.mealPlan.hydrationGoalLiters} L</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEALS & DIET SUGGESTIONS */}
      {!loadingPlan && activeTab === 'MEALS' && aiData?.mealPlan && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {['breakfast', 'lunch', 'snack', 'dinner'].map((mealKey) => {
              const meal = aiData.mealPlan[mealKey];
              if (!meal) return null;

              return (
                <div key={mealKey} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      {mealKey}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-extrabold text-ink">
                      {meal.calories} kcal
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-ink">{meal.name}</h5>

                  {/* Macros ribbon */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Protein: <strong>{meal.protein}g</strong></span>
                    <span>•</span>
                    <span>Carbs: <strong>{meal.carbs}g</strong></span>
                    <span>•</span>
                    <span>Fats: <strong>{meal.fats}g</strong></span>
                  </div>

                  {/* Bullet items */}
                  {meal.items && meal.items.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-600">
                      {meal.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CALORIE & NUTRITION TRACKER */}
      {activeTab === 'CALORIES' && (
        <div className="space-y-6">
          {/* Calorie Gauge Banner */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Calorie Balance</p>
              <h4 className="mt-1 text-2xl font-extrabold text-ink">
                {totalCaloriesLogged} / {targetCalories} kcal
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {Math.max(0, targetCalories - totalCaloriesLogged)} kcal remaining for today’s energy target.
              </p>
            </div>

            <Button size="sm" onClick={() => setShowAddMealModal(true)} className="text-xs">
              <Plus size={14} /> Log Meal Entry
            </Button>
          </div>

          {/* Logged Meals List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink">Today's Meal Journal</h4>
            {nutritionLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No meals logged for today yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                {nutritionLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3.5 bg-white text-xs">
                    <div>
                      <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 uppercase mr-2">
                        {log.mealType}
                      </span>
                      <span className="font-bold text-ink">{log.foodName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-ink">{log.calories} kcal</span>
                      {log.protein && <span className="text-slate-400">{log.protein}g P</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Meal Modal */}
          {showAddMealModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <h4 className="text-base font-bold text-ink">Record Nutrition Entry</h4>
                <p className="text-xs text-slate-500 mt-1">
                  General informational calorie tracker based on your meal portion.
                </p>

                <form onSubmit={handleAddMeal} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Meal Type</label>
                    <select
                      value={newMeal.mealType}
                      onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="SNACK">Snack</option>
                      <option value="DINNER">Dinner</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Food Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Scrambled eggs on sourdough toast"
                      value={newMeal.foodName}
                      onChange={(e) => setNewMeal({ ...newMeal, foodName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Calories (kcal)</label>
                      <input
                        type="number"
                        placeholder="350"
                        value={newMeal.calories}
                        onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Protein (g, opt)</label>
                      <input
                        type="number"
                        placeholder="25"
                        value={newMeal.protein}
                        onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMealModal(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs">
                      Save Entry
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WORKOUT SUGGESTIONS */}
      {!loadingPlan && activeTab === 'WORKOUT' && aiData?.workoutSuggestions && (
        <div className="space-y-3">
          {aiData.workoutSuggestions.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                    {idx + 1}
                  </span>
                  <h5 className="text-sm font-bold text-ink">{item.exerciseName}</h5>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item.targetMuscle}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{item.notes}</p>
              </div>

              <div className="flex items-center gap-3 text-xs shrink-0 font-semibold text-ink">
                <span>{item.sets} Sets × {item.reps}</span>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock size={12} /> {item.restSeconds}s Rest
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PROGRESS & WELLNESS INSIGHTS */}
      {!loadingPlan && activeTab === 'INSIGHTS' && aiData?.progressInsights && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Coaching Consistency Score
              </span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {aiData.progressInsights.consistencyScore}/100
              </span>
            </div>
            <h5 className="text-base font-bold text-ink">Weekly Training Adaptation</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              {aiData.progressInsights.weeklyTip}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recovery & CNS Health
            </span>
            <h5 className="text-base font-bold text-ink">Sleep & Joint Resilience</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              {aiData.progressInsights.recoveryAdvice}
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: CONVERSATIONAL ASSISTANT */}
      {activeTab === 'ASSISTANT' && (
        <div className="space-y-4">
          {/* Chat transcript viewport */}
          <div className="h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-soft'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-400 shadow-soft flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                  Generating coach guidance...
                </div>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your workout, gym routine, or general fitness..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-ink focus:border-purple-600 focus:outline-hidden"
              disabled={chatLoading}
            />
            <Button type="submit" size="sm" disabled={chatLoading || !chatInput.trim()} className="text-xs">
              <Send size={14} /> Send
            </Button>
          </form>
        </div>
      )}

      {/* Medical & Safety Guidance Notice */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-[11px] text-slate-500">
        <ShieldAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p>
          {aiData?.disclaimer ||
            'Notice: This information provides general fitness and wellness educational guidance only and does not constitute medical advice or therapy. Consult a healthcare professional before starting any strenuous exercise program.'}
        </p>
      </div>
    </div>
  );
}
