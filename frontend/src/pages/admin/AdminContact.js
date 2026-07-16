import React, { useState, useEffect, useMemo } from 'react';
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
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1423666630070-68aca9381ace?auto=format&fit=crop&w=1920&q=85';

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
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchMessages = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/contact/');
      const data = response.data.results || response.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        !searchTerm ||
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'New' && (!m.status || m.status === 'New')) ||
        m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

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

  const newCount = messages.filter((m) => !m.status || m.status === 'New').length;
  const readCount = messages.filter((m) => m.status === 'Read').length;
  const repliedCount = messages.filter((m) => m.status === 'Replied').length;
  const archivedCount = messages.filter((m) => m.status === 'Archived').length;

  const statusFilters = [
    { id: 'all', label: 'All', count: messages.length },
    { id: 'New', label: 'New', count: newCount },
    { id: 'Read', label: 'Read', count: readCount },
    { id: 'Replied', label: 'Replied', count: repliedCount },
    { id: 'Archived', label: 'Archived', count: archivedCount },
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
      label: 'Total messages',
      value: messages.length,
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'New',
      value: newCount,
      tone: 'bg-white border border-amber-100',
      valueClass: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
    {
      label: 'Replied',
      value: repliedCount,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
    },
    {
      label: 'Showing',
      value: filteredMessages.length,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Communication"
          title="Contact Messages"
          description="View and manage contact form submissions from your website."
          secondaryAction={<AdminRefreshButton onClick={() => fetchMessages(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedMessage ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <AdminListSection
              title="All messages"
              subtitle="Inquiries from your contact form"
              listIcon={listIcon}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by name, email, or subject…"
              filters={statusFilters}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              showingCount={filteredMessages.length}
              totalCount={messages.length}
              hasActiveFilters={!!searchTerm.trim() || statusFilter !== 'all'}
              onClearFilters={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              emptyTitle="No contact messages found"
              emptyDescription={
                searchTerm.trim() || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'New submissions will appear here.'
              }
              emptyActionLabel={searchTerm.trim() || statusFilter !== 'all' ? 'Clear filters' : undefined}
              onEmptyAction={
                searchTerm.trim() || statusFilter !== 'all'
                  ? () => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }
                  : undefined
              }
            >
              <AdminTableWrap>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">From</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Subject</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Status</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Date</th>
                      <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMessages.map((message) => (
                      <tr
                        key={message.id}
                        className={`hover:bg-slate-50/80 transition-colors ${selectedMessage?.id === message.id ? 'bg-slate-50' : ''}`}
                      >
                        <td className="px-5 sm:px-6 py-4">
                          <p className="font-semibold text-slate-900 truncate">{message.name}</p>
                          <p className="text-xs text-slate-500 truncate">{message.email}</p>
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-slate-700 hidden md:table-cell max-w-xs truncate">
                          {message.subject}
                        </td>
                        <td className="px-5 sm:px-6 py-4 hidden sm:table-cell">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(message.status)}`}>
                            {message.status || 'New'}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-slate-500 hidden lg:table-cell whitespace-nowrap">
                          {formatDateTime(message.created_at)}
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-right">
                          <AdminActionButtons
                            onEdit={() => handleView(message)}
                            onDelete={() => handleDelete(message)}
                            editLabel="View"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
            </AdminListSection>
          </div>

          {selectedMessage && (
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-24">
                <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-white">Message details</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">From</label>
                    <p className="text-slate-900 font-semibold mt-1">{selectedMessage.name}</p>
                    <a href={`mailto:${selectedMessage.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subject</label>
                    <p className="text-slate-900 mt-1">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Message</label>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                    <select
                      value={selectedMessage.status || 'New'}
                      onChange={(e) => handleStatusUpdate(selectedMessage, e.target.value)}
                      className={ADMIN_INPUT_CLASS}
                    >
                      {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Received</label>
                    <p className="text-slate-600 text-sm mt-1">{formatDateTime(selectedMessage.created_at)}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                      className="block w-full text-center px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      Reply via email
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
