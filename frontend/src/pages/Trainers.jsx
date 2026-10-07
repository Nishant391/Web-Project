import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Mail,
  Phone,
  Award,
  UsersRound,
  Dumbbell,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { trainerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';

export default function Trainers() {
  const { isAdmin } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Strength & Hypertrophy',
    experienceYears: 3,
    bio: '',
    status: 'ACTIVE',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await trainerApi.getAll();
      if (res.success) {
        setTrainers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: 'Strength & Hypertrophy',
      experienceYears: 3,
      bio: '',
      status: 'ACTIVE',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setSelectedTrainer(t);
    setFormData({
      name: t.name || '',
      email: t.email || '',
      phone: t.phone || '',
      specialization: t.specialization || '',
      experienceYears: t.experienceYears || 1,
      bio: t.bio || '',
      status: t.status || 'ACTIVE',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenViewMembers = async (t) => {
    try {
      const res = await trainerApi.getById(t.id);
      if (res.success) {
        setSelectedTrainer(res.data);
        setIsMembersModalOpen(true);
      }
    } catch (err) {
      setSelectedTrainer(t);
      setIsMembersModalOpen(true);
    }
  };

  const handleOpenDelete = (t) => {
    setSelectedTrainer(t);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.specialization) {
      setFormError('Name, email, and specialization are required');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await trainerApi.create(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchTrainers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create trainer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await trainerApi.update(selectedTrainer.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchTrainers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update trainer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await trainerApi.delete(selectedTrainer.id);
      if (res.success) {
        setIsDeleteDialogOpen(false);
        fetchTrainers();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete trainer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredTrainers = trainers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.specialization?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainer Roster"
        subtitle="Manage certified fitness coaches, assigned athletes, and workout programs"
        icon={UserCheck}
      >
        {isAdmin && (
          <Button onClick={handleOpenAdd}>
            <Plus size={16} /> Register Trainer
          </Button>
        )}
      </PageHeader>

      {/* Search Input */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by trainer name, specialization, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching trainer roster..." />
      ) : filteredTrainers.length === 0 ? (
        <EmptyState
          title="No trainers found"
          description="Try adjusting your search criteria or register a new coach."
          actionLabel="Register Coach"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrainers.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-base font-bold text-brand-700 border border-brand-100">
                    {t.name.charAt(0)}
                  </div>
                  <Badge variant={t.status}>{t.status}</Badge>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-ink">{t.name}</h3>
                  <p className="text-xs font-semibold text-brand-600 mt-0.5">{t.specialization}</p>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-500 line-clamp-2">
                  {t.bio || 'Dedicated fitness professional committed to progressive athletic development.'}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" /> {t.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" /> {t.phone || 'No phone'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Award size={13} className="text-slate-400" /> {t.experienceYears} Years Experience
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleOpenViewMembers(t)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 transition"
                  >
                    <UsersRound size={15} className="text-slate-400" />
                    <span>{t._count?.members || 0} Members</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Edit Trainer"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(t)}
                          title="Delete Trainer"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Trainer Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register Certified Trainer' : 'Update Trainer Profile'}
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Trainer Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Marcus Vance"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="trainer@pulseforge.gym"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Specialization *</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Strength & Conditioning"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Bio</label>
            <textarea
              rows="3"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Certifications, coaching philosophy, track record..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : isAddModalOpen ? 'Register Trainer' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assigned Members Dialog */}
      {selectedTrainer && (
        <Modal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          title={`Assigned Athletes - ${selectedTrainer.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {(!selectedTrainer.members || selectedTrainer.members.length === 0) ? (
              <p className="text-sm text-slate-500 text-center py-6">No members currently assigned to this coach.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {selectedTrainer.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.email} • {m.membership?.name || 'No Plan'}</p>
                    </div>
                    <Badge variant={m.status}>{m.status}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsMembersModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Trainer Profile"
        description={`Are you sure you want to remove ${selectedTrainer?.name}? Any assigned members will be marked unassigned.`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
}
