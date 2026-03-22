import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'New', label: 'New' },
  { value: 'Read', label: 'Read' },
  { value: 'Replied', label: 'Replied' },
  { value: 'Archived', label: 'Archived' },
];

const getStatusClass = (status) => {
  switch (status) {
    case 'Replied':
      return 'bg-green-100 text-green-800';
    case 'Read':
      return 'bg-blue-100 text-blue-800';
    case 'Archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-amber-100 text-amber-800';
  }
};

const AdminContact = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, message: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchMessages();
  }, [isAuthenticated, user, navigate]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/contact/');
      const data = response.data.results || response.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        !searchTerm ||
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  const stats = useMemo(
    () => [
      { label: 'Total', value: messages.length },
      { label: 'New', value: messages.filter((m) => !m.status || m.status === 'New').length },
      { label: 'Read', value: messages.filter((m) => m.status === 'Read').length },
      { label: 'Replied', value: messages.filter((m) => m.status === 'Replied').length },
      { label: 'Archived', value: messages.filter((m) => m.status === 'Archived').length },
    ],
    [messages]
  );

  const handleView = (message) => setSelectedMessage(message);
  const handleDelete = (message) => setDeleteDialog({ open: true, message });

  const confirmDelete = async () => {
    try {
      await api.delete(`/contact/${deleteDialog.message.id}/`);
      fetchMessages();
      setDeleteDialog({ open: false, message: null });
      if (selectedMessage?.id === deleteDialog.message.id) setSelectedMessage(null);
    } catch {
      alert('Failed to delete message');
    }
  };

  const handleStatusUpdate = async (message, newStatus) => {
    try {
      await api.patch(`/contact/${message.id}/`, { status: newStatus });
      fetchMessages();
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading messages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Contact Messages</h1>
              </div>
              <p className="text-slate-200 text-sm sm:text-base">View and manage contact form submissions.</p>
            </div>
            <button
              onClick={fetchMessages}
              className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{s.label}</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search by name, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className={selectedMessage ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMessages.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          No contact messages found
                        </td>
                      </tr>
                    ) : (
                      filteredMessages.map((message) => (
                        <tr key={message.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {message.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{message.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{message.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(message.status)}`}>
                              {message.status || 'New'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(message.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleView(message)}
                                className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(message)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detail sidebar */}
          {selectedMessage && (
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Message Details</h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">From</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedMessage.name}</p>
                    <a href={`mailto:${selectedMessage.email}`} className="text-slate-700 hover:text-slate-900 text-sm">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</label>
                    <p className="text-gray-900 mt-1">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Message</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                    <select
                      value={selectedMessage.status || 'New'}
                      onChange={(e) => handleStatusUpdate(selectedMessage, e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    >
                      <option value="New">New</option>
                      <option value="Read">Read</option>
                      <option value="Replied">Replied</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received</label>
                    <p className="text-gray-600 text-sm mt-1">{formatDateTime(selectedMessage.created_at)}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                      className="block w-full text-center px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
                    >
                      Reply via Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, message: null })}
          onConfirm={confirmDelete}
          title="Delete Message"
          message={`Are you sure you want to delete the message from "${deleteDialog.message?.name}"?`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminContact;
