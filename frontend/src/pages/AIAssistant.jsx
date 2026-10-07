import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  MessageSquare,
  Send,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/ui/Button';

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'meal' | 'chat'

  // Workout state
  const [workoutForm, setWorkoutForm] = useState({
    fitnessLevel: 'Intermediate',
    goal: 'Muscle Hypertrophy',
    daysPerWeek: 4,
    targetArea: 'Full Body',
    equipmentAvailable: 'Commercial Gym',
  });
  const [workoutResult, setWorkoutResult] = useState(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutError, setWorkoutError] = useState('');

  // Meal state
  const [mealForm, setMealForm] = useState({
    dietPreference: 'Balanced High-Protein',
    dailyCalories: 2200,
    goal: 'Lean Muscle Maintenance',
    mealsCount: 4,
    restrictions: 'None',
  });
  const [mealResult, setMealResult] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError, setMealError] = useState('');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am PulseForge AI, powered by Groq. I can assist you with workout mechanics, nutrition ideas, progressive overload recommendations, or gym floor management best practices.\n\n*Notice: All information provided is for general wellness education only.*`,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Workout handler
  const handleGenerateWorkout = async (e) => {
    e.preventDefault();
    try {
      setWorkoutLoading(true);
      setWorkoutError('');
      const res = await aiApi.generateWorkout(workoutForm);
      if (res.success) {
        setWorkoutResult(res.data);
      }
    } catch (err) {
      setWorkoutError(err.message || 'Failed to generate workout suggestion');
    } finally {
      setWorkoutLoading(false);
    }
  };

  // Meal handler
  const handleGenerateMeal = async (e) => {
    e.preventDefault();
    try {
      setMealLoading(true);
      setMealError('');
      const res = await aiApi.generateMealPlan(mealForm);
      if (res.success) {
        setMealResult(res.data);
      }
    } catch (err) {
      setMealError(err.message || 'Failed to generate meal plan');
    } finally {
      setMealLoading(false);
    }
  };

  // Chat handler
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userPrompt = chatInput.trim();
    const updatedHistory = [...chatMessages, { role: 'user', content: userPrompt }];
    setChatMessages(updatedHistory);
    setChatInput('');

    try {
      setChatLoading(true);
      const res = await aiApi.askAssistant({
        question: userPrompt,
        history: updatedHistory.slice(-5),
      });

      if (res.success) {
        setChatMessages([
          ...updatedHistory,
          { role: 'assistant', content: res.data.answer, source: res.data.source },
        ]);
      }
    } catch (err) {
      setChatMessages([
        ...updatedHistory,
        {
          role: 'assistant',
          content: 'Unable to process your request at this moment. Please check server connectivity.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Wellness & Coaching Suite"
        subtitle="Intelligent fitness routines, nutritional architectures, and management consulting powered by Groq"
        icon={BrainCircuit}
      />

      {/* Medical Educational Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
        <ShieldAlert size={20} className="shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider text-amber-800">
            Wellness Guidance Notice
          </p>
          <p className="mt-0.5 leading-relaxed text-amber-800/90">
            The AI features in this platform provide general exercise and nutrition educational information only.
            They do not constitute medical diagnoses, prescriptions, or therapeutic advice. Always consult a physician
            before undertaking rigorous physical conditioning.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab('workout')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === 'workout'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Dumbbell size={16} /> Workout Generator
        </button>

        <button
          onClick={() => setActiveTab('meal')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === 'meal'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed size={16} /> Meal Architecture
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === 'chat'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={16} /> Fitness Assistant
        </button>
      </div>

      {/* TAB 1: WORKOUT GENERATOR */}
      {activeTab === 'workout' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Input Parameters Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Sparkles size={18} className="text-brand-600" />
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">
                Workout Parameters
              </h3>
            </div>

            <form onSubmit={handleGenerateWorkout} className="space-y-4 text-xs">
              {workoutError && (
                <div className="rounded-xl bg-rose-50 p-3 font-semibold text-rose-700">
                  {workoutError}
                </div>
              )}

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Experience Level
                </label>
                <select
                  value={workoutForm.fitnessLevel}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, fitnessLevel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner (Under 6 months)</option>
                  <option value="Intermediate">Intermediate (1 - 3 years)</option>
                  <option value="Advanced">Advanced (3+ years)</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Primary Objective
                </label>
                <select
                  value={workoutForm.goal}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="Muscle Hypertrophy">Muscle Hypertrophy (Size)</option>
                  <option value="Pure Strength & Power">Pure Strength & Power</option>
                  <option value="Fat Loss & Conditioning">Fat Loss & Conditioning</option>
                  <option value="Endurance & Mobility">Endurance & Mobility</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Training Frequency (Days/Week)
                </label>
                <select
                  value={workoutForm.daysPerWeek}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, daysPerWeek: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value={3}>3 Days (Full Body Split)</option>
                  <option value={4}>4 Days (Upper / Lower Split)</option>
                  <option value={5}>5 Days (Push / Pull / Legs)</option>
                  <option value={6}>6 Days (High Frequency Split)</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Target Muscle Focus
                </label>
                <input
                  type="text"
                  value={workoutForm.targetArea}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, targetArea: e.target.value })}
                  placeholder="e.g. Chest & Back, Full Body, Core Engine"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Equipment Setup
                </label>
                <input
                  type="text"
                  value={workoutForm.equipmentAvailable}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, equipmentAvailable: e.target.value })}
                  placeholder="e.g. Full Commercial Gym, Barbell + Dumbbells"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={workoutLoading} className="w-full">
                  {workoutLoading ? (
                    'Generating Plan...'
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate Routine
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Plan Display Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 min-h-[480px] flex flex-col justify-between">
            {workoutLoading ? (
              <LoadingSpinner text="Generating structured workout routine via Groq AI..." />
            ) : workoutResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                      {workoutResult.source}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(workoutResult.plan, 'workout')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    {copiedIndex === 'workout' ? (
                      <>
                        <Check size={14} className="text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Plan
                      </>
                    )}
                  </button>
                </div>

                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap font-sans text-slate-800">
                  {workoutResult.plan}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <Dumbbell size={40} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No workout generated yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Fill in your preferred training parameters and click "Generate Routine" to produce a periodized plan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MEAL PLANNER */}
      {activeTab === 'meal' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <UtensilsCrossed size={18} className="text-brand-600" />
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">
                Nutrition Profile
              </h3>
            </div>

            <form onSubmit={handleGenerateMeal} className="space-y-4 text-xs">
              {mealError && (
                <div className="rounded-xl bg-rose-50 p-3 font-semibold text-rose-700">{mealError}</div>
              )}

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Dietary Pattern
                </label>
                <select
                  value={mealForm.dietPreference}
                  onChange={(e) => setMealForm({ ...mealForm, dietPreference: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="Balanced High-Protein">Balanced High-Protein</option>
                  <option value="Vegetarian High-Protein">Vegetarian High-Protein</option>
                  <option value="Keto / Low-Carb">Keto / Low-Carb</option>
                  <option value="Plant-Based / Vegan">Plant-Based / Vegan</option>
                  <option value="Mediterranean Wellness">Mediterranean Wellness</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Target Daily Energy (kcal)
                </label>
                <input
                  type="number"
                  step="50"
                  value={mealForm.dailyCalories}
                  onChange={(e) => setMealForm({ ...mealForm, dailyCalories: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Primary Transformation Goal
                </label>
                <select
                  value={mealForm.goal}
                  onChange={(e) => setMealForm({ ...mealForm, goal: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="Lean Muscle Maintenance">Lean Muscle Maintenance</option>
                  <option value="Caloric Deficit & Fat Loss">Caloric Deficit & Fat Loss</option>
                  <option value="Clean Bulk / Hypertrophy">Clean Bulk / Hypertrophy</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Meals per Day
                </label>
                <select
                  value={mealForm.mealsCount}
                  onChange={(e) => setMealForm({ ...mealForm, mealsCount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value={3}>3 Meals</option>
                  <option value={4}>4 Meals (Recommended)</option>
                  <option value={5}>5 Meals</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Sensitivities / Restrictions
                </label>
                <input
                  type="text"
                  value={mealForm.restrictions}
                  onChange={(e) => setMealForm({ ...mealForm, restrictions: e.target.value })}
                  placeholder="e.g. Lactose-free, Gluten-free, No peanuts"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={mealLoading} className="w-full">
                  {mealLoading ? (
                    'Calculating Meals...'
                  ) : (
                    <>
                      <Sparkles size={16} /> Plan Daily Architecture
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 min-h-[480px] flex flex-col justify-between">
            {mealLoading ? (
              <LoadingSpinner text="Constructing macronutrient architecture via Groq AI..." />
            ) : mealResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                    {mealResult.source}
                  </span>
                  <button
                    onClick={() => copyToClipboard(mealResult.plan, 'meal')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    {copiedIndex === 'meal' ? (
                      <>
                        <Check size={14} className="text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Nutrition Guide
                      </>
                    )}
                  </button>
                </div>

                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap font-sans text-slate-800">
                  {mealResult.plan}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <UtensilsCrossed size={40} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No meal plan calculated yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Configure your caloric targets and dietary restrictions, then click "Plan Daily Architecture".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FITNESS ASSISTANT CHAT */}
      {activeTab === 'chat' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[650px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-bold text-ink text-sm">PulseForge Conversational Engine</h3>
                <p className="text-xs text-slate-500">Live Q&A on biomechanics, nutrition, and gym operations</p>
              </div>
            </div>
            <button
              onClick={() =>
                setChatMessages([
                  {
                    role: 'assistant',
                    content: 'Chat history reset. How can I assist your gym journey or operations today?',
                  },
                ])
              }
              title="Reset Conversation"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50 p-3">
            {[
              'How to optimize bench press bar path?',
              'Daily protein intake for muscle hypertrophy',
              'Strategies to improve gym member retention',
              'Safe warm-up protocol for heavy squats',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setChatInput(prompt)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-600 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-brand-600 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-100/80 text-slate-800 rounded-bl-none border border-slate-200/60'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.source && (
                      <p className="mt-2 text-[10px] font-semibold text-slate-400">
                        Response generated via {msg.source}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none bg-slate-100 p-4 text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-600 animate-spin" />
                  Generating response via Groq Llama 3.3...
                </div>
              </div>
            )}
          </div>

          {/* Input field */}
          <form onSubmit={handleSendChat} className="border-t border-slate-200 p-4 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about workout splits, recovery, nutrition, or gym management..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
            />
            <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
              <Send size={16} /> Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
