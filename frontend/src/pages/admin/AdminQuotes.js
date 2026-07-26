import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
import { getQuoteStatusClass, getQuoteStatusLabel, formatDate, formatCurrency, formatApiError } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1554224225-6726b3ff858f?auto=format&fit=crop&w=1920&q=85';

const QUOTE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'replied', label: 'Replied' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
];

const defaultFormData = {
  client_name: '',
  client_email: '',
  client_phone: '',
  company_name: '',
  project_title: '',
  project_description: '',
  project_type: '',
  service_type: '',
  budget_range: '',
  deadline: '',
  timeline: '',
  estimated_amount: '',
  status: 'pending',
  notes: '',
  admin_response: '',
  assigned_to: '',
  scope: '',
  deliverables: '',
  proposal_timeline: '',
  terms: '',
};

const prepareQuoteSubmitData = (formData) => {
  const submitData = { ...formData };
  if (submitData.assigned_to === '') submitData.assigned_to = null;
  if (submitData.estimated_amount === '') submitData.estimated_amount = null;
  if (submitData.deadline === '') submitData.deadline = null;
  return submitData;
};

const AdminQuotes = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quotes, setQuotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, quote: null });
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchQuotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/quotes/');
      const data = response.data.results || response.data;
      setQuotes(Array.isArray(data) ? data : []);
    } catch {
      setQuotes([]);
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
    setLoading(true);
    fetchQuotes();
    const loadUsers = async () => {
      try {
        const res = await api.get('/users/list/');
        const data = res.data.results || res.data;
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      }
    };
    const loadClients = async () => {
      try {
        const res = await api.get('/clients/clients/');
        const data = res.data.results || res.data;
        setClients(Array.isArray(data) ? data : []);
      } catch {
        setClients([]);
      }
    };
    loadUsers();
    loadClients();
  }, [isAuthenticated, user, navigate, fetchQuotes]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    const quoteId = searchParams.get('quote');
    if (!quoteId || !quotes.length) return;
    const match = quotes.find((q) => String(q.id) === String(quoteId));
    if (match) setSelectedQuote(match);
  }, [searchParams, quotes]);

  const handleCreate = () => {
    setEditingQuote(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEdit = (quote) => {
    setEditingQuote(quote);
    setFormData({
      client_name: quote.client_name || '',
      client_email: quote.client_email || '',
      client_phone: quote.client_phone || '',
      company_name: quote.company_name || '',
      project_title: quote.project_title || '',
      project_description: quote.project_description || '',
      project_type: quote.project_type || '',
      service_type: quote.service_type || '',
      budget_range: quote.budget_range || '',
      deadline: quote.deadline || '',
      timeline: quote.timeline || '',
      estimated_amount: quote.estimated_amount || '',
      status: quote.status || 'pending',
      notes: quote.notes || '',
      admin_response: quote.admin_response || '',
      assigned_to: quote.assigned_to || '',
      scope: quote.scope || '',
      deliverables: quote.deliverables || '',
      proposal_timeline: quote.proposal_timeline || '',
      terms: quote.terms || '',
    });
    setShowForm(true);
  };

  const handleView = (quote) => setSelectedQuote(quote);
  const handleDelete = (quote) => setDeleteDialog({ open: true, quote });

  const confirmDelete = async () => {
    try {
      await api.delete(`/quotes/${deleteDialog.quote.id}/`);
      fetchQuotes();
      setDeleteDialog({ open: false, quote: null });
      if (selectedQuote?.id === deleteDialog.quote?.id) setSelectedQuote(null);
    } catch {
      alert('Failed to delete quote');
    }
  };

  const handleApprove = async (quote) => {
    try {
      const res = await api.post(`/quotes/${quote.id}/approve/`);
      fetchQuotes();
      if (selectedQuote?.id === quote.id && res?.data) setSelectedQuote(res.data);
    } catch (err) {
      const msg = err.response?.data?.status?.[0] || err.response?.data?.detail || 'Failed to approve quote';
      alert(msg);
    }
  };

  const handleReject = async (quote) => {
    try {
      const res = await api.post(`/quotes/${quote.id}/reject/`);
      fetchQuotes();
      if (selectedQuote?.id === quote.id && res?.data) setSelectedQuote(res.data);
    } catch (err) {
      const msg = err.response?.data?.status?.[0] || err.response?.data?.detail || 'Failed to reject quote';
      alert(msg);
    }
  };

  const handleSendResponse = async (quote) => {
    if (!quote.admin_response?.trim()) {
      alert('Please add an admin response before sending the email.');
      return;
    }
    if (!window.confirm(`Send response email to ${quote.client_email}?`)) return;
    try {
      const res = await api.post(`/quotes/${quote.id}/send_response/`);
      alert('Response email sent successfully!');
      fetchQuotes();
      if (selectedQuote?.id === quote.id && res?.data?.quote) setSelectedQuote(res.data.quote);
    } catch (err) {
      alert(formatApiError(err, 'Failed to send response email'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = prepareQuoteSubmitData(formData);
      if (editingQuote) {
        const { data } = await api.put(`/quotes/${editingQuote.id}/`, submitData);
        if (selectedQuote?.id === editingQuote.id) setSelectedQuote(data);
      } else {
        await api.post('/quotes/', { ...submitData, requirements_accepted: true });
      }
      fetchQuotes();
      setShowForm(false);
      setEditingQuote(null);
    } catch (err) {
      alert(formatApiError(err, 'Failed to save quote'));
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/quotes/export_csv/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotes-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    }
  };

  const handleDownloadPdf = async (quote) => {
    try {
      const response = await api.get(`/quotes/${quote.id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quote_${quote.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF');
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesClient = !clientFilter || String(quote.client) === String(clientFilter);
    return matchesSearch && matchesStatus && matchesClient;
  });

  const filteredIds = filteredQuotes.map((q) => q.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkMarkReviewed = async () => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      const { data } = await api.post('/quotes/bulk-mark-reviewed/', { ids: selectedIds });
      alert(`Marked reviewed: ${data.updated}. Skipped: ${data.skipped}.`);
      setSelectedIds([]);
      fetchQuotes(true);
    } catch (err) {
      alert(formatApiError(err, 'Bulk mark reviewed failed'));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkGenerateInvoices = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Generate invoices for ${selectedIds.length} selected quote(s)?`)) return;
    setBulkLoading(true);
    try {
      const { data } = await api.post('/quotes/bulk-generate-invoices/', { ids: selectedIds });
      const errorNote = data.errors?.length ? `\n\nNotes:\n${data.errors.slice(0, 5).join('\n')}` : '';
      alert(`Created: ${data.created}. Skipped: ${data.skipped}.${errorNote}`);
      setSelectedIds([]);
      fetchQuotes(true);
    } catch (err) {
      alert(formatApiError(err, 'Bulk invoice generation failed'));
    } finally {
      setBulkLoading(false);
    }
  };

  const canApproveOrReject = (status) => status === 'reviewed' || status === 'replied';

  const pendingCount = quotes.filter((q) => q.status === 'pending').length;
  const reviewedCount = quotes.filter((q) => q.status === 'reviewed' || q.status === 'replied').length;
  const approvedCount = quotes.filter((q) => q.status === 'approved').length;
  const declinedCount = quotes.filter((q) => q.status === 'declined').length;

  const statCards = [
    {
      label: 'Total',
      value: quotes.length,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Pending',
      value: pendingCount,
      tone: 'bg-white border border-orange-100',
      valueClass: 'text-orange-600',
      iconBg: 'bg-orange-100 text-orange-600',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Reviewed',
      value: reviewedCount,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7C7.523 19 3.732 16.057 2.458 12z',
    },
    {
      label: 'Approved',
      value: approvedCount,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Declined',
      value: declinedCount,
      tone: 'bg-white border border-red-100',
      valueClass: 'text-red-600',
      iconBg: 'bg-red-100 text-red-600',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const statusFilters = [
    { id: 'all', label: 'All', count: quotes.length },
    ...QUOTE_STATUS_OPTIONS.map(({ value, label }) => ({
      id: value,
      label,
      count: quotes.filter((q) => q.status === value).length,
    })),
  ];

  const hasActiveFilters = !!searchTerm.trim() || statusFilter !== 'all' || !!clientFilter;

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Business"
          title="Quotes & Estimates"
          description="Manage client quote requests and estimates."
          primaryAction={
            <div className="flex flex-wrap gap-2">
              <AdminPrimaryBannerButton onClick={handleCreate}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Quote
              </AdminPrimaryBannerButton>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <Link
                to="/admin/invoices"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Invoices
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchQuotes(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 sm:px-6 py-4">
          <label htmlFor="quote-client-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Filter by client
          </label>
          <select
            id="quote-client-filter"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className={ADMIN_INPUT_CLASS}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedQuote ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <AdminListSection
              title="All quotes"
              subtitle="Review, approve, and manage client quote requests"
              listIcon={listIcon}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by project, client, or email…"
              filters={statusFilters}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              showingCount={filteredQuotes.length}
              totalCount={quotes.length}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setClientFilter('');
              }}
              onCreate={handleCreate}
              createLabel="New Quote"
              emptyTitle="No quotes found"
              emptyDescription={
                hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first quote to get started.'
              }
              emptyActionLabel={hasActiveFilters ? 'Clear filters' : 'Create first quote'}
              onEmptyAction={
                hasActiveFilters
                  ? () => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setClientFilter('');
                    }
                  : handleCreate
              }
            >
              {selectedIds.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">{selectedIds.length} selected</span>
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={handleBulkMarkReviewed}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={handleBulkGenerateInvoices}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Generate invoices
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Clear
                  </button>
                </div>
              )}
              <AdminTableWrap>
                <table className="min-w-full hidden sm:table">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="px-3 sm:px-4 py-3.5 text-left">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all quotes"
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Project</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Client</th>
                      <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Created</th>
                      <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQuotes.map((q) => (
                      <tr
                        key={q.id}
                        className={`hover:bg-slate-50/80 transition-colors ${selectedQuote?.id === q.id ? 'bg-slate-50' : ''}`}
                      >
                        <td className="px-3 sm:px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(q.id)}
                            onChange={() => toggleSelect(q.id)}
                            aria-label={`Select quote ${q.project_title}`}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm font-semibold text-slate-900">{q.project_title}</td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-slate-600">{q.client_name}</td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-right font-medium text-slate-900">
                          {q.estimated_amount ? formatCurrency(q.estimated_amount) : '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getQuoteStatusClass(q.status)}`}>
                            {getQuoteStatusLabel(q.status)}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-slate-500">{formatDate(q.created_at) || '—'}</td>
                        <td className="px-5 sm:px-6 py-4 text-right">
                          <AdminActionButtons
                            onEdit={() => handleView(q)}
                            onDelete={() => handleDelete(q)}
                            editLabel="View"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
              <div className="sm:hidden divide-y divide-slate-100">
                {filteredQuotes.map((q) => (
                  <div key={q.id} className="p-4 hover:bg-slate-50/50" onClick={() => handleView(q)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">{q.project_title}</p>
                        <p className="text-sm text-slate-600">{q.client_name}</p>
                        <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getQuoteStatusClass(q.status)}`}>
                          {getQuoteStatusLabel(q.status)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">{q.estimated_amount ? formatCurrency(q.estimated_amount) : '—'}</p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(q); }}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AdminListSection>
          </div>

          {selectedQuote && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Quote Details</h3>
                  <button onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</p>
                    <p className="text-gray-900 font-medium">{selectedQuote.client_name}</p>
                    <p className="text-gray-600 text-sm">{selectedQuote.client_email}</p>
                    {selectedQuote.client_phone && <p className="text-gray-600 text-sm">{selectedQuote.client_phone}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Project</p>
                    <p className="text-gray-900 font-medium">{selectedQuote.project_title}</p>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">{selectedQuote.project_description}</p>
                  </div>
                  {selectedQuote.service_type && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</p>
                      <p className="text-gray-900">{selectedQuote.service_type}</p>
                    </div>
                  )}
                  {selectedQuote.timeline && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</p>
                      <p className="text-gray-900">{selectedQuote.timeline}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Amount</p>
                    <p className="text-lg font-bold text-slate-700">
                      {selectedQuote.estimated_amount ? formatCurrency(selectedQuote.estimated_amount) : '—'}
                    </p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getQuoteStatusClass(selectedQuote.status)}`}>
                    {getQuoteStatusLabel(selectedQuote.status)}
                  </span>
                  {selectedQuote.scope && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</p>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedQuote.scope}</p>
                    </div>
                  )}
                  {selectedQuote.deliverables && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deliverables</p>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedQuote.deliverables}</p>
                    </div>
                  )}
                  {selectedQuote.proposal_timeline && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal timeline</p>
                      <p className="text-gray-900 text-sm">{selectedQuote.proposal_timeline}</p>
                    </div>
                  )}
                  {selectedQuote.admin_response && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Response</p>
                      {selectedQuote.responded_at && (
                        <p className="text-xs text-gray-500 mb-1">
                          Replied {formatDate(selectedQuote.responded_at)}
                        </p>
                      )}
                      <p className="text-gray-900 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedQuote.admin_response}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {canApproveOrReject(selectedQuote.status) && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedQuote)}
                          className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedQuote)}
                          className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {selectedQuote.admin_response && selectedQuote.status === 'pending' && (
                      <button
                        onClick={() => handleSendResponse(selectedQuote)}
                        className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                      >
                        Send Response Email
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(selectedQuote)}
                      className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleEdit(selectedQuote)}
                      className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Edit Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)} />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-6 pb-4 sm:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {editingQuote ? 'Edit Quote' : 'New Quote'}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Client name</label>
                        <input
                          type="text"
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Client email</label>
                        <input
                          type="email"
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
                        <input
                          type="text"
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company (optional)</label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Project title</label>
                        <input
                          type="text"
                          value={formData.project_title}
                          onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Project description</label>
                        <textarea
                          rows={4}
                          value={formData.project_description}
                          onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Service type</label>
                          <input
                            type="text"
                            value={formData.service_type}
                            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                            placeholder="e.g. Web Development"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Budget range</label>
                          <input
                            type="text"
                            value={formData.budget_range}
                            onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                            placeholder="e.g. R10k–R20k"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Timeline</label>
                          <input
                            type="text"
                            value={formData.timeline}
                            onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                            placeholder="e.g. 4–6 weeks"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">Proposal details</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Scope</label>
                          <textarea
                            rows={3}
                            value={formData.scope}
                            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                            placeholder="Project scope for the proposal"
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Deliverables</label>
                          <textarea
                            rows={3}
                            value={formData.deliverables}
                            onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                            placeholder="Bullet points or list of deliverables"
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Proposal timeline</label>
                          <input
                            type="text"
                            value={formData.proposal_timeline}
                            onChange={(e) => setFormData({ ...formData, proposal_timeline: e.target.value })}
                            placeholder="e.g. 4–6 weeks, 2 months"
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Terms</label>
                          <textarea
                            rows={3}
                            value={formData.terms}
                            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            placeholder="Terms and conditions for the proposal"
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          >
                            {QUOTE_STATUS_OPTIONS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Estimated amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.estimated_amount}
                            onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned to</label>
                        <select
                          value={formData.assigned_to || ''}
                          onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="">— Unassigned —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.first_name && u.last_name ? `${u.first_name} ${u.last_name} (${u.email})` : u.username || u.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Admin response (sent to client)</label>
                        <textarea
                          rows={6}
                          value={formData.admin_response}
                          onChange={(e) => setFormData({ ...formData, admin_response: e.target.value })}
                          placeholder="Enter your response to the client. Use Send Response Email to email this to the client."
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Internal notes</label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Internal notes (not visible to client)"
                          className="mt-1 block w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700"
                    >
                      {editingQuote ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, quote: null })}
          onConfirm={confirmDelete}
          title="Delete Quote"
          message={`Are you sure you want to delete the quote for "${deleteDialog.quote?.project_title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminQuotes;
