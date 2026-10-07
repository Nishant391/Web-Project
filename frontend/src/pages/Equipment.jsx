import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Search,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { equipmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';

export default function Equipment() {
  const { isAdmin } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Strength',
    quantity: 1,
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    location: '',
    purchaseDate: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    cost: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, [categoryFilter]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await equipmentApi.getAll({ category: categoryFilter || undefined });
      if (res.success) {
        setEquipmentList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Strength',
      quantity: 1,
      condition: 'EXCELLENT',
      status: 'AVAILABLE',
      location: 'Floor 1 - Main Zone',
      purchaseDate: new Date().toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      cost: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'Strength',
      quantity: item.quantity || 1,
      condition: item.condition || 'EXCELLENT',
      status: item.status || 'AVAILABLE',
      location: item.location || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
      lastMaintenanceDate: item.lastMaintenanceDate ? item.lastMaintenanceDate.split('T')[0] : '',
      nextMaintenanceDate: item.nextMaintenanceDate ? item.nextMaintenanceDate.split('T')[0] : '',
      cost: item.cost || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenMaintenance = (item) => {
    setSelectedItem(item);
    setFormData({
      ...formData,
      condition: 'EXCELLENT',
      status: 'AVAILABLE',
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    });
    setIsMaintenanceModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      setFormError('Name and category are required');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await equipmentApi.create(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchEquipment();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to register equipment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await equipmentApi.update(selectedItem.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        setIsMaintenanceModalOpen(false);
        fetchEquipment();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update equipment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await equipmentApi.delete(selectedItem.id);
      if (res.success) {
        setIsDeleteDialogOpen(false);
        fetchEquipment();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove equipment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const maintenanceNeededCount = equipmentList.filter(
    (e) => e.condition === 'NEEDS_SERVICE' || e.condition === 'OUT_OF_ORDER' || e.status === 'UNDER_MAINTENANCE'
  ).length;

  const filteredEquipment = equipmentList.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Fleet & Maintenance"
        subtitle="Manage commercial fitness machinery, free weight racks, safety audits, and service schedules"
        icon={Activity}
      >
        {isAdmin && (
          <Button onClick={handleOpenAdd}>
            <Plus size={16} /> Register Equipment
          </Button>
        )}
      </PageHeader>

      {/* Fleet KPI overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Machines & Racks"
          value={equipmentList.length}
          subtitle="Registered gym floor assets"
          icon={Activity}
        />

        <StatCard
          title="Service Required"
          value={maintenanceNeededCount}
          subtitle="Needs preventive maintenance"
          icon={Wrench}
          badge={maintenanceNeededCount > 0 ? 'Action Required' : 'All Clear'}
        />

        <StatCard
          title="Available Floor Status"
          value={equipmentList.filter((e) => e.status === 'AVAILABLE').length}
          subtitle="Operational and safe"
          icon={CheckCircle2}
          trendType="positive"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment by name, category, or floor zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Cardio">Cardio</option>
          <option value="Strength">Strength</option>
          <option value="Free Weights">Free Weights</option>
          <option value="Functional">Functional</option>
        </select>
      </div>

      {/* Equipment Table */}
      {loading ? (
        <LoadingSpinner text="Fetching equipment fleet..." />
      ) : filteredEquipment.length === 0 ? (
        <EmptyState
          title="No equipment found"
          description="Register your gym machines and free weights to track service cycles."
          actionLabel="Register Equipment"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Equipment / Asset</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Condition</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Next Service</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.map((eq) => {
                  const nextDate = eq.nextMaintenanceDate ? new Date(eq.nextMaintenanceDate) : null;

                  return (
                    <tr key={eq.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="font-bold text-ink">{eq.name}</p>
                        <p className="text-xs text-slate-400">Qty: {eq.quantity} units</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {eq.category}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          {eq.location || 'Main Floor'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={eq.condition}>{eq.condition}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={eq.status}>{eq.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {nextDate ? (
                          nextDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        ) : (
                          <span className="text-slate-400">Not Scheduled</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenMaintenance(eq)}
                            title="Log Maintenance"
                            className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 transition"
                          >
                            <Wrench size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(eq)}
                                title="Edit Asset"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(eq);
                                  setIsDeleteDialogOpen(true);
                                }}
                                title="Remove Asset"
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register Gym Asset' : 'Update Equipment Record'}
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asset Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Commercial Treadmill T900"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Cardio">Cardio</option>
                <option value="Strength">Strength</option>
                <option value="Free Weights">Free Weights</option>
                <option value="Functional">Functional</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Physical Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="NEEDS_SERVICE">NEEDS_SERVICE</option>
                <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Floor Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="IN_USE">IN_USE</option>
                <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Floor Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Zone 1 - Cardio Deck"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Scheduled Service</label>
              <input
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
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
              {formSubmitting ? 'Saving...' : isAddModalOpen ? 'Register Asset' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Maintenance Quick Modal */}
      {selectedItem && (
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          title={`Log Maintenance - ${selectedItem.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Record safety inspection or technician servicing for this machine.
            </p>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Updated Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none"
              >
                <option value="EXCELLENT">EXCELLENT (Pass Inspection)</option>
                <option value="GOOD">GOOD (Minor wear, safe)</option>
                <option value="NEEDS_SERVICE">NEEDS_SERVICE</option>
                <option value="OUT_OF_ORDER">OUT_OF_ORDER (Lock out)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Floor Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none"
              >
                <option value="AVAILABLE">AVAILABLE (Return to Floor)</option>
                <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Service Due Date</label>
              <input
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsMaintenanceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? 'Updating...' : 'Log & Return to Floor'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Equipment Asset"
        description={`Are you sure you want to delete ${selectedItem?.name}? Maintenance logs for this asset will be removed.`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
}
