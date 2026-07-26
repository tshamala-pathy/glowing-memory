import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import { formatDate, formatCurrency, getQuoteStatusLabel, getInvoiceStatusLabel } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=85';

const defaultFormData = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  bio: '',
  password: '',
  is_active: true,
  is_staff: false,
  is_superuser: false,
};

const SNAPSHOT_STAT_META = [
  { key: 'total_quotes', label: 'Quotes', card: 'bg-indigo-50 border-indigo-100', labelClass: 'text-indigo-600', valueClass: 'text-indigo-950' },
  { key: 'total_invoices', label: 'Invoices', card: 'bg-emerald-50 border-emerald-100', labelClass: 'text-emerald-600', valueClass: 'text-emerald-950' },
  { key: 'total_projects', label: 'Projects', card: 'bg-violet-50 border-violet-100', labelClass: 'text-violet-600', valueClass: 'text-violet-950' },
  { key: 'total_payments', label: 'Payments', card: 'bg-amber-50 border-amber-100', labelClass: 'text-amber-600', valueClass: 'text-amber-950' },
  { key: 'total_messages', label: 'Messages', card: 'bg-sky-50 border-sky-100', labelClass: 'text-sky-600', valueClass: 'text-sky-950' },
  { key: 'total_threads', label: 'Threads', card: 'bg-fuchsia-50 border-fuchsia-100', labelClass: 'text-fuchsia-600', valueClass: 'text-fuchsia-950' },
];

const SnapshotIcon = ({ path, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const UserSupportSnapshot = ({
  selectedUser,
  user360,
  loading360,
  onClose,
  onEdit,
  getUserDisplayName,
  getInitial,
  getRoleBadges,
  formatDate,
  formatCurrency,
  getQuoteStatusLabel,
  getInvoiceStatusLabel,
}) => {
  const sections = user360
    ? [
        {
          key: 'quotes',
          title: 'Quotes',
          href: '/admin/quotes',
          items: user360.quotes,
          accent: 'from-indigo-500 to-blue-600',
          chip: 'bg-indigo-100 text-indigo-800',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          render: (q) => (
            <Link to="/admin/quotes" className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-indigo-50/80 transition-colors">
              <span className="truncate text-slate-800 group-hover:text-indigo-900 font-medium">
                {q.project_title || `Quote #${q.id}`}
              </span>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${SNAPSHOT_STAT_META[0].chip}`}>
                {getQuoteStatusLabel(q.status)}
              </span>
            </Link>
          ),
        },
        {
          key: 'invoices',
          title: 'Invoices',
          href: '/admin/invoices',
          items: user360.invoices,
          accent: 'from-emerald-500 to-teal-600',
          chip: 'bg-emerald-100 text-emerald-800',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          render: (inv) => (
            <Link to="/admin/invoices" className="group block rounded-lg px-2.5 py-2 hover:bg-emerald-50/80 transition-colors">
              <p className="truncate text-slate-800 group-hover:text-emerald-900 font-medium">
                {inv.invoice_number || `Inv #${inv.id}`}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {getInvoiceStatusLabel(inv.status)} · {formatCurrency(inv.total_amount)}
              </p>
            </Link>
          ),
        },
        {
          key: 'projects',
          title: 'Projects',
          href: '/admin/client-projects',
          items: user360.projects,
          accent: 'from-violet-500 to-purple-600',
          chip: 'bg-violet-100 text-violet-800',
          icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
          render: (p) => (
            <Link to="/admin/client-projects" className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-violet-50/80 transition-colors">
              <span className="truncate text-slate-800 group-hover:text-violet-900 font-medium">{p.name}</span>
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-100 text-violet-800 capitalize">
                {p.status}
              </span>
            </Link>
          ),
        },
        {
          key: 'payments',
          title: 'Payments',
          items: user360.payments || [],
          accent: 'from-amber-500 to-orange-600',
          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          render: (p) => (
            <div className="rounded-lg px-2.5 py-2 bg-amber-50/60 border border-amber-100/80">
              <p className="truncate text-slate-800 font-medium text-xs">{p.quote_title || `Quote #${p.quote_id}`}</p>
              <p className="text-[11px] text-amber-800 mt-0.5 capitalize">
                {p.payment_status} · {p.amount} {p.currency}
              </p>
            </div>
          ),
        },
        {
          key: 'messages',
          title: 'Contact messages',
          href: '/admin/contact',
          items: user360.messages,
          accent: 'from-sky-500 to-cyan-600',
          icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
          render: (m) => (
            <div className="rounded-lg px-2.5 py-2 hover:bg-sky-50/80 transition-colors">
              <p className="truncate text-slate-800 font-medium text-xs">{m.subject || 'Message'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                {m.status || 'new'} · {formatDate(m.created_at)}
              </p>
            </div>
          ),
        },
        {
          key: 'threads',
          title: 'Message threads',
          href: '/admin/messaging',
          items: user360.threads || [],
          accent: 'from-fuchsia-500 to-pink-600',
          icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
          render: (t) => (
            <Link to="/admin/messaging" className="block rounded-lg px-2.5 py-2 hover:bg-fuchsia-50/80 transition-colors truncate text-slate-800 font-medium text-xs">
              {t.project_name || t.project?.name || `Thread #${t.id}`}
            </Link>
          ),
        },
        {
          key: 'testimonials',
          title: 'Testimonials',
          href: '/admin/testimonials',
          items: user360.testimonials,
          accent: 'from-rose-500 to-red-600',
          icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
          render: (t) => (
            <Link to="/admin/testimonials" className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50/80 transition-colors">
              <span className="text-slate-800 font-medium text-xs">{t.is_approved ? 'Approved' : 'Pending review'}</span>
              <span className="text-amber-500 text-xs font-bold">{t.rating}★</span>
            </Link>
          ),
        },
        {
          key: 'activity',
          title: 'Recent activity',
          items: user360.activity || [],
          accent: 'from-slate-600 to-slate-800',
          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          render: (a) => (
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-slate-800 font-medium text-xs capitalize">{a.action?.replace(/_/g, ' ')}</p>
                <p className="text-[11px] text-slate-500">{formatDate(a.timestamp)}</p>
              </div>
            </div>
          ),
        },
      ]
    : [];

  return (
    <div className="xl:col-span-2">
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-indigo-100/40 sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.35),_transparent_55%)]" />
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-900/40 ring-2 ring-white/20">
                    {getInitial(selectedUser)}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-indigo-950 ${
                      selectedUser.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/90">Support snapshot</p>
                  <h3 className="text-lg font-bold text-white truncate mt-0.5">{getUserDisplayName(selectedUser)}</h3>
                  <p className="text-sm text-indigo-100/90 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close support snapshot"
              >
                <SnapshotIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {getRoleBadges(selectedUser).map((b) => (
                <span
                  key={b.label}
                  className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/15 text-white border border-white/20"
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
          {loading360 ? (
            <div className="px-5 py-14 flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Gathering linked records…</p>
            </div>
          ) : user360 ? (
            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {SNAPSHOT_STAT_META.map((meta) => (
                  <div
                    key={meta.key}
                    className={`rounded-2xl border px-3 py-2.5 shadow-sm ${meta.card}`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.labelClass}`}>{meta.label}</p>
                    <p className={`text-xl font-bold tabular-nums ${meta.valueClass}`}>
                      {user360.stats?.[meta.key] ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(selectedUser)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 transition-all"
                >
                  <SnapshotIcon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  Edit user
                </button>
                {user360.client?.id && (
                  <Link
                    to="/admin/clients"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                  >
                    Open clients
                  </Link>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
                    <SnapshotIcon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Client profile</h4>
                </div>
                {user360.client ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">{user360.client.name}</p>
                    <p className="text-sm text-slate-600">{user360.client.industry || 'No industry set'}</p>
                    {user360.client.internal_notes && (
                      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Internal notes</p>
                        <p className="text-xs text-amber-950 leading-relaxed">{user360.client.internal_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 leading-relaxed">
                    No client profile linked yet. Legacy records may still match this user&apos;s email.
                  </p>
                )}
              </div>

              {sections.map((section) => (
                <div key={section.key} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${section.accent} flex items-center justify-center text-white shadow-sm shrink-0`}>
                        <SnapshotIcon path={section.icon} className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{section.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {section.items?.length || 0}
                      </span>
                      {section.href && (
                        <Link to={section.href} className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 hover:text-indigo-800">
                          Open
                        </Link>
                      )}
                    </div>
                  </div>
                  <ul className="p-2 space-y-0.5 max-h-32 overflow-y-auto">
                    {!section.items?.length ? (
                      <li className="px-2.5 py-3 text-xs text-slate-400 text-center">Nothing here yet</li>
                    ) : (
                      section.items.map((item) => (
                        <li key={`${section.key}-${item.id}`}>{section.render(item)}</li>
                      ))
                    )}
                  </ul>
                </div>
              ))}

              <p className="text-[11px] text-slate-400 text-center pb-2">
                Joined {formatDate(selectedUser.date_joined)}
                {selectedUser.last_login ? ` · Last active ${formatDate(selectedUser.last_login)}` : ''}
              </p>
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <SnapshotIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </div>
              <p className="text-sm font-medium text-slate-600">Could not load user records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [user360, setUser360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await api.get('/users/admin/');
      setUsers(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
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
    fetchUsers();
  }, [isAuthenticated, user, navigate, fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'active' && u.is_active) ||
        (roleFilter === 'inactive' && !u.is_active) ||
        (roleFilter === 'staff' && u.is_staff) ||
        (roleFilter === 'superuser' && u.is_superuser);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEdit = (userItem) => {
    setSelectedUser(null);
    setUser360(null);
    setEditingUser(userItem);
    setFormData({
      username: userItem.username || '',
      email: userItem.email || '',
      first_name: userItem.first_name || '',
      last_name: userItem.last_name || '',
      bio: userItem.bio || '',
      password: '',
      is_active: userItem.is_active !== undefined ? userItem.is_active : true,
      is_staff: userItem.is_staff || false,
      is_superuser: userItem.is_superuser || false,
    });
    setShowForm(true);
  };

  const handleDelete = (userItem) => {
    setDeleteDialog({ open: true, user: userItem });
  };

  const handleView = async (userItem) => {
    setSelectedUser(userItem);
    setUser360(null);
    setLoading360(true);
    try {
      const response = await api.get(`/users/admin/${userItem.id}/360/`);
      setUser360(response.data);
    } catch {
      setUser360(null);
      alert('Failed to load user records');
    } finally {
      setLoading360(false);
    }
  };

  const toggleSelect = (id) => {
    if (id === user?.id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const deletableIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);
    if (selectedIds.size === deletableIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableIds));
    }
  };

  const handleBulkDelete = () => setBulkDeleteDialog(true);

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await api.delete(`/users/admin/${id}/`);
      }
      setSelectedIds(new Set());
      setBulkDeleteDialog(false);
      fetchUsers();
    } catch {
      alert('Failed to delete some users. Please try again.');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/admin/${deleteDialog.user.id}/`);
      fetchUsers();
      setDeleteDialog({ open: false, user: null });
    } catch {
      alert('Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (editingUser && !submitData.password) delete submitData.password;
    if (submitData.password === '') delete submitData.password;

    if (!editingUser && !submitData.password) {
      alert('Password is required when creating a new user');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await api.put(`/users/admin/${editingUser.id}/`, submitData);
      } else {
        await api.post('/users/admin/', submitData);
      }
      fetchUsers();
      setShowForm(false);
      setEditingUser(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Failed to save user';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const deletableIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);

  const statCards = [
    {
      label: 'Total',
      value: users.length,
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      label: 'Superusers',
      value: users.filter((u) => u.is_superuser).length,
      tone: 'bg-white border border-purple-100',
      valueClass: 'text-purple-600',
      iconBg: 'bg-purple-100 text-purple-600',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      label: 'Staff',
      value: users.filter((u) => u.is_staff).length,
      tone: 'bg-white border border-slate-100',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    {
      label: 'Active',
      value: users.filter((u) => u.is_active).length,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const roleFilters = [
    { id: 'all', label: 'All', count: users.length },
    { id: 'active', label: 'Active', count: users.filter((u) => u.is_active).length },
    { id: 'inactive', label: 'Inactive', count: users.filter((u) => !u.is_active).length },
    { id: 'staff', label: 'Staff', count: users.filter((u) => u.is_staff).length },
    { id: 'superuser', label: 'Superuser', count: users.filter((u) => u.is_superuser).length },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const getRoleBadges = (userItem) => {
    const badges = [];
    if (userItem.is_superuser) badges.push({ label: 'Superuser', cls: 'bg-purple-100 text-purple-800' });
    if (userItem.is_staff) badges.push({ label: 'Staff', cls: 'bg-slate-100 text-slate-800' });
    if (!badges.length) badges.push({ label: 'User', cls: 'bg-gray-100 text-gray-800' });
    return badges;
  };

  const getUserDisplayName = (u) => {
    if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
    return u.username || u.email || 'Unknown';
  };

  const getInitial = (u) =>
    u.first_name?.charAt(0) || u.email?.charAt(0) || u.username?.charAt(0) || 'U';

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
          eyebrow="Admin · Clients & Users"
          title="Users"
          description="Manage accounts and open a support snapshot to see all linked client records before assisting."
          primaryAction={
            <div className="flex flex-wrap gap-2">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-md hover:bg-red-600 transition-colors"
                >
                  Delete ({selectedIds.size})
                </button>
              )}
              <AdminPrimaryBannerButton onClick={handleCreate}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add user
              </AdminPrimaryBannerButton>
            </div>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchUsers(true)} refreshing={refreshing} />}
        />

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <AdminStatGrid stats={statCards} />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className={selectedUser ? 'xl:col-span-3' : 'xl:col-span-5'}>
        <AdminListSection
          title="All users"
          subtitle="Search, filter, and open a user support snapshot"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name, email, username…"
          filters={roleFilters}
          activeFilter={roleFilter}
          onFilterChange={setRoleFilter}
          showingCount={filteredUsers.length}
          totalCount={users.length}
          hasActiveFilters={!!searchTerm.trim() || roleFilter !== 'all'}
          onClearFilters={() => {
            setSearchTerm('');
            setRoleFilter('all');
          }}
          onCreate={handleCreate}
          createLabel="Add user"
          emptyTitle="No users found"
          emptyDescription={
            searchTerm.trim() || roleFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first user to get started.'
          }
          emptyActionLabel={searchTerm.trim() || roleFilter !== 'all' ? 'Clear filters' : 'Add user'}
          onEmptyAction={
            searchTerm.trim() || roleFilter !== 'all'
              ? () => {
                  setSearchTerm('');
                  setRoleFilter('all');
                }
              : handleCreate
          }
        >
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-4 py-3.5 text-left w-10">
                    {deletableIds.length > 0 && (
                      <input
                        type="checkbox"
                        checked={deletableIds.length > 0 && deletableIds.every((id) => selectedIds.has(id))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                      />
                    )}
                  </th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Email</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Role</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden xl:table-cell">Joined</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedIds.has(userItem.id) ? 'bg-slate-50' : ''
                    } ${selectedUser?.id === userItem.id ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200/60' : ''}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      {userItem.id !== user?.id ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(userItem.id)}
                          onChange={() => toggleSelect(userItem.id)}
                          className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {getInitial(userItem)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{getUserDisplayName(userItem)}</div>
                          {userItem.username && (
                            <div className="text-xs text-slate-500 truncate">@{userItem.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                      {userItem.email || '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {getRoleBadges(userItem).map((b) => (
                          <span key={b.label} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${b.cls}`}>
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden xl:table-cell">
                      {formatDate(userItem.date_joined)}
                    </td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-right">
                      <AdminActionButtons
                        onEdit={() => handleEdit(userItem)}
                        onDelete={userItem.id !== user?.id ? () => handleDelete(userItem) : undefined}
                        extra={
                          <button
                            type="button"
                            onClick={() => handleView(userItem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 transition-all"
                          >
                            Support
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        </AdminListSection>
          </div>

          {selectedUser && (
            <UserSupportSnapshot
              selectedUser={selectedUser}
              user360={user360}
              loading360={loading360}
              onClose={() => {
                setSelectedUser(null);
                setUser360(null);
              }}
              onEdit={handleEdit}
              getUserDisplayName={getUserDisplayName}
              getInitial={getInitial}
              getRoleBadges={getRoleBadges}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              getQuoteStatusLabel={getQuoteStatusLabel}
              getInvoiceStatusLabel={getInvoiceStatusLabel}
            />
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-900/50 transition-opacity"
                onClick={() => !saving && setShowForm(false)}
              />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-gradient-to-r from-slate-600 to-slate-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    {editingUser ? 'Edit User' : 'Create User'}
                  </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_staff}
                        onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Staff</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_superuser}
                        onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Superuser</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => !saving && setShowForm(false)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700 font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : editingUser ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, user: null })}
          onConfirm={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete "${deleteDialog.user?.username || deleteDialog.user?.email}"? This cannot be undone.`}
        />

        <ConfirmDialog
          isOpen={bulkDeleteDialog}
          onClose={() => setBulkDeleteDialog(false)}
          onConfirm={confirmBulkDelete}
          title="Delete Selected Users"
          message={`Delete ${selectedIds.size} user${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
