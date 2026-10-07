import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Check,
  Building,
} from 'lucide-react';
import { paymentApi, memberApi, membershipApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';

export default function Payments() {
  const { isAdmin, isMember } = useAuth();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingRevenue: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    membershipId: '',
    amount: '',
    paymentMethod: 'UPI',
    status: 'COMPLETED',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPaymentsData();
  }, [statusFilter]);

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, statsRes, membersRes, membershipsRes] = await Promise.all([
        paymentApi.getAll({ status: statusFilter || undefined }),
        paymentApi.getStats(),
        memberApi.getAll({ status: 'ACTIVE' }),
        membershipApi.getAll({ status: 'ACTIVE' }),
      ]);

      if (paymentsRes.success) setPayments(paymentsRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (membersRes.success) setMembers(membersRes.data);
      if (membershipsRes.success) setMemberships(membershipsRes.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecord = () => {
    setFormData({
      memberId: members[0]?.id || '',
      membershipId: memberships[0]?.id || '',
      amount: memberships[0]?.price || '',
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      notes: 'Membership Package Payment',
    });
    setFormError('');
    setIsRecordModalOpen(true);
  };

  const handleMembershipChange = (e) => {
    const memId = e.target.value;
    const selectedMem = memberships.find((m) => m.id === parseInt(memId, 10));
    setFormData({
      ...formData,
      membershipId: memId,
      amount: selectedMem ? selectedMem.price : formData.amount,
    });
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberId || !formData.amount) {
      setFormError('Member and payment amount are required');
      return;
    }
    try {
      setSubmitting(true);
      setFormError('');
      const res = await paymentApi.create(formData);
      if (res.success) {
        setIsRecordModalOpen(false);
        fetchPaymentsData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      const res = await paymentApi.updateStatus(id, { status: 'COMPLETED' });
      if (res.success) {
        fetchPaymentsData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment status');
    }
  };

  const handleViewInvoice = (p) => {
    setSelectedInvoice(p);
    setIsInvoiceModalOpen(true);
  };

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.invoiceNumber?.toLowerCase().includes(q) ||
      p.member?.name?.toLowerCase().includes(q) ||
      p.paymentMethod?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isMember ? 'My Invoices & Receipts' : 'Payments & Invoicing'}
        subtitle="Manage member billing receipts, payment gateways, and recurring subscription dues"
        icon={Receipt}
      >
        {!isMember && (
          <Button onClick={handleOpenRecord}>
            <Plus size={16} /> Record Transaction
          </Button>
        )}
      </PageHeader>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Collected"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          subtitle={`${stats.completedCount} processed transactions`}
          icon={Receipt}
          trend="+12% YTD"
          trendType="positive"
        />

        <StatCard
          title="Pending Receivables"
          value={`₹${stats.pendingRevenue.toLocaleString('en-IN')}`}
          subtitle="Awaiting clearance / verification"
          icon={Clock}
          badge={stats.pendingRevenue > 0 ? 'Action Required' : 'All Settled'}
        />

        <StatCard
          title="Supported Gateways"
          value="4 Methods"
          subtitle="UPI, Credit/Debit, Net Banking, Cash"
          icon={CreditCard}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, member name or method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <LoadingSpinner text="Fetching payment records..." />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No payment records found"
          description="Record a new transaction to generate an invoice receipt."
          actionLabel="Record Transaction"
          onAction={handleOpenRecord}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Invoice #</th>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Plan / Purpose</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const pDate = new Date(p.paymentDate || p.createdAt);

                  return (
                    <tr key={p.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-ink">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-ink">{p.member?.name}</p>
                        <p className="text-xs text-slate-400">{p.member?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {p.membership?.name || p.notes || 'Gym Services'}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {pDate.toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-ink">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={p.status}>{p.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewInvoice(p)}
                            title="View Receipt"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <Eye size={16} />
                          </button>
                          {isAdmin && p.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkCompleted(p.id)}
                              title="Mark as Completed"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <Check size={16} />
                            </button>
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Member Payment Transaction"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Member *</label>
            <select
              required
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Membership Tier</label>
              <select
                value={formData.membershipId}
                onChange={handleMembershipChange}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Custom / Direct Charge</option>
                {memberships.map((mem) => (
                  <option key={mem.id} value={mem.id}>
                    {mem.name} (₹{mem.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount (INR) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="4999"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Gateway</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash Over Counter</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Quarterly membership renewal, reference bank transaction ID"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Generating Invoice...' : 'Generate Invoice Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Receipt Preview Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title={`Receipt: ${selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-ink text-base">PulseForge Gym Ops</h4>
                  <p className="text-xs text-slate-500">Official Membership Tax Invoice</p>
                </div>
                <Badge variant={selectedInvoice.status}>{selectedInvoice.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Billed To:</p>
                  <p className="font-bold text-ink mt-0.5">{selectedInvoice.member?.name}</p>
                  <p className="text-slate-500">{selectedInvoice.member?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-medium">Payment Date:</p>
                  <p className="font-bold text-ink mt-0.5">
                    {new Date(selectedInvoice.paymentDate).toLocaleDateString()}
                  </p>
                  <p className="text-slate-500">{selectedInvoice.paymentMethod}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    {selectedInvoice.membership?.name || 'Gym Membership'}
                  </span>
                  <span className="font-bold text-ink">
                    ₹{selectedInvoice.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedInvoice.notes && (
                  <p className="mt-1 text-xs text-slate-400 italic">{selectedInvoice.notes}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
