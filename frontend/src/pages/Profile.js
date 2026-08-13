import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import ProfileWorkspace from '../components/profile/ProfileWorkspace';
import ProfileQuoteCard from '../components/profile/ProfileQuoteCard';
import UserAvatar from '../components/UserAvatar';
import { getTestimonialAvatarUrl, getUserAvatarUrl } from '../utils/userAvatar';
import {
  PROFILE_IMAGES,
  ProfileBannerImage,
  ProfileTabBanner,
  ProfileSectionCard,
  ProfileEmptyState,
  ProfileLoadingState,
  ProfileStatPill,
} from '../components/profile/profileUi';
import { CLIENT_WORKSPACE_NAV, WorkspaceNavIcon, getWorkspaceAccent } from '../constants/clientWorkspaceNav';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'messages', label: 'My Messages', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'quotes', label: 'My Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'invoices', label: 'My Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'projects', label: 'My Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'testimonials', label: 'Testimonials', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'settings', label: 'Profile Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

/** One-line description per tab (avoids broken copy like “Manage your my projects.”) */
const TAB_SUBTITLES = {
  overview: 'Payments, projects, and conversations in one place—clear, secure, and easy to navigate.',
  messages: 'Project threads with our team, plus messages you’ve sent from the contact form—all in one place.',
  quotes: 'Review estimates, formal proposals, and your approve or decline decisions—all in one timeline.',
  invoices: 'Official invoices, amounts owed, and due dates—open any row for the full breakdown or PDF.',
  projects: 'Stages, progress, and links to your full project hub.',
  testimonials: 'Words from you—reviewed with care before they appear publicly. Thank you for helping others trust our work.',
  settings: 'Your name, photo, password, and sign-in email—kept secure and easy to update.',
};

/** Cover image for project cards (matches full My Projects page) */
const getProjectCoverUrl = (p) => {
  if (!p) return null;
  if (p.hero_image) return getMediaUrl(p.hero_image);
  if (p.screenshots?.length) return getMediaUrl(p.screenshots[0]);
  return null;
};

/** Spacing constants for consistent layout */
const SPACING = {
  section: 'space-y-6',
  cardGap: 'gap-6',
};

/** Status badge: pending (amber), replied (blue), approved/paid (green), declined (red), etc. */
const StatusBadge = ({ status, label }) => {
  const variants = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    new: 'bg-amber-100 text-amber-800 border-amber-200',
    replied: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    read: 'bg-slate-100 text-slate-700 border-slate-200',
    sent: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    declined: 'bg-red-100 text-red-800 border-red-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
    reviewed: 'bg-sky-100 text-sky-800 border-sky-200',
    changes_requested: 'bg-orange-100 text-orange-800 border-orange-200',
    planning: 'bg-amber-100 text-amber-800 border-amber-200',
    design: 'bg-sky-100 text-sky-800 border-sky-200',
    development: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    testing: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  const s = (status || '').toLowerCase().replace(/\s/g, '_');
  const style = variants[s] || variants.default;
  const display = label ?? status;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {display}
    </span>
  );
};

/**
 * Profile — Main authenticated user hub.
 *
 * Fetches all data via single GET /api/profile/ (user, client, quotes, invoices,
 * projects, messages, testimonials). Tabbed layout: Overview, Messages, Quotes,
 * Invoices, Projects, Testimonials, Account Settings.
 */
const Profile = () => {
  const { user, isAuthenticated, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]); // legacy contact messages from /profile/
  const [threads, setThreads] = useState([]); // internal project conversations from /messaging/threads/
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [quoteActionLoading, setQuoteActionLoading] = useState(null);
  const [quoteSuccessMessage, setQuoteSuccessMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState(null);
  // Profile Settings state
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState({ type: '', text: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);

  const handleDownloadInvoicePDF = async (inv) => {
    if (invoiceDownloadingId) return;
    setInvoiceDownloadingId(inv.id);
    try {
      const res = await api.get(`/invoices/${inv.id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${inv.invoice_number || inv.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download invoice PDF.');
    } finally {
      setInvoiceDownloadingId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchProfile();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    setDataLoading(true);
    setError('');
    try {
      const [profileRes, threadsRes] = await Promise.all([
        api.get('/profile/'),
        api.get('/messaging/threads/'),
      ]);
      const data = profileRes.data || {};
      setClient(data.client ?? null);
      setMessages(data.messages ?? []);
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
      setStats(data.stats ?? null);

      const rawThreads = threadsRes.data?.results ?? threadsRes.data ?? [];
      setThreads(Array.isArray(rawThreads) ? rawThreads : []);
    } catch (err) {
      setError('We couldn\'t load your profile data. Please check your connection and try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaveMessage({ type: '', text: '' });
    setProfileSaveLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', profileForm.first_name);
      formData.append('last_name', profileForm.last_name);
      formData.append('bio', profileForm.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      await api.patch('/users/profile/update/', formData);
      if (refreshUser) await refreshUser();
      setProfileSaveMessage({ type: 'success', text: 'Profile updated successfully.' });
      setAvatarFile(null);
    } catch (err) {
      const msg = err.response?.data?.first_name?.[0] || err.response?.data?.last_name?.[0] || err.response?.data?.bio?.[0] || err.response?.data?.avatar?.[0] || err.response?.data?.detail || err.message || 'Failed to update profile.';
      setProfileSaveMessage({ type: 'error', text: msg });
    } finally {
      setProfileSaveLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/users/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_new_password: passwordForm.confirm_new_password,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      const msg = err.response?.data?.current_password?.[0] || err.response?.data?.new_password?.[0] || err.response?.data?.confirm_new_password?.[0] || err.response?.data?.detail || err.message || 'Failed to change password.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailMessage({ type: '', text: '' });
    setEmailLoading(true);
    try {
      await api.post('/users/change-email/', { new_email: emailForm.new_email, password: emailForm.password });
      setEmailMessage({ type: 'success', text: 'Email updated successfully.' });
      setEmailForm({ new_email: '', password: '' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      const msg = err.response?.data?.new_email?.[0] || err.response?.data?.password?.[0] || err.response?.data?.detail || err.message || 'Failed to change email.';
      setEmailMessage({ type: 'error', text: msg });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleQuoteApprove = async (quoteId) => {
    setQuoteActionLoading(quoteId);
    setError('');
    setQuoteSuccessMessage('');
    try {
      const { data } = await api.post(`/quotes/${quoteId}/decision/`, { decision: 'approve' });
      await fetchProfile();
      const paymentUrl = data?.payment_url?.trim();
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      navigate(`/payment/${quoteId}`);
      return;
    } catch (err) {
      const msg = err.response?.data?.decision?.[0] || err.response?.data?.detail || 'Failed to approve quote. Please try again.';
      setError(msg);
    } finally {
      setQuoteActionLoading(null);
    }
  };

  const handleQuoteDecline = async (quoteId) => {
    setQuoteActionLoading(quoteId);
    setError('');
    setQuoteSuccessMessage('');
    try {
      await api.post(`/quotes/${quoteId}/decision/`, { decision: 'decline' });
      setQuoteSuccessMessage('Quote declined.');
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.decision?.[0] || err.response?.data?.detail || 'Failed to decline quote. Please try again.';
      setError(msg);
    } finally {
      setQuoteActionLoading(null);
    }
  };

  const msgIcon = 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
  const docIcon = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  const projectIcon = 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
  const starIcon = 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-900 font-bold">Loading your profile...</p>
          <p className="text-slate-500 text-sm mt-1">This will only take a moment</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const completedProjects = projects.filter((p) => p.status === 'completed');
  const activeProjects = projects.filter((p) => p.status !== 'completed');

  const quoteIdsWithInvoice = new Set(
    (invoices || [])
      .map((inv) => (typeof inv.quote === 'object' ? inv.quote?.id : inv.quote))
      .filter(Boolean)
  );
  const approvedUnpaidQuotes = quotes.filter(
    (q) =>
      (q.status === 'approved' || q.status === 'Approved') &&
      q.status !== 'paid' &&
      !quoteIdsWithInvoice.has(q.id)
  );

  const avatarUrl = getUserAvatarUrl(user) || (user?.avatar && getMediaUrl(user.avatar));
  const overviewDisplayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.first_name || user?.username || 'there';

  const projectStatusLabel = (status) => {
    const labels = {
      planning: 'Planning',
      design: 'Design',
      development: 'Development',
      testing: 'Testing',
      in_progress: 'In progress',
      pending: 'Pending',
      completed: 'Completed',
    };
    return labels[status] || (status ? String(status).replace(/_/g, ' ') : '—');
  };

  const quoteStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'replied') return 'Replied';
    if (s === 'reviewed') return 'Reviewed';
    if (s === 'approved') return 'Approved';
    if (s === 'declined' || s === 'rejected') return 'Declined';
    if (s === 'changes_requested') return 'Changes requested';
    if (s === 'paid') return 'Paid';
    return status ? String(status).replace(/_/g, ' ') : '—';
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    logout();
    navigate('/');
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <ProfileWorkspace
          user={user}
          client={client}
          avatarUrl={avatarUrl}
          displayName={overviewDisplayName}
          stats={stats}
          threads={threads}
          quotes={quotes}
          invoices={invoices}
          projects={projects}
          approvedUnpaidQuotes={approvedUnpaidQuotes}
          setActiveTab={setActiveTab}
        />
      );
    }

    if (activeTab === 'messages') {
      const contactFormIcon = 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
      if (dataLoading) {
        return (
          <div className={SPACING.section}>
            <div className="rounded-xl border border-slate-200/80 bg-white p-12 sm:p-16 shadow-sm ring-1 ring-slate-900/5">
              <ProfileLoadingState label="Loading your messages..." />
            </div>
          </div>
        );
      }
      return (
        <div className={SPACING.section}>
          <ProfileSectionCard
            title="Project conversations"
            icon={msgIcon}
            iconBg="bg-teal-50"
            iconColor="text-teal-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Chat with us inside each active project. Open a thread to reply, share files, and keep everything in context.
              </p>
              <Link
                to="/messages"
                className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-100 hover:border-teal-300"
              >
                Open full inbox
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            {threads.length === 0 ? (
              <ProfileEmptyState
                icon={msgIcon}
                title="No project conversations yet"
                message="When a project is underway, your team thread appears here so you can message us directly without leaving the portal."
                action={
                  <Link
                    to="/my-projects"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-md shadow-teal-900/10"
                  >
                    View my projects
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/messages/${t.id}`}
                      className="group flex flex-col sm:flex-row sm:items-stretch gap-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-4 sm:p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1 pr-0 sm:pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-teal-800 transition-colors">
                            {t.project_name || 'Project conversation'}
                          </span>
                          {t.message_count > 0 && (
                            <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800">
                              {t.message_count} {t.message_count === 1 ? 'msg' : 'msgs'}
                            </span>
                          )}
                        </div>
                        {t.client_name && <p className="text-xs text-slate-500">Client: {t.client_name}</p>}
                        {t.last_message_preview && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{t.last_message_preview}</p>
                        )}
                      </div>
                      <div className="mt-3 flex shrink-0 flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:mt-0 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                        {t.last_message_at && (
                          <time className="text-xs font-medium text-slate-500 tabular-nums">{formatDateTime(t.last_message_at)}</time>
                        )}
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:text-teal-700">
                          Open
                          <svg className="w-4 h-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Contact requests"
            icon={contactFormIcon}
            iconBg="bg-sky-50"
            iconColor="text-sky-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Messages you’ve submitted through our website contact form. Use this to track replies and follow-ups.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-2.5 text-sm font-semibold text-sky-900 shadow-sm transition hover:bg-sky-100"
              >
                New message
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={contactFormIcon} />
                  </svg>
                </div>
                <p className="font-semibold text-slate-900">No contact requests yet</p>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  When you reach out from the contact page, your message and status will show up here.
                </p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-colors shadow-sm"
                >
                  Go to contact
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-900/[0.03]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <p className="font-semibold text-slate-900">{m.subject}</p>
                      {m.status && <StatusBadge status={m.status} />}
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">{m.message}</p>
                    <p className="text-xs font-medium text-slate-500 mt-3 tabular-nums">{formatDateTime(m.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </ProfileSectionCard>
        </div>
      );
    }

    if (activeTab === 'quotes') {
      if (dataLoading) {
        return (
          <div className={SPACING.section}>
            <div className="rounded-xl border border-slate-200/80 bg-white p-12 sm:p-16 shadow-sm ring-1 ring-slate-900/5">
              <ProfileLoadingState label="Loading your quotes..." />
            </div>
          </div>
        );
      }
      return (
        <div className={SPACING.section}>
          <ProfileSectionCard
            title="Your quotes & proposals"
            icon={docIcon}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Track every request from submission through formal proposal, approval, and payment. Open a proposal for full scope, deliverables, and next steps.
              </p>
              <Link
                to="/request-quote"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-900/15 transition hover:from-amber-400 hover:to-amber-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New quote request
              </Link>
            </div>
            {quoteSuccessMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-medium text-emerald-900">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-200/60">
                  <svg className="h-4 w-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {quoteSuccessMessage}
              </div>
            )}
            {quotes.length === 0 ? (
              <ProfileEmptyState
                icon={docIcon}
                title="No quotes yet"
                message="Tell us about your project and we’ll return a tailored estimate—most replies land within one business day."
                action={
                  <Link
                    to="/request-quote"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-900/15 hover:from-amber-400 hover:to-amber-500 transition-colors"
                  >
                    Request a quote
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {quotes.map((q) => (
                  <ProfileQuoteCard
                    key={q.id}
                    quote={q}
                    actionLoading={quoteActionLoading}
                    onApprove={handleQuoteApprove}
                    onDecline={handleQuoteDecline}
                  />
                ))}
                <div className="flex justify-center pt-3 sm:justify-start">
                  <Link
                    to="/request-quote"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Request another quote
                  </Link>
                </div>
              </div>
            )}
          </ProfileSectionCard>
        </div>
      );
    }

    if (activeTab === 'invoices') {
      if (dataLoading) {
        return (
          <div className={SPACING.section}>
            <div className="rounded-xl border border-slate-200/80 bg-white p-12 sm:p-16 shadow-sm ring-1 ring-slate-900/5">
              <ProfileLoadingState label="Loading your invoices..." />
            </div>
          </div>
        );
      }
      return (
        <div className={SPACING.section}>
          <ProfileSectionCard
            title="Invoice history"
            icon={docIcon}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Download PDFs and review line items from the detail view. Due dates help you stay ahead of payment schedules.
              </p>
              <Link
                to="/portal"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Client portal
              </Link>
            </div>
            {invoices.length === 0 ? (
              <ProfileEmptyState
                icon={docIcon}
                title="No invoices yet"
                message="Invoices are issued after a quote is approved and we’re ready to bill. Track quotes in the Quotes tab—we’ll email you when an invoice is ready."
                action={
                  <Link
                    to="/portal"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 hover:bg-emerald-500 transition-colors"
                  >
                    Open client portal
                  </Link>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-50 via-teal-50/80 to-slate-50/50">
                        <th className="px-4 sm:px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-900/90">
                          Invoice #
                        </th>
                        <th className="px-4 sm:px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-900/90">
                          Status
                        </th>
                        <th className="px-4 sm:px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-900/90">
                          Total
                        </th>
                        <th className="px-4 sm:px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-900/90">
                          Due date
                        </th>
                        <th className="px-4 sm:px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-emerald-900/90">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="transition-colors hover:bg-emerald-50/35"
                        >
                          <td className="whitespace-nowrap px-4 sm:px-5 py-4 text-sm font-semibold text-slate-900 tabular-nums">
                            {inv.invoice_number || inv.id}
                          </td>
                          <td className="px-4 sm:px-5 py-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 sm:px-5 py-4 text-sm font-medium tabular-nums text-slate-800">
                            {formatCurrency(inv.total_amount)}
                          </td>
                          <td className="whitespace-nowrap px-4 sm:px-5 py-4 text-sm text-slate-600 tabular-nums">
                            {formatDate(inv.due_date)}
                          </td>
                          <td className="whitespace-nowrap px-4 sm:px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 hover:border-teal-300"
                            >
                              View
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ProfileSectionCard>
        </div>
      );
    }

    if (activeTab === 'projects') {
      return (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 bg-[#fafafa]">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={projectIcon} />
                  </svg>
                </span>
                Project snapshot
              </h2>
              <p className="text-sm text-[#545b64] mt-2 pl-12 sm:pl-0 sm:ml-12">
                Highlights from your work with us. Open the hub below for search, filters, file sharing, and full details.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              {dataLoading ? (
                <ProfileLoadingState label="Loading your projects..." />
              ) : projects.length === 0 ? (
                <ProfileEmptyState
                  icon={projectIcon}
                  title="No projects yet"
                  message="Projects appear after your invoice is paid and work begins. You can track quotes and invoices in the other tabs."
                  action={
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Link to="/portal" className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
                        Client portal
                      </Link>
                      <Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200/80 text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                        Request a quote
                      </Link>
                    </div>
                  }
                />
              ) : (
                <div className="space-y-8">
                  {activeProjects.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        In progress
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {activeProjects.map((p) => {
                          const cover = getProjectCoverUrl(p);
                          const pct = Math.max(0, Math.min(100, Number(p.progress_percentage ?? 0)));
                          return (
                            <div
                              key={p.id}
                              className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-teal-300 hover:shadow-md transition-all duration-200"
                            >
                              <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-50">
                                {cover ? (
                                  <img src={cover} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                <span className="absolute top-2 right-2">
                                  <StatusBadge status={p.status} label={projectStatusLabel(p.status)} />
                                </span>
                              </div>
                              <div className="p-4">
                                <p className="font-semibold text-slate-900 line-clamp-2 group-hover:text-teal-700 transition-colors">
                                  {p.name || p.quote_project_title || 'Project'}
                                </p>
                                {p.description && (
                                  <p className="text-sm text-[#64748b] mt-1 line-clamp-2">{p.description}</p>
                                )}
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-[#64748b] mb-1">
                                    <span>Progress</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {completedProjects.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Completed
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {completedProjects.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 truncate">{p.name || p.quote_project_title || 'Project'}</p>
                              <StatusBadge status="completed" label="Completed" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 flex flex-wrap gap-3">
                    <Link
                      to="/my-projects"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
                    >
                      Open full project hub
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'testimonials') {
      if (dataLoading) {
        return (
          <div className={SPACING.section}>
            <div className="rounded-xl border border-slate-200/80 bg-white p-12 sm:p-16 shadow-sm ring-1 ring-slate-900/5">
              <ProfileLoadingState label="Loading your testimonials..." />
            </div>
          </div>
        );
      }
      return (
        <div className={SPACING.section}>
          <ProfileSectionCard
            title="Your testimonials"
            icon={starIcon}
            iconBg="bg-teal-50"
            iconColor="text-teal-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-2xl">
              Honest feedback helps future clients understand what it’s like to work with us. Submissions are reviewed before publication.
            </p>
            {testimonials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-teal-200 bg-gradient-to-br from-teal-50/90 via-slate-50 to-cyan-50/40 px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-900/25 mb-5">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Share your experience</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Tell us how your project went—we read every submission and publish approved testimonials with your permission.
                </p>
                <Link
                  to="/contact"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-md shadow-teal-900/20 hover:bg-teal-500 transition-colors"
                >
                  Submit a testimonial
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {testimonials.map((t) => {
                  const r = Math.min(5, Math.max(0, Number(t.rating) || 0));
                  return (
                    <li
                      key={t.id}
                      className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-teal-50/25 p-5 sm:p-6 shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-teal-200 hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <UserAvatar
                          src={getTestimonialAvatarUrl(t, user)}
                          name={t.name || overviewDisplayName}
                          email={user?.email}
                          size="lg"
                          ring
                          className="ring-teal-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-center gap-1.5 min-w-0" aria-hidden>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${i <= r ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                        <StatusBadge
                          status={t.is_approved ? 'approved' : 'pending'}
                          label={t.is_approved ? 'Approved' : 'Pending review'}
                        />
                      </div>
                      <blockquote className="mt-4 border-l-4 border-teal-400 pl-4 text-slate-800 leading-relaxed text-[15px] sm:text-base whitespace-pre-wrap">
                        {t.testimonial}
                      </blockquote>
                      <p className="text-xs font-medium text-slate-500 mt-4 tabular-nums">
                        Submitted {formatDate(t.created_at)}
                      </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {testimonials.length > 0 && (
              <div className="mt-8 flex justify-center sm:justify-start pt-2 border-t border-slate-100">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another testimonial
                </Link>
              </div>
            )}
          </ProfileSectionCard>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className={SPACING.section}>
          <ProfileSectionCard
            title="Account snapshot"
            icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            iconBg="bg-teal-50"
            iconColor="text-teal-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Read-only account facts. Use the sections below to change your profile, password, or email.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Member since
                </dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(user?.date_joined)}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Last login
                </dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">{user?.last_login ? formatDateTime(user.last_login) : '—'}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm sm:col-span-1">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  Email status
                </dt>
                <dd className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{user?.email_verified ? 'Verified' : 'Not verified'}</span>
                  {user?.email_verified && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                      Active
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Profile & photo"
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            iconBg="bg-teal-50"
            iconColor="text-teal-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Your photo appears across the client portal. JPG or PNG, ideally square—we’ll crop to fit.
            </p>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {profileSaveMessage.text && (
                <div
                  className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
                    profileSaveMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                      : 'bg-red-50 text-red-900 border border-red-200/80'
                  }`}
                >
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${profileSaveMessage.type === 'success' ? 'bg-emerald-200/60' : 'bg-red-200/60'}`}>
                    {profileSaveMessage.type === 'success' ? (
                      <svg className="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <span>{profileSaveMessage.text}</span>
                </div>
              )}
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 shadow-inner">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-2 ring-white shadow-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : avatarFile ? (
                        <img src={URL.createObjectURL(avatarFile)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-bold text-slate-400">{user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                  </div>
                  <label className="mt-4 cursor-pointer group">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                    <span className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm transition group-hover:bg-teal-50 group-hover:border-teal-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {avatarFile ? 'Replace photo' : 'Upload photo'}
                    </span>
                  </label>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">First name</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                      className="input-professional w-full rounded-xl"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Last name</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
                      className="input-professional w-full rounded-xl"
                      placeholder="Last name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Bio</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      className="input-professional w-full rounded-xl min-h-[5.5rem]"
                      placeholder="A short line about you or your business (optional)"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={profileSaveLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-900/15 hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {profileSaveLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Password"
            icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <p className="text-sm text-slate-600 mb-5 leading-relaxed max-w-xl">
              Choose a strong password you don’t use elsewhere. You’ll stay signed in on this device until you log out.
            </p>
            <div className="rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/90 to-orange-50/40 p-6 sm:p-7 max-w-lg">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordMessage.text && (
                  <div
                    className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
                      passwordMessage.type === 'success'
                        ? 'bg-white/80 text-emerald-900 border border-emerald-200'
                        : 'bg-white/80 text-red-900 border border-red-200'
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-amber-900/70 mb-2">Current password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                    className="input-professional w-full rounded-xl bg-white/90"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-amber-900/70 mb-2">New password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                    className="input-professional w-full rounded-xl bg-white/90"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-amber-900/70 mb-2">Confirm new password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_new_password}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirm_new_password: e.target.value }))}
                    className="input-professional w-full rounded-xl bg-white/90"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold shadow-md hover:bg-amber-500 disabled:opacity-50 transition-colors"
                >
                  {passwordLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Update password
                    </>
                  )}
                </button>
              </form>
            </div>
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Email address"
            icon="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            iconBg="bg-sky-50"
            iconColor="text-sky-700"
            className="rounded-xl shadow-sm ring-1 ring-slate-900/5"
          >
            <p className="text-sm text-slate-600 mb-5 leading-relaxed max-w-xl">
              Changing your email updates where we send invoices and login links. We’ll ask for your password to confirm it’s you.
            </p>
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/90 to-slate-50/40 p-6 sm:p-7 max-w-lg">
              <form onSubmit={handleChangeEmail} className="space-y-4">
                {emailMessage.text && (
                  <div
                    className={`p-4 rounded-xl text-sm font-medium ${
                      emailMessage.type === 'success'
                        ? 'bg-white/80 text-emerald-900 border border-emerald-200'
                        : 'bg-white/80 text-red-900 border border-red-200'
                    }`}
                  >
                    {emailMessage.text}
                  </div>
                )}
                <div className="rounded-xl border border-sky-200/70 bg-white px-4 py-3 text-sm shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">Currently signed in as</span>
                  <p className="mt-1 font-semibold text-slate-900 break-all">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">New email</label>
                  <input
                    type="email"
                    value={emailForm.new_email}
                    onChange={(e) => setEmailForm((p) => ({ ...p, new_email: e.target.value }))}
                    className="input-professional w-full rounded-xl bg-white"
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Password (to confirm)</label>
                  <input
                    type="password"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))}
                    className="input-professional w-full rounded-xl bg-white"
                    placeholder="Your current password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-md shadow-teal-900/10 hover:bg-teal-500 disabled:opacity-50 transition-colors"
                >
                  {emailLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Change email
                    </>
                  )}
                </button>
              </form>
            </div>
          </ProfileSectionCard>
        </div>
      );
    }

    return null;
  };

  const tabIcon = (path, className = 'w-8 h-8 text-teal-200') => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  );

  const renderProfileTabHeader = () => {
    if (activeTab === 'overview') {
      return (
        <div className="mb-8 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-900/5">
          <div className="relative min-h-[220px] sm:min-h-[260px]">
            <ProfileBannerImage src={PROFILE_IMAGES.overview} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-teal-900/45" />
            <div className="relative px-6 py-8 sm:px-8 sm:py-10 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 min-w-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/15 shadow-2xl" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-teal-400/40 to-teal-700/30 ring-4 ring-white/15 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-2xl">
                      {user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-teal-200/95 text-xs font-bold uppercase tracking-[0.2em] mb-2">Your client hub</p>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Welcome back, {overviewDisplayName}</h1>
                    <p className="mt-3 text-sm sm:text-base text-slate-200/95 leading-relaxed max-w-xl">{TAB_SUBTITLES.overview}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { count: threads.length, label: 'Threads', tabId: 'messages' },
                    { count: quotes.length, label: 'Quotes', tabId: 'quotes' },
                    { count: invoices.length, label: 'Invoices', tabId: 'invoices' },
                    { count: projects.length, label: 'Projects', tabId: 'projects' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveTab(item.tabId)}
                      className="rounded-xl px-3 py-3 text-left border border-white/15 bg-white/10 backdrop-blur-sm transition hover:bg-white/15"
                    >
                      <p className="text-xl font-bold tabular-nums">{item.count}</p>
                      <p className="text-[11px] font-medium text-slate-300 mt-0.5">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              {approvedUnpaidQuotes.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-amber-400/35 bg-amber-500/15 px-4 py-3.5 sm:px-5">
                  <div>
                    <p className="font-semibold text-amber-50 text-sm">Payment pending</p>
                    <p className="text-xs text-amber-100/85 mt-0.5">
                      {approvedUnpaidQuotes.length === 1
                        ? 'Complete payment to move your project forward.'
                        : `${approvedUnpaidQuotes.length} approved quotes are ready for payment.`}
                    </p>
                  </div>
                  <Link
                    to={`/payment/${approvedUnpaidQuotes[0].id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-md hover:bg-amber-50 transition-colors shrink-0"
                  >
                    Pay now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const headers = {
      messages: {
        image: PROFILE_IMAGES.messages,
        eyebrow: 'Inbox',
        title: 'My Messages',
        icon: tabIcon('M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'),
        stat: { count: threads.length, label: 'Project threads' },
        action: { to: '/messages', label: 'Open inbox' },
      },
      quotes: {
        image: PROFILE_IMAGES.quotes,
        eyebrow: 'Estimates & proposals',
        title: 'My Quotes',
        icon: tabIcon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'w-8 h-8 text-amber-200'),
        stat: { count: quotes.length, label: 'Quote requests' },
        action: { to: '/request-quote', label: 'Request quote', accent: 'bg-amber-500 text-slate-900 hover:bg-amber-400' },
      },
      invoices: {
        image: PROFILE_IMAGES.invoices,
        eyebrow: 'Billing',
        title: 'My Invoices',
        icon: tabIcon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'w-8 h-8 text-emerald-200'),
        stat: { count: invoices.length, label: 'On file' },
        action: { to: '/portal', label: 'Portal', accent: 'bg-emerald-400 text-slate-900 hover:bg-emerald-300' },
      },
      projects: {
        image: PROFILE_IMAGES.projects,
        eyebrow: 'Your work with us',
        title: 'My Projects',
        accent: 'from-teal-900/90 via-teal-800/75 to-cyan-900/55',
        icon: tabIcon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'),
        action: { to: '/my-projects', label: 'Open project hub' },
      },
      testimonials: {
        image: PROFILE_IMAGES.testimonials,
        eyebrow: 'Client feedback',
        title: 'Testimonials',
        icon: (
          <svg className="w-9 h-9 text-amber-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
        stat: { count: testimonials.length, label: 'On record' },
        action: { to: '/contact', label: 'Share feedback' },
      },
      settings: {
        image: PROFILE_IMAGES.settings,
        eyebrow: 'Account & security',
        title: 'Profile Settings',
        icon: tabIcon('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'),
      },
    };

    const config = headers[activeTab];
    if (!config) return null;

    return (
      <ProfileTabBanner
        image={config.image}
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={TAB_SUBTITLES[activeTab]}
        icon={config.icon}
        accent={config.accent}
      >
        {config.stat && <ProfileStatPill count={config.stat.count} label={config.stat.label} />}
        {config.action && (
          <Link
            to={config.action.to}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition ${
              config.action.accent || 'bg-white text-teal-800 hover:bg-teal-50'
            }`}
          >
            {config.action.label}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </ProfileTabBanner>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 min-h-screen bg-slate-900 border-r border-slate-800">
        <div className="shrink-0 px-5 pt-6 pb-5 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/pathycode-logo.png"
              alt="PathyCode"
              className="h-8 w-auto brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity"
            />
            <div>
              <p className="text-sm font-bold text-white tracking-tight">PathyCode</p>
              <p className="text-[11px] text-violet-300/80 font-medium">Client workspace</p>
            </div>
          </Link>
        </div>

        <nav className="shrink-0 px-3 py-4 space-y-0.5 border-b border-slate-800" aria-label="Workspace">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
          {CLIENT_WORKSPACE_NAV.map((item) => {
            const active = item.to === '/profile';
            const accent = getWorkspaceAccent(item.accent);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? accent.sidebarActive
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    active ? accent.sidebarActiveIcon : accent.sidebarIcon
                  }`}
                >
                  <WorkspaceNavIcon name={item.icon} className="w-4 h-4" />
                </span>
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <nav className="flex-1 min-h-0 p-3 space-y-0.5 overflow-y-auto" aria-label="Account sections">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Account
          </p>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="shrink-0 mt-auto p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-violet-500/30">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="truncate text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <WorkspaceNavIcon name="signOut" className="w-4 h-4" />
            </span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-6xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/profile" className="hover:text-slate-800 font-medium">Dashboard</Link>
              <span aria-hidden className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">{TABS.find((t) => t.id === activeTab)?.label ?? 'Overview'}</span>
            </nav>
            <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Something went wrong</p>
                  <p className="text-slate-600 text-sm mt-0.5">{error}</p>
                </div>
              </div>
              <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 shrink-0">
                Try again
              </button>
            </div>
          )}

          {renderProfileTabHeader()}
          <div className="space-y-6">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownloadPDF={handleDownloadInvoicePDF}
          isDownloading={invoiceDownloadingId === selectedInvoice?.id}
        />
      )}
    </div>
  );
};

export default Profile;
