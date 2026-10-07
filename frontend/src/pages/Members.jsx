import React, { useState, useEffect } from 'react';
import {
  UsersRound,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Shield,
  Dumbbell,
  CreditCard,
  Calendar,
  X,
} from 'lucide-react';
import { memberApi, trainerApi, membershipApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';

export default function Members() {
  const { role, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    emergencyContact: '',
    address: '',
    status: 'ACTIVE',
    trainerId: '',
    membershipId: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [membersRes, trainersRes, membershipsRes] = await Promise.all([
        memberApi.getAll({ status: statusFilter || undefined }),
        trainerApi.getAll({ status: 'ACTIVE' }),
        membershipApi.getAll({ status: 'ACTIVE' }),
      ]);

      if (membersRes.success) setMembers(membersRes.data);
      if (trainersRes.success) setTrainers(trainersRes.data);
      if (membershipsRes.success) setMemberships(membershipsRes.data);
    } catch (err) {
      console.error('Failed to fetch members list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      emergencyContact: '',
      address: '',
      status: 'ACTIVE',
      trainerId: trainers[0]?.id || '',
      membershipId: memberships[0]?.id || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setSelectedMember(m);
    setFormData({
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      gender: m.gender || 'Male',
      emergencyContact: m.emergencyContact || '',
      address: m.address || '',
      status: m.status || 'ACTIVE',
      trainerId: m.trainerId || '',
      membershipId: m.membershipId || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (m) => {
    try {
      const res = await memberApi.getById(m.id);
      if (res.success) {
        setSelectedMember(res.data);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      setSelectedMember(m);
      setIsViewModalOpen(true);
    }
  };

  const handleOpenDelete = (m) => {
    setSelectedMember(m);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await memberApi.create(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchInitialData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create member');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await memberApi.update(selectedMember.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchInitialData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update member');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await memberApi.delete(selectedMember.id);
      if (res.success) {
        setIsDeleteDialogOpen(false);
        fetchInitialData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete member');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Directory"
        subtitle="Manage member enrollments, assigned trainers, and plan subscriptions"
        icon={UsersRound}
      >
        <Button onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Member
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by member name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Member Table */}
      {loading ? (
        <LoadingSpinner text="Fetching members list..." />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          title="No members found"
          description="Try modifying your search query or enroll a new gym member."
          actionLabel="Enroll Member"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Member Name</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Membership Plan</th>
                  <th className="px-5 py-4">Trainer</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 border border-brand-100">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.gender || 'Not specified'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="text-xs flex items-center gap-1.5 font-medium text-slate-700">
                        <Mail size={13} className="text-slate-400" /> {m.email}
                      </p>
                      <p className="text-xs flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <Phone size={13} className="text-slate-400" /> {m.phone || 'No phone'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        {m.membership?.name || 'No Plan Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {m.trainer ? (
                        <div>
                          <p className="font-medium text-ink">{m.trainer.name}</p>
                          <p className="text-xs text-slate-400">{m.trainer.specialization}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={m.status}>{m.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(m)}
                          title="View Profile Details"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Member Information"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        >
                          <Edit2 size={17} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenDelete(m)}
                            title="Delete Member"
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Enroll New Gym Member' : 'Update Member Profile'}
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Mercer"
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
                placeholder="alex@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Membership Tier</label>
              <select
                value={formData.membershipId}
                onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">No Plan Assigned</option>
                {memberships.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (₹{m.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Trainer</label>
              <select
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+91 98000 00000 (Relation)"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Status</label>
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address / Sector</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 42 Sector 14, Urban Estate"
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
              {formSubmitting ? 'Saving...' : isAddModalOpen ? 'Create Member' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Member Profile Modal */}
      {selectedMember && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Member Profile: ${selectedMember.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-sm">
                {selectedMember.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-ink">{selectedMember.name}</h4>
                  <Badge variant={selectedMember.status}>{selectedMember.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">{selectedMember.email} • {selectedMember.phone || 'No phone'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Enrolled on {new Date(selectedMember.joinDate || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Plan & Trainer details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  <CreditCard size={15} className="text-brand-600" /> Plan Subscription
                </div>
                <p className="font-bold text-ink">{selectedMember.membership?.name || 'No Active Plan'}</p>
                {selectedMember.membership && (
                  <p className="text-xs text-slate-500 mt-1">
                    ₹{selectedMember.membership.price} • {selectedMember.membership.durationInDays} days access
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  <Dumbbell size={15} className="text-brand-600" /> Assigned Coach
                </div>
                <p className="font-bold text-ink">{selectedMember.trainer?.name || 'No Trainer Assigned'}</p>
                {selectedMember.trainer && (
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedMember.trainer.specialization}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency & Address */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-1">
              <p><strong className="text-slate-700">Emergency Contact:</strong> {selectedMember.emergencyContact || 'Not recorded'}</p>
              <p><strong className="text-slate-700">Address:</strong> {selectedMember.address || 'Not recorded'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                Close Profile
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
        title="Delete Member Account"
        description={`Are you sure you want to delete ${selectedMember?.name}? All associated attendance logs and workout assignments will be removed.`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
}
