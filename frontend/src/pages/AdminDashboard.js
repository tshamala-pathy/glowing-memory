import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/admin/AdminLayout';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/formatters';

const IMAGES = {
  welcome: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1920&q=80',
  projects: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  blog: '/blog/hero-writing-desk.jpg',
  services: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  newsletter: '/newsletter/hero-newsletter.jpg',
  testimonials: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  testimonialsBanner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
  threads: 'https://images.unsplash.com/photo-1573497019148-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  contact: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
  fallback: '/blog/hero-reading-learning.jpg',
};

const CardImage = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (imgSrc !== IMAGES.fallback) {
          setImgSrc(IMAGES.fallback);
        }
      }}
    />
  );
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    blogPosts: 0,
    services: 0,
    contacts: 0,
    testimonials: 0,
    newsletter: 0,
    messageThreads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [recentTestimonials, setRecentTestimonials] = useState([]);
  const {
    items: notifications,
    unread: unreadNotifications,
    loading: notificationsLoading,
    load: reloadNotifications,
    markRead,
    markAllRead,
    removeNotification,
    removeNotifications,
    removeAllNotifications,
  } = useNotifications({ pollMs: 30000, limit: 100 });
  const [selectedAlertIds, setSelectedAlertIds] = useState(() => new Set());
  const [deletingAlerts, setDeletingAlerts] = useState(false);

  const allAlertsSelected =
    notifications.length > 0 && notifications.every((n) => selectedAlertIds.has(n.id));
  const someAlertsSelected = selectedAlertIds.size > 0;

  const toggleSelectAlert = (id) => {
    setSelectedAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllAlerts = () => {
    if (allAlertsSelected) {
      setSelectedAlertIds(new Set());
      return;
    }
    setSelectedAlertIds(new Set(notifications.map((n) => n.id)));
  };

  const handleDismissAlert = async (id) => {
    const result = await removeNotification(id);
    if (result?.ok) {
      setSelectedAlertIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else if (result?.error) {
      alert(result.error);
    }
  };

  const handleDeleteSelectedAlerts = async () => {
    if (!someAlertsSelected) return;
    if (!window.confirm(`Delete ${selectedAlertIds.size} selected alert(s)?`)) return;
    setDeletingAlerts(true);
    const result = await removeNotifications([...selectedAlertIds]);
    setDeletingAlerts(false);
    if (result?.ok) {
      setSelectedAlertIds(new Set());
    } else if (result?.error) {
      alert(result.error);
    }
  };

  const handleDeleteAllAlerts = async () => {
    if (!notifications.length) return;
    if (!window.confirm('Delete all admin alerts? This cannot be undone.')) return;
    setDeletingAlerts(true);
    const result = await removeAllNotifications();
    setDeletingAlerts(false);
    if (result?.ok) {
      setSelectedAlertIds(new Set());
    } else if (result?.error) {
      alert(result.error);
    }
  };

  useEffect(() => {
    setSelectedAlertIds((prev) => {
      const visible = new Set(notifications.map((n) => n.id));
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [notifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/profile');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const [projectsRes, blogRes, servicesRes, contactsRes, testimonialsRes, newsletterRes, threadsRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/blog/'),
        api.get('/services/'),
        api.get('/contact/'),
        api.get('/testimonials/'),
        api.get('/newsletter/subscriptions/').catch(() => ({ data: [] })),
        api.get('/messaging/threads/').catch(() => ({ data: [] })),
      ]);

      const getCount = (res) => {
        const d = res?.data;
        if (typeof d?.count === 'number') return d.count;
        if (Array.isArray(d)) return d.length;
        if (Array.isArray(d?.results)) return d.results.length;
        return 0;
      };

      setStats({
        projects: getCount(projectsRes),
        blogPosts: getCount(blogRes),
        services: getCount(servicesRes),
        contacts: getCount(contactsRes),
        testimonials: getCount(testimonialsRes),
        newsletter: getCount(newsletterRes),
        messageThreads: getCount(threadsRes),
      });

      const contacts = contactsRes.data?.results ?? contactsRes.data ?? [];
      const testimonials = testimonialsRes.data?.results ?? testimonialsRes.data ?? [];
      setRecentContacts(Array.isArray(contacts) ? contacts.slice(0, 5) : []);
      setRecentTestimonials(Array.isArray(testimonials) ? testimonials.slice(0, 5) : []);
      reloadNotifications();
    } catch {
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
              <div className="absolute inset-0 w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-2xl animate-spin" />
            </div>
            <p className="text-slate-600 font-medium tracking-wide">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (user && user.is_superuser !== true) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600 mb-6 text-sm">
              Only superusers can access the admin dashboard.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalItems = Object.values(stats).reduce((sum, value) => sum + value, 0);
  const displayName = user?.first_name || user?.username || 'Admin';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const statCards = [
    {
      title: 'Projects',
      value: stats.projects,
      path: '/admin/projects',
      description: 'Portfolio & deliverables',
      image: IMAGES.projects,
    },
    {
      title: 'Blog Posts',
      value: stats.blogPosts,
      path: '/admin/blog',
      description: 'Articles & insights',
      image: IMAGES.blog,
    },
    {
      title: 'Services',
      value: stats.services,
      path: '/admin/services',
      description: 'Offerings & packages',
      image: IMAGES.services,
    },
    {
      title: 'Contact Messages',
      value: stats.contacts,
      path: '/admin/contact',
      description: 'Inbound enquiries',
      image: IMAGES.contact,
    },
    {
      title: 'Testimonials',
      value: stats.testimonials,
      path: '/admin/testimonials',
      description: 'Client reviews',
      image: IMAGES.testimonials,
    },
    {
      title: 'Newsletter',
      value: stats.newsletter,
      path: '/admin/newsletter',
      description: 'Email subscribers',
      image: IMAGES.newsletter,
    },
    {
      title: 'Message Threads',
      value: stats.messageThreads,
      path: '/admin/messaging-threads',
      description: 'Client conversations',
      image: IMAGES.threads,
    },
  ];

  const quickLinks = [
    { label: 'Financial Dashboard', path: '/admin/financial', desc: 'Revenue & invoices', gradient: 'from-emerald-600 to-teal-700' },
    { label: 'Manage Clients', path: '/admin/clients', desc: 'Client accounts', gradient: 'from-indigo-600 to-blue-700' },
    { label: 'Tasks', path: '/admin/tasks', desc: 'Track deliverables', gradient: 'from-violet-600 to-purple-700' },
    { label: 'Quotes', path: '/admin/quotes', desc: 'Review requests', gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 min-h-[300px] sm:min-h-[340px]">
          <img
            src={IMAGES.welcome}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-900/55 to-slate-800/25" />
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 left-1/4 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

          <div className="relative h-full p-6 sm:p-8 lg:p-10 flex items-center">
            <div className="w-full max-w-3xl rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Admin Control Center
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {today}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-black">
                <span className="font-semibold">Welcome back,</span>
                <span className="block mt-1 sm:inline sm:mt-0 sm:ml-2">{displayName}</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-xl text-black/80">
                Your command center for content, clients, and conversations — everything in one place.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-black text-xs font-medium">
                    <span className="font-bold text-sm">{totalItems}</span> total items
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-black text-xs font-medium">
                    <span className="font-bold text-sm">{stats.projects}</span> projects
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-black text-xs font-medium">
                    <span className="font-bold text-sm">{stats.messageThreads}</span> threads
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black text-white font-semibold text-sm shadow-lg hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 min-w-[132px]"
                >
                  {refreshing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-xl shadow-indigo-200/50">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Total Items</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold">{totalItems}</p>
            <p className="mt-1 text-indigo-200/80 text-xs">Across all sections</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-lg shadow-slate-100/80">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Live Projects</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{stats.projects}</p>
            <Link to="/admin/projects" className="mt-2 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              View projects →
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-lg shadow-slate-100/80">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Messages</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{stats.contacts + stats.messageThreads}</p>
            <p className="mt-1 text-emerald-600 text-xs font-medium">{stats.messageThreads} active threads</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-lg shadow-slate-100/80">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Subscribers</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{stats.newsletter}</p>
            <Link to="/admin/newsletter" className="mt-2 inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors">
              Manage list →
            </Link>
          </div>
        </div>

        {/* Admin alerts feed */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Admin alerts</h2>
                <p className="text-xs text-slate-500">Quotes, messages, payments, and client activity</p>
              </div>
              {unreadNotifications > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {unreadNotifications} unread
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allAlertsSelected}
                      onChange={toggleSelectAllAlerts}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Select all
                  </label>
                  {someAlertsSelected && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedAlerts}
                      disabled={deletingAlerts}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Delete selected ({selectedAlertIds.size})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteAllAlerts}
                    disabled={deletingAlerts}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Delete all
                  </button>
                </>
              )}
              {unreadNotifications > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {notificationsLoading && notifications.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">Loading alerts…</p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">
                No alerts yet. New quotes, client messages, payments, and uploads will appear here.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${n.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedAlertIds.has(n.id)}
                      onChange={() => toggleSelectAlert(n.id)}
                      aria-label={`Select alert: ${n.title}`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:pl-0 pl-7">
                    {n.link && (
                      <Link
                        to={n.link}
                        state={{ notificationId: n.id }}
                        onClick={() => { if (!n.is_read) markRead(n.id); }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                      >
                        Open
                      </Link>
                    )}
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismissAlert(n.id)}
                      disabled={deletingAlerts}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Dismiss this alert"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <span className="text-xs text-slate-400 font-medium">Jump to key admin tools</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${link.gradient} p-5 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <p className="relative font-semibold text-sm">{link.label}</p>
                <p className="relative text-white/80 text-xs mt-1">{link.desc}</p>
                <svg className="relative w-5 h-5 mt-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Content Overview</h2>
              <p className="text-sm text-slate-500 mt-0.5">Click any card to manage that section</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {statCards.map((stat, i) => (
              <Link
                key={i}
                to={stat.path}
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative h-36 overflow-hidden bg-slate-100">
                  <CardImage
                    src={stat.image}
                    alt={stat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-slate-500">{stat.description}</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 group-hover:text-slate-900 group-hover:gap-2 transition-all">
                    Manage
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contact Messages */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/80 overflow-hidden">
            <div className="relative px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200/50">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Recent Contact Messages</h3>
                  <p className="text-xs text-slate-400">{stats.contacts} total messages</p>
                </div>
              </div>
              <Link
                to="/admin/contact"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="p-5">
              {recentContacts.length > 0 ? (
                <div className="space-y-3">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all duration-200"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <p className="font-semibold text-slate-900 truncate text-sm">{contact.name}</p>
                          <span className="flex-shrink-0 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {new Date(contact.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600 truncate">{contact.email}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{contact.subject || contact.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">No recent messages</p>
                  <p className="text-slate-400 text-xs mt-1">New contact form submissions will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Testimonials */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative h-24 overflow-hidden">
              <img
                src={IMAGES.testimonialsBanner}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative h-full px-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg">Recent Testimonials</h3>
                  <p className="text-white/80 text-xs">{stats.testimonials} total reviews</p>
                </div>
                <Link
                  to="/admin/testimonials"
                  className="text-sm font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-5">
              {recentTestimonials.length > 0 ? (
                <div className="space-y-3">
                  {recentTestimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold">
                              {getInitials(testimonial.name)}
                            </div>
                            <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < (testimonial.rating ?? 0) ? 'text-slate-700' : 'text-slate-200'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed italic border-l-2 border-slate-300 pl-3">
                            &ldquo;{testimonial.testimonial || testimonial.content}&rdquo;
                          </p>
                          {!testimonial.is_approved && (
                            <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded-full">
                              Pending approval
                            </span>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {new Date(testimonial.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">No recent testimonials</p>
                  <p className="text-slate-400 text-xs mt-1">Client reviews will appear here once submitted</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
