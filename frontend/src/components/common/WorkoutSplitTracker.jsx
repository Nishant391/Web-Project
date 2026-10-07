import React, { useState } from 'react';
import {
  Dumbbell,
  CheckCircle2,
  Clock,
  Flame,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { workoutApi } from '../../services/api';
import { Button } from '../ui/Button';

export function WorkoutSplitTracker({
  workouts = [],
  completions = [],
  onCompletionLogged,
  memberView = true,
}) {
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [completingId, setCompletingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  if (!workouts || workouts.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Dumbbell size={24} />
        </div>
        <h4 className="mt-4 text-base font-bold text-ink">No Workout Split Assigned Yet</h4>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Your personal trainer will configure and assign your customized training split (Push/Pull/Legs or Upper/Lower) based on your fitness goals.
        </p>
      </div>
    );
  }

  const currentWorkout = workouts[activeWorkoutIndex] || workouts[0];
  const exercises = currentWorkout.exercises || [];

  // Extract distinct days of week (e.g. "Day 1 - Push", "Day 2 - Pull")
  const distinctDays = Array.from(new Set(exercises.map((e) => e.dayOfWeek || 'General Routine')));

  const filteredExercises =
    selectedDay === 'ALL'
      ? exercises
      : exercises.filter((e) => (e.dayOfWeek || 'General Routine') === selectedDay);

  // Set of completed exercise IDs
  const completedExerciseIds = new Set(
    completions.map((c) => c.exerciseId).filter(Boolean)
  );

  const handleMarkComplete = async (exercise) => {
    try {
      setCompletingId(exercise.id);
      const res = await workoutApi.logCompletion({
        workoutId: currentWorkout.id,
        exerciseId: exercise.id,
        notes: `Target sets completed (${exercise.sets} sets x ${exercise.reps})`,
        durationMinutes: 45,
      });

      if (res.success) {
        setSuccessToast(`Logged "${exercise.exerciseName}" into workout history!`);
        setTimeout(() => setSuccessToast(null), 4000);
        if (onCompletionLogged) onCompletionLogged();
      }
    } catch (err) {
      alert(`Could not log completion: ${err.message}`);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-6">
      {/* Toast feedback */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Routine Title and Metadata */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 uppercase">
              {currentWorkout.splitType || 'Split Routine'}
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {currentWorkout.difficultyLevel} Level
            </span>
          </div>
          <h3 className="mt-1 text-xl font-extrabold text-ink">{currentWorkout.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{currentWorkout.description}</p>
        </div>

        {/* Switch workouts if member has multiple */}
        {workouts.length > 1 && (
          <div className="flex gap-2">
            {workouts.map((w, idx) => (
              <button
                key={w.id}
                onClick={() => {
                  setActiveWorkoutIndex(idx);
                  setSelectedDay('ALL');
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeWorkoutIndex === idx
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Split {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Split Days Filter Tabs */}
      {distinctDays.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              selectedDay === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Exercises ({exercises.length})
          </button>
          {distinctDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                selectedDay === day
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        {filteredExercises.map((exercise, index) => {
          const isCompleted = completedExerciseIds.has(exercise.id);
          const isLogging = completingId === exercise.id;

          return (
            <div
              key={exercise.id}
              className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 transition md:flex-row md:items-center ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                  {index + 1}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-ink">{exercise.exerciseName}</h4>
                    {exercise.dayOfWeek && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {exercise.dayOfWeek}
                      </span>
                    )}
                  </div>

                  {/* Target parameters */}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-ink">
                      {exercise.sets} Sets × {exercise.reps} Reps
                    </span>
                    {exercise.weight && (
                      <span className="text-slate-500">• Weight: {exercise.weight}</span>
                    )}
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} className="text-slate-400" /> Rest: {exercise.restSeconds}s
                    </span>
                  </div>

                  {exercise.notes && (
                    <p className="mt-1 text-[11px] text-slate-500 italic">
                      Coach Note: {exercise.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Action: Mark Completed */}
              {memberView && (
                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 rounded-xl bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 size={15} className="text-emerald-600" /> Completed
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkComplete(exercise)}
                      disabled={isLogging}
                      className="border-slate-200 hover:border-brand-500 hover:text-brand-700 text-xs"
                    >
                      {isLogging ? 'Logging...' : 'Mark Done'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Completion History Snippet */}
      {completions && completions.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Recent Verified Completions
          </p>
          <div className="flex flex-wrap gap-2">
            {completions.slice(0, 5).map((comp) => (
              <span
                key={comp.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
              >
                <CheckCircle2 size={12} className="text-emerald-600" />
                {comp.exercise?.exerciseName || 'Training Session'} •{' '}
                {new Date(comp.completedDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
