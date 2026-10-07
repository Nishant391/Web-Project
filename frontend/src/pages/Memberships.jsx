import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  UsersRound,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { membershipApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';

export default function Memberships() {
  const { isAdmin, isMember } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationInDays: 30,
    features: '',
    status: 'ACTIVE',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await membershipApi.getAll();
      if (res.success) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error('Failed to load membership plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      durationInDays: 30,
      features: 'Gym floor access, Locker access, Initial fitness consultation',
      status: 'ACTIVE',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      durationInDays: plan.durationInDays || 30,
      features: plan.features || '',
      status: plan.status || 'ACTIVE',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (plan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.durationInDays) {
      setFormError('Plan name, price, and duration are required');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await membershipApi.create(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchPlans();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create membership tier');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await membershipApi.update(selectedPlan.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchPlans();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update membership tier');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await membershipApi.delete(selectedPlan.id);
      if (res.success) {
        setIsDeleteDialogOpen(false);
        fetchPlans();
      }
    } catch (err) {
      alert(err.message || 'Cannot delete plan');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isMember ? 'My Membership Package' : 'Membership Plans'}
        subtitle="Manage membership tiers, billing intervals, duration terms, and amenity features"
        icon={CreditCard}
      >
        {isAdmin && (
          <Button onClick={handleOpenAdd}>
            <Plus size={16} /> Create Membership Tier
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <LoadingSpinner text="Fetching membership tiers..." />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No membership plans configured"
          description="Create your first subscription tier to begin enrolling members."
          actionLabel="Create Tier"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const featuresList = (p.features || '')
              .split(',')
              .map((f) => f.trim())
              .filter(Boolean);

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <Badge variant={p.status}>{p.status}</Badge>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <UsersRound size={14} /> {p._count?.members || 0} active
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-ink">{p.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {p.description || 'Standard membership access package.'}
                  </p>

                  <div className="mt-5 border-y border-slate-100 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-ink tracking-tight">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        / {p.durationInDays} days
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mt-5 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Amenities</p>
                    {featuresList.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-brand-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition"
                    >
                      <Edit2 size={14} /> Edit Plan
                    </button>
                    <button
                      onClick={() => handleOpenDelete(p)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Membership Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Create Membership Tier' : 'Update Membership Tier'}
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Pro Strength & Cardio"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Price (INR) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="4999"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationInDays}
                onChange={(e) => setFormData({ ...formData, durationInDays: e.target.value })}
                placeholder="30"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of tier privileges and access windows..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Features (Comma-separated)
            </label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="24/7 Access, Group Studio Classes, Sauna Access, Free Towel Service"
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
              {formSubmitting ? 'Saving...' : isAddModalOpen ? 'Create Tier' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Membership Tier"
        description={`Are you sure you want to delete ${selectedPlan?.name}? Plans with active enrolled members cannot be deleted.`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
}
