import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  ADMIN_INPUT_CLASS,
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1516321497487-e288fb1978f7?auto=format&fit=crop&w=1920&q=85';

const AdminNewsletter = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [deleteSubscription, setDeleteSubscription] = useState(null);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({ email: '', name: '', is_active: true });
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ subject: '', body: '', html_body: '', test_mode: false });
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const fetchSubscriptions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      const response = await api.get('/newsletter/subscriptions/');
      const data = response.data.results ?? response.data;
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load subscriptions. Please try again.');
      setSubscriptions([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchSubscriptions();
  }, [isAuthenticated, user, navigate, fetchSubscriptions]);

  const handleCreate = () => {
    setEditingSubscription(null);
    setFormData({ email: '', name: '', is_active: true });
    setShowForm(true);
  };

  const handleEdit = (subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      email: subscription.email || '',
      name: subscription.name || '',
      is_active: subscription.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubscription) {
        await api.patch(`/newsletter/subscriptions/${editingSubscription.id}/`, formData);
      } else {
        await api.post('/newsletter/subscriptions/', formData);
      }
      fetchSubscriptions();
      setShowForm(false);
      setEditingSubscription(null);
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Failed to save subscription';
      alert(msg);
    }
  };

  const handleDelete = (sub) => setDeleteSubscription(sub);

  const confirmDelete = async () => {
    try {
      await api.delete(`/newsletter/subscriptions/${deleteSubscription.id}/`);
      fetchSubscriptions();
      setDeleteSubscription(null);
    } catch (err) {
      alert('Failed to delete subscription.');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubscriptions.map((s) => s.id)));
    }
  };

  const handleBulkDelete = () => setBulkDeleteDialog(true);

  const confirmBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await api.delete(`/newsletter/subscriptions/${id}/`);
      }
      setSelectedIds(new Set());
      setBulkDeleteDialog(false);
      fetchSubscriptions();
    } catch (err) {
      alert('Failed to delete some subscriptions.');
    }
  };

  const handleToggleActive = async (sub) => {
    setActionLoading(sub.id);
    try {
      await api.patch(`/newsletter/subscriptions/${sub.id}/`, { is_active: !sub.is_active });
      fetchSubscriptions();
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenSend = () => {
    setSendForm({ subject: '', body: '', html_body: '', test_mode: false });
    setSendResult(null);
    setShowSendModal(true);
  };

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    const subject = sendForm.subject.trim();
    const body = sendForm.body.trim();
    const html_body = sendForm.html_body.trim();
    if (!subject || (!body && !html_body)) {
      alert('Subject and at least one of Body or HTML Body are required.');
      return;
    }
    setSendLoading(true);
    setSendResult(null);
    try {
      const res = await api.post('/newsletter/send/', {
        subject,
        body: body || undefined,
        html_body: html_body || undefined,
        test_mode: sendForm.test_mode,
      });
      setSendResult({ success: true, data: res.data });
      if (res.data.sent > 0 && !sendForm.test_mode) {
        setSendForm({ subject: '', body: '', html_body: '', test_mode: false });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.errors?.join?.(', ') || err.message || 'Failed to send newsletter.';
      setSendResult({ success: false, error: msg });
    } finally {
      setSendLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Email', 'Name', 'Status', 'Subscribed At', 'IP Address'];
    const rows = filteredSubscriptions.map((s) => [
      s.email || '',
      s.name || '',
      s.is_active ? 'Active' : 'Inactive',
      s.subscribed_at ? new Date(s.subscribed_at).toLocaleString() : '',
      s.subscribed_ip || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  };

  const filteredSubscriptions = useMemo(
    () =>
      subscriptions.filter((s) => {
        const matchesSearch =
          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && s.is_active) ||
          (statusFilter === 'inactive' && !s.is_active);
        return matchesSearch && matchesStatus;
      }),
    [subscriptions, searchTerm, statusFilter]
  );

  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.is_active).length;
  const inactiveCount = totalCount - activeCount;

  const statusFilters = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'inactive', label: 'Inactive', count: inactiveCount },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Total subscribers',
      value: totalCount,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Active',
      value: activeCount,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Inactive',
      value: inactiveCount,
      tone: 'bg-white border border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    },
    {
      label: 'Showing',
      value: filteredSubscriptions.length,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin Â· Communication"
          title="Newsletter"
          description="Manage email subscribers and send campaigns to your audience."
          primaryAction={
            <div className="flex flex-wrap gap-2">
              <AdminPrimaryBannerButton onClick={handleCreate}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add subscriber
              </AdminPrimaryBannerButton>
              <button
                type="button"
                onClick={handleOpenSend}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm shadow-md hover:bg-amber-600 transition-colors"
              >
                Send newsletter
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Export CSV
              </button>
            </div>
          }
          secondaryAction={
            <AdminRefreshButton onClick={() => fetchSubscriptions(true)} refreshing={refreshing} />
          }
        />

        <AdminStatGrid stats={statCards} />

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-amber-800 text-sm">{error}</p>
          </div>
        )}

        <AdminListSection
          title="All subscribers"
          subtitle="Manage your mailing list"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by email or nameâ€¦"
          filters={statusFilters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showingCount={filteredSubscriptions.length}
          totalCount={totalCount}
          hasActiveFilters={!!searchTerm.trim() || statusFilter !== 'all'}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          onCreate={handleCreate}
          createLabel="New subscriber"
          emptyTitle={error ? 'Unable to load' : 'No subscribers found'}
          emptyDescription={
            error
              ? 'Check your connection and try again.'
              : searchTerm.trim() || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add subscribers or share your signup form.'
          }
          emptyActionLabel={
            !error && (searchTerm.trim() || statusFilter !== 'all')
              ? 'Clear filters'
              : !error
              ? 'Add first subscriber'
              : undefined
          }
          onEmptyAction={
            !error && (searchTerm.trim() || statusFilter !== 'all')
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }
              : !error
              ? handleCreate
              : undefined
          }
        >
          {selectedIds.size > 0 && (
            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-amber-50/80 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">
                {selectedIds.size} selected
              </p>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Delete selected
              </button>
            </div>
          )}
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 sm:px-6 py-3.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={filteredSubscriptions.length > 0 && selectedIds.size === filteredSubscriptions.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-slate-900 focus:ring-slate-900/20 border-slate-300 rounded"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Subscriber</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Joined</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className={`hover:bg-slate-50/80 transition-colors ${selectedIds.has(sub.id) ? 'bg-slate-50' : ''}`}
                  >
                    <td className="px-5 sm:px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sub.id)}
                        onChange={() => toggleSelect(sub.id)}
                        className="h-4 w-4 text-slate-900 focus:ring-slate-900/20 border-slate-300 rounded"
                        aria-label={`Select ${sub.email}`}
                      />
                    </td>
                    <td className="px-5 sm:px-6 py-4">
                      <p className="font-semibold text-slate-900 truncate max-w-xs">{sub.email}</p>
                      {sub.name && <p className="text-xs text-slate-500 truncate">{sub.name}</p>}
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(sub)}
                        disabled={actionLoading === sub.id}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          sub.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } disabled:opacity-50`}
                      >
                        {actionLoading === sub.id ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-sm text-slate-500 hidden md:table-cell whitespace-nowrap">
                      {formatDate(sub.subscribed_at)}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <AdminActionButtons onEdit={() => handleEdit(sub)} onDelete={() => handleDelete(sub)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        </AdminListSection>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4">
            <div className="flex min-h-full sm:min-h-screen items-center justify-center">
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    {editingSubscription ? 'Edit Subscriber' : 'Add Subscriber'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!!editingSubscription}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="subscriber@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (receiving emails)</label>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                      >
                        {editingSubscription ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Newsletter Modal */}
        {showSendModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4">
            <div className="flex min-h-full sm:min-h-screen items-center justify-center">
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowSendModal(false)} />
              <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Send Newsletter</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Emails will go to all {activeCount} active subscribers. Use &quot;Test mode&quot; to send only to yourself first.
                  </p>

                  {sendResult && (
                    <div className={`mb-6 p-4 rounded-xl ${sendResult.success ? 'bg-slate-50 border border-slate-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={sendResult.success ? 'text-slate-800' : 'text-red-700'}>
                        {sendResult.success ? sendResult.data?.detail : sendResult.error}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSendNewsletter} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
          <input
            type="text"
                        required
                        value={sendForm.subject}
                        onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        placeholder="Newsletter subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Plain text body</label>
                      <textarea
                        value={sendForm.body}
                        onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-h-[80px] sm:min-h-[100px]"
                        placeholder="Plain text version (optional if HTML provided)"
          />
        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">HTML body</label>
                      <textarea
                        value={sendForm.html_body}
                        onChange={(e) => setSendForm({ ...sendForm, html_body: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-xs sm:text-sm min-h-[100px] sm:min-h-[120px]"
                        placeholder="<p>Hello {{name}},</p>&#10;<p>Your newsletter content here...</p>"
                      />
                      <p className="mt-1 text-xs text-gray-500">Provide plain text or HTML. HTML takes precedence if both are set.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="test_mode"
                        checked={sendForm.test_mode}
                        onChange={(e) => setSendForm({ ...sendForm, test_mode: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <label htmlFor="test_mode" className="text-sm font-medium text-gray-700 break-words">
                        Test mode â€” send only to my email ({user?.email || 'no email on profile'})
                      </label>
            </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowSendModal(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sendLoading || activeCount === 0}
                        className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sendLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : sendForm.test_mode ? (
                          'Send Test'
                        ) : (
                          `Send to ${activeCount} subscriber${activeCount === 1 ? '' : 's'}`
                        )}
                      </button>
              </div>
                  </form>
            </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deleteSubscription}
          onClose={() => setDeleteSubscription(null)}
          onConfirm={confirmDelete}
          title="Delete Subscriber"
          message={`Remove "${deleteSubscription?.email}" from the newsletter? This cannot be undone.`}
        />

        <ConfirmDialog
          isOpen={bulkDeleteDialog}
          onClose={() => setBulkDeleteDialog(false)}
          onConfirm={confirmBulkDelete}
          title="Delete Selected Subscribers"
          message={`Remove ${selectedIds.size} subscriber${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletter;
