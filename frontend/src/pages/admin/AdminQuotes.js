import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';
import { getQuoteStatusClass, getQuoteStatusLabel, formatDate, formatCurrency } from '../../utils/formatters';

const QUOTE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'replied', label: 'Replied' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
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
};

const AdminQuotes = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, quote: null });
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [formData, setFormData] = useState(defaultFormData);

  const fetchQuotes = useCallback(async () => {
    try {
      const response = await api.get('/quotes/');
      const data = response.data.results || response.data;
      setQuotes(Array.isArray(data) ? data : []);
    } catch {
      setQuotes([]);
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
      alert(err.response?.data?.error || 'Failed to send response email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (submitData.assigned_to === '') submitData.assigned_to = null;
      if (editingQuote) {
        const { data } = await api.put(`/quotes/${editingQuote.id}/`, submitData);
        if (selectedQuote?.id === editingQuote.id) setSelectedQuote(data);
      } else {
        await api.post('/quotes/', { ...submitData, requirements_accepted: true });
      }
      fetchQuotes();
      setShowForm(false);
      setEditingQuote(null);
    } catch {
      alert('Failed to save quote');
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

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesClient = !clientFilter || String(quote.client) === String(clientFilter);
    return matchesSearch && matchesStatus && matchesClient;
  });

  const canApproveOrReject = (status) => status === 'reviewed' || status === 'replied';

  const stats = [
    { label: 'Total', value: filteredQuotes.length },
    { label: 'Pending', value: filteredQuotes.filter((q) => q.status === 'pending').length },
    { label: 'Reviewed', value: filteredQuotes.filter((q) => q.status === 'reviewed' || q.status === 'replied').length },
    { label: 'Approved', value: filteredQuotes.filter((q) => q.status === 'approved').length },
    { label: 'Declined', value: filteredQuotes.filter((q) => q.status === 'declined').length },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading quotes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Quotes &amp; Estimates</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage client quote requests and estimates</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setEditingQuote(null);
                  setFormData(defaultFormData);
                  setShowForm(true);
                }}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Quote
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-lg sm:rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <Link
                to="/admin/invoices"
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                Invoices
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-slate-600">{s.value}</p>
              <p className="text-sm font-medium text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Search by project, client, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="all">All Statuses</option>
              {QUOTE_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedQuote ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {filteredQuotes.length === 0 ? (
                <div className="px-6 py-16 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No quotes found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto hidden sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredQuotes.map((q) => (
                          <tr key={q.id} className="hover:bg-gray-50/80">
                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{q.project_title}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{q.client_name}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-right font-medium">{q.estimated_amount ? formatCurrency(q.estimated_amount) : '—'}</td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getQuoteStatusClass(q.status)}`}>
                                {getQuoteStatusLabel(q.status)}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{formatDate(q.created_at) || '—'}</td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => handleView(q)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg" title="View">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7C7.523 19 3.732 16.057 2.458 12z" />
                                  </svg>
                                </button>
                                <button onClick={() => handleDelete(q)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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
                  <div className="sm:hidden divide-y divide-gray-100">
                    {filteredQuotes.map((q) => (
                      <div key={q.id} className="p-4 hover:bg-gray-50/50" onClick={() => handleView(q)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{q.project_title}</p>
                            <p className="text-sm text-gray-600">{q.client_name}</p>
                            <span className={`inline-flex mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${getQuoteStatusClass(q.status)}`}>
                              {getQuoteStatusLabel(q.status)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-600">{q.estimated_amount ? formatCurrency(q.estimated_amount) : '—'}</p>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(q); }} className="text-sm text-red-600 font-medium">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
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
