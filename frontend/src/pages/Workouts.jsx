import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Layers,
  Calendar,
  User,
  PlusCircle,
  X,
} from 'lucide-react';
import { workoutApi, memberApi, trainerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';

export default function Workouts() {
  const { role, isMember, isAdmin, isTrainer } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetGoal: 'Muscle Hypertrophy',
    difficultyLevel: 'INTERMEDIATE',
    memberId: '',
    trainerId: '',
    exercises: [
      {
        exerciseName: 'Barbell Flat Bench Press',
        sets: 4,
        reps: '8-10',
        weight: '70 kg',
        restSeconds: 90,
        dayOfWeek: 'Monday (Push)',
        notes: 'Full range of motion, control the descent.',
      },
    ],
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchWorkoutsData();
  }, []);

  const fetchWorkoutsData = async () => {
    try {
      setLoading(true);
      const isCoachOrAdmin = isAdmin || isTrainer;

      const promises = [workoutApi.getAll()];
      if (isCoachOrAdmin) {
        promises.push(memberApi.getAll({ status: 'ACTIVE' }).catch(() => ({ success: false, data: [] })));
        promises.push(trainerApi.getAll({ status: 'ACTIVE' }).catch(() => ({ success: false, data: [] })));
      }

      const [workoutsRes, membersRes, trainersRes] = await Promise.all(promises);

      if (workoutsRes?.success) {
        setWorkouts(workoutsRes.data);
        if (workoutsRes.data.length > 0) {
          setExpandedId(workoutsRes.data[0].id);
        }
      }
      if (membersRes?.success) setMembers(membersRes.data);
      if (trainersRes?.success) setTrainers(trainersRes.data);
    } catch (err) {
      console.error('Failed to load workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      description: '',
      targetGoal: 'Muscle Hypertrophy',
      difficultyLevel: 'INTERMEDIATE',
      memberId: members[0]?.id || '',
      trainerId: trainers[0]?.id || '',
      exercises: [
        {
          exerciseName: 'Barbell Flat Bench Press',
          sets: 4,
          reps: '8-10',
          weight: '70 kg',
          restSeconds: 90,
          dayOfWeek: 'Monday (Push)',
          notes: 'Full range of motion, control the descent.',
        },
      ],
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddExerciseRow = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        {
          exerciseName: '',
          sets: 3,
          reps: '10-12',
          weight: '',
          restSeconds: 60,
          dayOfWeek: 'Day 1',
          notes: '',
        },
      ],
    });
  };

  const handleRemoveExerciseRow = (index) => {
    const updated = formData.exercises.filter((_, i) => i !== index);
    setFormData({ ...formData, exercises: updated });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...formData.exercises];
    updated[index][field] = value;
    setFormData({ ...formData, exercises: updated });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setFormError('Routine title is required');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await workoutApi.create(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchWorkoutsData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create routine');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await workoutApi.delete(selectedWorkout.id);
      if (res.success) {
        setIsDeleteDialogOpen(false);
        fetchWorkoutsData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete routine');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isMember ? 'My Workout Routine' : 'Workout Program Manager'}
        subtitle="Design progressive exercise routines, manage volume parameters, and assign routines to members"
        icon={Dumbbell}
      >
        <Link to="/ai-assistant">
          <Button variant="outline" className="border-brand-200 text-brand-700 bg-brand-50/50">
            <Sparkles size={16} className="text-brand-600" /> AI Generator
          </Button>
        </Link>
        {!isMember && (
          <Button onClick={handleOpenAdd}>
            <Plus size={16} /> New Routine
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <LoadingSpinner text="Fetching workout programs..." />
      ) : workouts.length === 0 ? (
        <EmptyState
          title="No workout routines found"
          description="Create your first structured routine or use the AI Generator."
          actionLabel="Create Routine"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => {
            const isExpanded = expandedId === w.id;

            return (
              <div
                key={w.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                  className="flex cursor-pointer flex-col justify-between gap-4 p-5 hover:bg-slate-50/50 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100">
                      <Dumbbell size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{w.title}</h3>
                        <Badge variant={w.difficultyLevel}>{w.difficultyLevel}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Goal: <strong className="text-slate-700">{w.targetGoal || 'General Fitness'}</strong> •{' '}
                        {w.exercises?.length || 0} Exercises programmed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right text-xs text-slate-500">
                      {w.member && (
                        <p>
                          Athlete: <strong className="text-slate-700">{w.member.name}</strong>
                        </p>
                      )}
                      {w.trainer && <p className="text-[11px]">Coach: {w.trainer.name}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isMember && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkout(w);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                          title="Delete Routine"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <span className="rounded-lg p-1.5 text-slate-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded exercise details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                    {w.description && (
                      <p className="mb-4 text-xs italic text-slate-600 border-l-2 border-brand-500 pl-3">
                        {w.description}
                      </p>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                          <tr>
                            <th className="pb-3 pr-4">Exercise Name</th>
                            <th className="pb-3 px-3">Split / Day</th>
                            <th className="pb-3 px-3">Sets & Reps</th>
                            <th className="pb-3 px-3">Weight Target</th>
                            <th className="pb-3 px-3">Rest</th>
                            <th className="pb-3 pl-3">Technique Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(w.exercises || []).map((ex) => (
                            <tr key={ex.id} className="hover:bg-white/60">
                              <td className="py-3 pr-4 font-bold text-ink">{ex.exerciseName}</td>
                              <td className="py-3 px-3">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                  {ex.dayOfWeek || 'All Days'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold">
                                {ex.sets} sets × {ex.reps} reps
                              </td>
                              <td className="py-3 px-3 text-slate-600">{ex.weight || 'Bodyweight'}</td>
                              <td className="py-3 px-3">{ex.restSeconds}s</td>
                              <td className="py-3 pl-3 text-slate-500 italic max-w-xs truncate">
                                {ex.notes || 'Control tempo, maintain tension.'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workout Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Structured Workout Routine"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Routine Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Upper Body Hypertrophy & Power"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Primary Goal
              </label>
              <select
                value={formData.targetGoal}
                onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Muscle Hypertrophy">Muscle Hypertrophy</option>
                <option value="Strength & Power">Strength & Power</option>
                <option value="Endurance & Fat Loss">Endurance & Fat Loss</option>
                <option value="Functional Conditioning">Functional Conditioning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Difficulty Level
              </label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Assign to Member
              </label>
              <select
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">General Gym Template</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supervising Trainer
              </label>
              <select
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Routine Philosophy / Instructions
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Warm-up guidelines, progressive overload cadence, rest protocols..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Dynamic Exercise List Builder */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Exercise Schedule & Sets
              </h4>
              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <PlusCircle size={15} /> Add Exercise
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {formData.exercises.map((ex, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 relative space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Exercise #{index + 1}</span>
                    {formData.exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseRow(index)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Exercise Name (e.g. Bench Press)"
                      value={ex.exerciseName}
                      onChange={(e) => handleExerciseChange(index, 'exerciseName', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Day / Split (e.g. Monday - Push)"
                      value={ex.dayOfWeek}
                      onChange={(e) => handleExerciseChange(index, 'dayOfWeek', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        placeholder="Sets (e.g. 4)"
                        value={ex.sets}
                        onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="text"
                        placeholder="Reps (e.g. 8-10)"
                        value={ex.reps}
                        onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Target Weight (e.g. 70 kg / Bodyweight)"
                      value={ex.weight}
                      onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Form cues & technique notes"
                      value={ex.notes}
                      onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving Routine...' : 'Save Workout Routine'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Workout Routine"
        description={`Are you sure you want to remove ${selectedWorkout?.title}? All programmed exercises within this routine will be removed.`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
}
