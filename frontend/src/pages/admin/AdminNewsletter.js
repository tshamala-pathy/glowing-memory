import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const AdminNewsletter = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchSubscriptions = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/newsletter/subscriptions/');
      const data = response.data.results ?? response.data;
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Unable to load subscriptions. Please try again.');
      setSubscriptions([]);
    } finally {
      setLoading(false);
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

  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesSearch =
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active) ||
      (statusFilter === 'inactive' && !s.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading subscriptions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Newsletter</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage your email subscribers and grow your audience</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleOpenSend}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-amber-500/90 hover:bg-amber-500 text-white rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                title="Send newsletter to all active subscribers"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden sm:inline">Send Newsletter</span>
                <span className="sm:hidden">Send</span>
              </button>
              <button
                onClick={exportCSV}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={handleCreate}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-amber-800 text-sm">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{totalCount}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Subscribers</p>
              </div>
              <span className="p-2 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-600 mt-0.5 sm:mt-1">{activeCount}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Receiving</p>
              </div>
              <span className="p-2 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Inactive</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-500 mt-0.5 sm:mt-1">{totalCount - activeCount}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Unsubscribed</p>
              </div>
              <span className="p-2 sm:p-4 bg-gray-100 rounded-xl sm:rounded-2xl flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <div className="relative flex-1 min-w-0">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full min-w-0 pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-w-0 sm:min-w-[140px]"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          {filteredSubscriptions.length === 0 ? (
            <div className="py-12 sm:py-20 text-center px-4 sm:px-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {error ? 'Unable to load' : searchTerm || statusFilter !== 'all' ? 'No matches' : 'No subscribers yet'}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                {error
                  ? 'Check your connection and try again.'
                  : searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Share your newsletter signup form to start collecting subscribers.'}
              </p>
              {!error && !searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Add first subscriber
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <input
                  type="checkbox"
                  checked={filteredSubscriptions.length > 0 && selectedIds.size === filteredSubscriptions.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Select all</span>
              </div>
              <div className="md:hidden divide-y divide-gray-100">
                {filteredSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-4 flex flex-col gap-3 ${selectedIds.has(sub.id) ? 'bg-slate-50/50' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{sub.email}</p>
                        {sub.name && <p className="text-sm text-gray-500 truncate">{sub.name}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sub.id)}
                          onChange={() => toggleSelect(sub.id)}
                          className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                        />
                        <button
                          onClick={() => handleEdit(sub)}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(sub)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          aria-label="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(sub)}
                        disabled={actionLoading === sub.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          sub.is_active ? 'bg-slate-100 text-slate-800' : 'bg-gray-100 text-gray-600'
                        } disabled:opacity-50`}
                      >
                        {actionLoading === sub.id ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.is_active ? 'bg-slate-500' : 'bg-gray-400'}`} />
                        )}
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <span className="text-xs text-gray-500">{formatDate(sub.subscribed_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredSubscriptions.length > 0 && selectedIds.size === filteredSubscriptions.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subscriber</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className={`hover:bg-gray-50/80 transition-colors ${selectedIds.has(sub.id) ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sub.id)}
                          onChange={() => toggleSelect(sub.id)}
                          className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px] lg:max-w-none">{sub.email}</p>
                          {sub.name && <p className="text-sm text-gray-500 truncate max-w-[200px] lg:max-w-none">{sub.name}</p>}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <button
                          onClick={() => handleToggleActive(sub)}
                          disabled={actionLoading === sub.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            sub.is_active
                              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === sub.id ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${sub.is_active ? 'bg-slate-500' : 'bg-gray-400'}`} />
                          )}
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(sub.subscribed_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>

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
                        Test mode — send only to my email ({user?.email || 'no email on profile'})
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
