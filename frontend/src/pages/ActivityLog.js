import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';

const HISTORY_IMAGE = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80';

const ACTION_CONFIG = {
  login: { icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3h-2a3 3 0 01-3-3V7a3 3 0 013-3h2a3 3 0 013 3v1', label: 'Signed in', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500/15' },
  logout: { icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', label: 'Signed out', bg: 'bg-slate-100', text: 'text-slate-700', iconBg: 'bg-slate-500/15' },
  register: { icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', label: 'Account created', bg: 'bg-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-500/15' },
  profile_update: { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile updated', bg: 'bg-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-500/15' },
  password_change: { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Password changed', bg: 'bg-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-500/15' },
  email_change: { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email updated', bg: 'bg-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-500/15' },
  password_reset_requested: { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', label: 'Password reset requested', bg: 'bg-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-500/15' },
  password_reset_completed: { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Password reset completed', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500/15' },
  quote_submitted: { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Quote submitted', bg: 'bg-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-500/15' },
  quote_reviewed: { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Quote reviewed', bg: 'bg-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-500/15' },
  quote_approved: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Quote approved', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500/15' },
  quote_declined: { icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Quote declined', bg: 'bg-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-500/15' },
  invoice_created: { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Invoice created', bg: 'bg-violet-100', text: 'text-violet-700', iconBg: 'bg-violet-500/15' },
  invoice_marked_paid: { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Invoice marked paid', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500/15' },
  payment_started: { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Payment started', bg: 'bg-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-500/15' },
  payment_completed: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Payment completed', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500/15' },
  project_created: { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Project created', bg: 'bg-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-500/15' },
  project_updated: { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'Project updated', bg: 'bg-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-500/15' },
  project_completed: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Project completed', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500/15' },
  thread_created: { icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-5-5H9a1.994 1.994 0 01-1.414-.586M7 18V14a2 2 0 01-2-2V6a2 2 0 012-2h2c.65 0 1.234.21 1.713.56M7 18v4', label: 'Message thread started', bg: 'bg-violet-100', text: 'text-violet-700', iconBg: 'bg-violet-500/15' },
  message_sent: { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Message sent', bg: 'bg-violet-100', text: 'text-violet-700', iconBg: 'bg-violet-500/15' },
  client_created: { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Client created', bg: 'bg-slate-100', text: 'text-slate-700', iconBg: 'bg-slate-500/15' },
  client_updated: { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Client updated', bg: 'bg-slate-100', text: 'text-slate-700', iconBg: 'bg-slate-500/15' },
  contact_submitted: { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Contact form submitted', bg: 'bg-sky-100', text: 'text-sky-700', iconBg: 'bg-sky-500/15' },
  testimonial_submitted: { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'Testimonial submitted', bg: 'bg-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-500/15' },
};

const getConfig = (action) => {
  const cfg = ACTION_CONFIG[action];
  if (cfg) return cfg;
  return {
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    label: (action || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    iconBg: 'bg-slate-500/15',
  };
};

const getDateGroup = (d) => {
  if (!d) return 'Earlier';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return 'Earlier';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today - itemDate) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  return 'Earlier';
};

const ActivityLog = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchActivities();
  }, [isAuthenticated, navigate]);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/users/activity-log/');
      setActivities(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Access denied' : 'Failed to load activity log');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filterActivity = (item) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    const label = (item.action_display || getConfig(item.action).label).toLowerCase();
    const details = (item.details || '').toLowerCase();
    const action = (item.action || '').toLowerCase();
    return label.includes(term) || details.includes(term) || action.includes(term);
  };

  const filteredActivities = activities.filter(filterActivity);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left: History image panel - hidden on small screens */}
      <div className="hidden md:flex md:w-2/5 lg:w-[40%] relative overflow-hidden">
        <img
          src={HISTORY_IMAGE}
          alt="Activity history"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-amber-900/40 to-slate-900/90" />
        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14 text-white">
          <Link to="/profile" className="inline-flex items-center gap-3 group">
            <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold text-slate-100 group-hover:text-white transition-colors">Back to Profile</span>
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-amber-100">Your activity timeline</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Every action tells a story
            </h2>
            <p className="text-slate-200 text-lg max-w-sm leading-relaxed">
              Track your sign-ins, quote approvals, payments, and project updates. Your complete history in one place.
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Secure · Private · Always accessible
          </p>
        </div>
      </div>

      {/* Right: Content panel */}
      <div className="w-full md:w-3/5 lg:w-[60%] flex flex-col min-h-screen bg-slate-50/90">
        {/* Mobile: compact image banner + back link */}
        <div className="md:hidden">
          <div className="relative h-44 overflow-hidden">
            <img src={HISTORY_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <Link to="/profile" className="inline-flex items-center gap-2 text-white/90 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Profile</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Activity Log</h1>
                <p className="text-sm text-slate-300">Your account and project history</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-8 sm:py-10 overflow-y-auto">
          {/* Desktop header */}
          <div className="md:block hidden mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Activity Log
            </h1>
            <p className="mt-2 text-slate-600 text-[15px]">
              A timeline of your account and project activity
            </p>
          </div>

          {!loading && !error && activities.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 shadow-sm transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-14 text-center">
              <div className="w-11 h-11 border-[3px] border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-5" />
              <p className="text-slate-600 font-medium">Loading your activity...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium mb-5">{error}</p>
              <button
                onClick={fetchActivities}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-14 sm:p-16 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {search ? 'No matching activity' : 'No activity yet'}
              </h3>
              <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                {search
                  ? 'Try a different search term, e.g. "login", "quote", "payment", or a project name.'
                  : 'Your sign-ins, quote approvals, payments, and profile updates will appear here.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* Activity count badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-slate-500">
                  {filteredActivities.length} {filteredActivities.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-amber-200/80 via-slate-200 to-transparent" />
                <ul className="space-y-0">
                  {filteredActivities.map((item, i) => {
                    const config = getConfig(item.action);
                    const group = getDateGroup(item.timestamp);
                    const prevGroup = i > 0 ? getDateGroup(filteredActivities[i - 1].timestamp) : null;
                    const showGroup = group !== prevGroup;
                    return (
                      <React.Fragment key={item.id}>
                        {showGroup && (
                          <li className="pt-6 first:pt-0">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-14 mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {group}
                            </p>
                          </li>
                        )}
                        <li className="relative flex gap-4 pl-2 sm:pl-0 group/item">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center border border-white shadow-sm z-10 ring-2 ring-white/50`}>
                            <svg className={`w-5 h-5 ${config.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0 pb-6">
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 group-hover/item:shadow-md group-hover/item:border-slate-200 transition-all">
                              <p className="font-medium text-slate-900">
                                {item.action_display || config.label}
                              </p>
                              {item.details && (
                                <p className="text-sm text-slate-500 mt-0.5 truncate" title={item.details}>
                                  {item.details}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-1.5" title={formatDateTime(item.timestamp)}>
                                {item.timestamp ? formatRelativeTime(item.timestamp) : '—'}
                              </p>
                            </div>
                          </div>
                        </li>
                      </React.Fragment>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
