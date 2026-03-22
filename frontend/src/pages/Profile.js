import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'messages', label: 'My Messages', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'quotes', label: 'My Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'invoices', label: 'My Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'projects', label: 'My Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'testimonials', label: 'Testimonials', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'settings', label: 'Profile Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

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
    reviewed: 'bg-gray-100 text-gray-700 border-gray-200',
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

/** AWS-style section card: white bg, subtle border, clear header */
const SectionCard = ({ title, icon, iconBg = 'bg-[#f4f4f4]', iconColor = 'text-[var(--aws-dark)]', children, className = '' }) => (
  <div className={`bg-white border border-[var(--aws-card-border)] overflow-hidden ${className}`}>
    <div className="px-6 sm:px-8 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa]">
      <h2 className="text-base font-semibold text-[var(--aws-dark)] flex items-center gap-3">
        <span className={`w-9 h-9 rounded ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 sm:p-8">{children}</div>
  </div>
);

/** Empty state with icon, friendly message, and CTA */
const EmptyState = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 text-center">
    <div className="w-16 h-16 rounded bg-[#f4f4f4] text-[#737373] flex items-center justify-center mb-4">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-[var(--aws-dark)] mb-2">{title}</h3>
    <p className="text-[#545b64] text-sm max-w-md leading-relaxed mb-6">{message}</p>
    {action}
  </div>
);

/** Loading skeleton for section content */
const LoadingState = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-10 h-10 border-2 border-[var(--aws-orange)] border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-sm font-medium text-[#545b64]">{label}</p>
  </div>
);

/**
 * Profile — Main authenticated user hub.
 *
 * Fetches all data via single GET /api/profile/ (user, client, quotes, invoices,
 * projects, messages, testimonials). Tabbed layout: Overview, Messages, Quotes,
 * Invoices, Projects, Testimonials, Account Settings.
 */
const Profile = () => {
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
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
  const navigate = useNavigate();

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
      const { data } = await api.patch('/users/profile/update/', formData);
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
      const { data } = await api.post('/users/change-email/', { new_email: emailForm.new_email, password: emailForm.password });
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
      setError('No payment link is available for this quote. Please contact support.');
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
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-[var(--aws-orange)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[var(--aws-dark)] font-semibold">Loading your profile...</p>
          <p className="text-[#545b64] text-sm mt-1">This will only take a moment</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const activeProjects = projects.filter((p) => p.status === 'in_progress' || p.status === 'pending');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className={SPACING.section}>
          <SectionCard title="Personal details" icon={TABS[0].icon} iconBg="bg-[#f4f4f4]" iconColor="text-[var(--aws-dark)]">
            <p className="text-sm text-[#545b64] mb-4">The name and email linked to your account. To change these, go to Profile Settings in the tabs below.</p>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center ${SPACING.cardGap}`}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--aws-dark)] text-lg">{user?.first_name} {user?.last_name}</p>
                <p className="text-[#545b64] text-sm mt-0.5">{user?.email}</p>
                {client?.name && <p className="text-[#545b64] text-sm mt-0.5">Company: {client.name}</p>}
                {user?.is_superuser && <span className="inline-block mt-2"><StatusBadge status="admin" label="Admin" /></span>}
              </div>
            </div>
          </SectionCard>

          {client && (
            <SectionCard title="Client details" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" iconBg="bg-[#f4f4f4]" iconColor="text-[var(--aws-dark)]">
              <p className="text-sm text-[#545b64] mb-4">Your client record: company name and industry. This is used for quotes and projects.</p>
              <dl className={`grid grid-cols-1 sm:grid-cols-2 ${SPACING.cardGap}`}>
                <div><dt className="text-sm text-[#64748b]">Company / Name</dt><dd className="font-medium text-[var(--aws-dark)]">{client.name}</dd></div>
                {client.industry && <div><dt className="text-sm text-[#64748b]">Industry</dt><dd className="text-[var(--aws-dark)]">{client.industry}</dd></div>}
                {client.description && <div className="sm:col-span-2"><dt className="text-sm text-[#64748b]">Description</dt><dd className="text-[var(--aws-dark)]">{client.description}</dd></div>}
              </dl>
            </SectionCard>
          )}

          <SectionCard title="Summary" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" iconBg="bg-[#f4f4f4]" iconColor="text-[var(--aws-dark)]">
            <p className="text-sm text-[#545b64] mb-4">Counts at a glance: how many message threads, quote requests, invoices, and projects you have.</p>
            <div className={`grid grid-cols-2 sm:grid-cols-4 ${SPACING.cardGap}`}>
                {[
                  { count: threads.length, label: 'Messages', tabId: 'messages', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', num: 'text-blue-700', hover: 'hover:bg-blue-200/80' },
                  { count: quotes.length, label: 'Quotes', tabId: 'quotes', bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', num: 'text-amber-700', hover: 'hover:bg-amber-200/80' },
                  { count: invoices.length, label: 'Invoices', tabId: 'invoices', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800', num: 'text-emerald-700', hover: 'hover:bg-emerald-200/80' },
                  { count: projects.length, label: 'Projects', tabId: 'projects', bg: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-800', num: 'text-violet-700', hover: 'hover:bg-violet-200/80' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTab(item.tabId)}
                    className={`rounded-lg p-4 text-center border w-full cursor-pointer transition-colors ${item.bg} ${item.border} ${item.hover} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--brand-primary)]`}
                  >
                    <p className={`text-2xl sm:text-3xl font-bold ${item.num}`}>{item.count}</p>
                    <p className={`text-xs sm:text-sm font-medium mt-0.5 ${item.text}`}>{item.label}</p>
                  </button>
                ))}
            </div>
          </SectionCard>

          {(() => {
            // Quote IDs that already have an invoice (paid) - use invoice existence as source of truth
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
            if (approvedUnpaidQuotes.length === 0) return null;
            return (
              <SectionCard title="Outstanding payments" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" iconBg="bg-[#ccfbf1]" iconColor="text-[var(--brand-primary)]">
                <p className="text-sm text-[#545b64] mb-4">You have approved quotes waiting for payment. Pay anytime to generate your invoice and create your project.</p>
                <ul className="space-y-3">
                  {approvedUnpaidQuotes.map((q) => (
                    <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border border-[var(--aws-card-border)] bg-[#fafafa]">
                      <div>
                        <p className="font-semibold text-[var(--aws-dark)]">{q.title || `Quote #${q.id}`}</p>
                        {(q.total_price != null || q.estimated_amount != null) && (
                          <p className="text-sm text-[#545b64] mt-0.5">{formatCurrency(q.total_price ?? q.estimated_amount)}</p>
                        )}
                      </div>
                      <Link
                        to={`/payment/${q.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--aws-orange)] text-white text-sm font-semibold hover:bg-[var(--aws-orange-hover)] transition-colors shrink-0"
                      >
                        Pay now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            );
          })()}

          <SectionCard title="Quick access" icon="M13 10V3L4 14h7v7l9-11h-7z" iconBg="bg-[#f4f4f4]" iconColor="text-[var(--aws-dark)]">
            <p className="text-sm text-[#545b64] mb-4">Shortcuts to the Client Portal, your projects, quote requests, and contact. Use the left menu or tabs above to open Messages, Quotes, Invoices, and Profile Settings.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/portal" className="px-4 py-2.5 bg-[var(--aws-orange)] text-white text-sm font-medium hover:bg-[var(--aws-orange-hover)] transition-colors">Client Portal</Link>
              <Link to="/my-projects" className="px-4 py-2.5 bg-white border border-[var(--aws-card-border)] text-[var(--aws-dark)] text-sm font-medium hover:bg-[#f4f4f4] transition-colors">My Projects</Link>
              <Link to="/activity-log" className="px-4 py-2.5 bg-white border border-[var(--aws-card-border)] text-[var(--aws-dark)] text-sm font-medium hover:bg-[#f4f4f4] transition-colors">Activity Log</Link>
              <Link to="/request-quote" className="px-4 py-2.5 bg-white border border-[var(--aws-card-border)] text-[var(--aws-dark)] text-sm font-medium hover:bg-[#f4f4f4] transition-colors">Request Quote</Link>
              <Link to="/contact" className="px-4 py-2.5 bg-white border border-[var(--aws-card-border)] text-[var(--aws-dark)] text-sm font-medium hover:bg-[#f4f4f4] transition-colors">Contact</Link>
              {user?.is_superuser && <Link to="/admin" className="px-4 py-2.5 bg-[var(--aws-dark)] text-white text-sm font-medium hover:bg-[var(--aws-dark-hover)] transition-colors">Admin Dashboard</Link>}
            </div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === 'messages') {
      return (
        <SectionCard title="My Messages" icon={msgIcon} iconBg="bg-blue-50" iconColor="text-blue-600">
          {dataLoading ? (
            <LoadingState label="Loading your messages..." />
          ) : (
            <div className="space-y-8">
              {/* Project conversations (internal chat) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Project conversations</h3>
                  <Link
                    to="/messages"
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Open full inbox →
                  </Link>
                </div>
                {threads.length === 0 ? (
                  <EmptyState
                    icon={msgIcon}
                    title="No project conversations yet"
                    message="Once a project starts, your dedicated chat thread with the team will appear here so you can message us directly."
                    action={
                      <Link
                        to="/my-projects"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        View my projects
                      </Link>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden bg-gray-50/40">
                    {threads.map((t) => (
                      <li key={t.id} className="bg-white/70 hover:bg-blue-50/40 transition-colors">
                        <Link to={`/messages/${t.id}`} className="block px-4 py-4 sm:px-5 sm:py-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {t.project_name || 'Project conversation'}
                              </p>
                              {t.client_name && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Client: {t.client_name}
                                </p>
                              )}
                              {t.last_message_preview && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {t.last_message_preview}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {t.last_message_at && (
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(t.last_message_at)}
                                </p>
                              )}
                              {t.message_count > 0 && (
                                <span className="inline-flex items-center justify-center mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                  {t.message_count} {t.message_count === 1 ? 'message' : 'messages'}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Legacy contact messages (from contact form, etc.) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Contact requests</h3>
                  <Link
                    to="/contact"
                    className="text-xs font-medium text-gray-600 hover:text-gray-800"
                  >
                    Send a new message →
                  </Link>
                </div>
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You haven't sent any contact requests yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 space-y-0">
                    {messages.map((m) => (
                      <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="font-semibold text-gray-900">{m.subject}</p>
                          {m.status && <StatusBadge status={m.status} />}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(m.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'quotes') {
      return (
        <SectionCard title="My Quotes" icon={docIcon} iconBg="bg-amber-50" iconColor="text-amber-600">
          {quoteSuccessMessage && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {quoteSuccessMessage}
            </div>
          )}
          {dataLoading ? (
            <LoadingState label="Loading your quotes..." />
          ) : quotes.length === 0 ? (
            <EmptyState
              icon={docIcon}
              title="No quotes yet"
              message="Ready to get started? Request a quote and we'll send you a tailored estimate for your project—usually within 24 hours."
              action={<Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm">Request a quote</Link>}
            />
          ) : (
            <div className="space-y-6">
              {quotes.map((q) => (
                <div key={q.id} className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{q.title || 'Quote'}</h3>
                    <StatusBadge status={q.status} label={q.status === 'pending' ? 'Pending' : q.status === 'replied' ? 'Replied' : q.status === 'approved' ? 'Approved' : q.status === 'declined' ? 'Declined' : q.status === 'paid' ? 'Paid' : q.status} />
                  </div>
                  {q.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{q.description}</p>
                  )}
                  {Array.isArray(q.item_breakdown) && q.item_breakdown.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Item breakdown</p>
                      <ul className="space-y-1">
                        {q.item_breakdown.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm text-gray-700">
                            <span>{item.description}</span>
                            {item.amount != null && <span>{formatCurrency(item.amount)}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {q.total_price != null && (
                    <p className="text-base font-semibold text-gray-900 mb-3">Total: {formatCurrency(q.total_price)}</p>
                  )}
                  {q.admin_response && (
                    <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">Our response</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.admin_response}</p>
                      {q.responded_at && <p className="text-xs text-gray-500 mt-2">Responded {formatDateTime(q.responded_at)}</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>Submitted {formatDate(q.created_at)}</span>
                    {q.responded_at && q.admin_response && <span>· Responded {formatDate(q.responded_at)}</span>}
                  </div>
                  {q.status === 'replied' && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuoteApprove(q.id)}
                        disabled={quoteActionLoading === q.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {quoteActionLoading === q.id ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuoteDecline(q.id)}
                        disabled={quoteActionLoading === q.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {quoteActionLoading === q.id ? 'Updating...' : 'Decline'}
                      </button>
                    </div>
                  )}
                  {(q.status === 'approved' || q.status === 'Approved') && (
                    <div className="mt-4">
                      <Link
                        to={`/payment/${q.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--aws-orange)] text-white text-sm font-semibold hover:bg-[var(--aws-orange-hover)] transition-colors"
                      >
                        Pay now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </Link>
                      <p className="text-xs text-[#545b64] mt-2">Complete payment to generate your invoice and create your project.</p>
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <Link to="/request-quote" className="text-sm font-medium text-amber-600 hover:text-amber-800">Request a new quote →</Link>
              </div>
            </div>
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'invoices') {
      return (
        <SectionCard title="My Invoices" icon={docIcon} iconBg="bg-green-50" iconColor="text-green-600">
          {dataLoading ? (
            <LoadingState label="Loading your invoices..." />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={docIcon}
              title="No invoices yet"
              message="Invoices appear here once your quote has been approved. Head to the portal to track your quote status—we'll notify you when it's ready."
              action={<Link to="/portal" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors">View portal</Link>}
            />
          ) : (
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due date</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{inv.invoice_number || inv.id}</td>
                      <td className="px-4 sm:px-6 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'projects') {
      return (
        <SectionCard title="My Projects" icon={projectIcon} iconBg="bg-purple-50" iconColor="text-purple-600">
          {dataLoading ? (
            <LoadingState label="Loading your projects..." />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={projectIcon}
              title="No projects yet"
              message="Your projects will show up here once work begins. In the meantime, you can request a quote or view your invoices in the portal."
              action={<Link to="/portal" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm">View portal</Link>}
            />
          ) : (
            <div className="space-y-6">
              {activeProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />Active
                  </h3>
                  <div className="space-y-2">
                    {activeProjects.map((p) => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
                        <span className="font-semibold text-gray-900">{p.name || p.quote_project_title || 'Project'}</span>
                        <StatusBadge status={p.status} label={p.status === 'in_progress' ? 'In Progress' : 'Pending'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {completedProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />Completed
                  </h3>
                  <div className="space-y-2">
                    {completedProjects.map((p) => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
                        <span className="font-semibold text-gray-900">{p.name || p.quote_project_title || 'Project'}</span>
                        <StatusBadge status="completed" label="Completed" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <Link to="/my-projects" className="text-sm font-medium text-purple-600 hover:text-purple-800">View all projects →</Link>
              </div>
            </div>
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'testimonials') {
      return (
        <SectionCard title="Testimonials" icon={starIcon} iconBg="bg-amber-50" iconColor="text-amber-600">
          {dataLoading ? (
            <LoadingState label="Loading your testimonials..." />
          ) : testimonials.length === 0 ? (
            <EmptyState
              icon={starIcon}
              title="Share your experience"
              message="Your feedback helps others discover what we do. Submit a testimonial and we'll review it before publishing—thank you for taking the time!"
              action={<Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm">Submit a testimonial</Link>}
            />
          ) : (
            <ul className="divide-y divide-gray-100 space-y-0">
              {testimonials.map((t) => (
                <li key={t.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <p className="font-medium text-gray-900 line-clamp-2">{t.testimonial}</p>
                    <StatusBadge status={t.is_approved ? 'approved' : 'pending'} label={t.is_approved ? 'Approved' : 'Pending'} />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{t.rating} stars · {formatDate(t.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'settings') {
      const avatarUrl = user?.avatar_url || (user?.avatar && getMediaUrl(user.avatar));
      return (
        <div className={SPACING.section}>
          {/* Account Info (read-only) */}
          <SectionCard title="Account information" icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" iconBg="bg-slate-100" iconColor="text-slate-600">
            <dl className={`grid grid-cols-1 sm:grid-cols-2 ${SPACING.cardGap}`}>
              <div className="p-4 rounded-xl bg-gray-50">
                <dt className="text-sm font-medium text-gray-500">Date joined</dt>
                <dd className="mt-1 font-semibold text-gray-900">{formatDateTime(user?.date_joined)}</dd>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <dt className="text-sm font-medium text-gray-500">Last login</dt>
                <dd className="mt-1 font-semibold text-gray-900">{user?.last_login ? formatDateTime(user.last_login) : '—'}</dd>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Email verification</dt>
                <dd className="mt-1 font-semibold text-gray-900">{user?.email_verified ? 'Verified' : 'Not verified'}</dd>
              </div>
            </dl>
          </SectionCard>

          {/* Profile (personal info + avatar) */}
          <SectionCard title="Profile" icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" iconBg="bg-blue-50" iconColor="text-blue-600">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {profileSaveMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${profileSaveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {profileSaveMessage.text}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center sm:items-start gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">{user?.first_name?.charAt(0) || user?.email?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                    {avatarFile ? 'Change photo' : 'Upload photo'}
                  </label>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))} className="input-professional w-full" placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))} className="input-professional w-full" placeholder="Last name" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} rows={3} className="input-professional w-full" placeholder="Short bio (optional)" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={profileSaveLoading} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {profileSaveLoading ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </SectionCard>

          {/* Security: Change password */}
          <SectionCard title="Security — Change password" icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" iconBg="bg-amber-50" iconColor="text-amber-600">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {passwordMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))} className="input-professional w-full" placeholder="Current password" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))} className="input-professional w-full" placeholder="New password" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                <input type="password" value={passwordForm.confirm_new_password} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm_new_password: e.target.value }))} className="input-professional w-full" placeholder="Confirm new password" required />
              </div>
              <button type="submit" disabled={passwordLoading} className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
                {passwordLoading ? 'Updating...' : 'Change password'}
              </button>
            </form>
          </SectionCard>

          {/* Security: Change email */}
          <SectionCard title="Security — Change email" icon="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" iconBg="bg-violet-50" iconColor="text-violet-600">
            <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
              {emailMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${emailMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {emailMessage.text}
                </div>
              )}
              <p className="text-sm text-gray-600">Current email: <strong>{user?.email}</strong></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New email</label>
                <input type="email" value={emailForm.new_email} onChange={(e) => setEmailForm((p) => ({ ...p, new_email: e.target.value }))} className="input-professional w-full" placeholder="New email address" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your password (to confirm)</label>
                <input type="password" value={emailForm.password} onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))} className="input-professional w-full" placeholder="Password" required />
              </div>
              <button type="submit" disabled={emailLoading} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                {emailLoading ? 'Updating...' : 'Change email'}
              </button>
            </form>
          </SectionCard>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex bg-[var(--aws-content-bg)]">
      {/* AWS-style dark sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 bg-[var(--aws-dark)] text-white">
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 text-white hover:opacity-90">
            <img src="/pathycode-logo.png" alt="PathyCode" className="h-8 w-auto" />
            <span className="font-semibold text-sm">Client profile</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--aws-orange)] text-white'
                  : 'text-[#d5dbdb] hover:bg-[var(--aws-dark-hover)] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-[#d5dbdb]">
            <p className="font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="truncate opacity-90">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Breadcrumb + mobile nav */}
        <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <nav className="flex items-center gap-2 text-sm text-[#545b64]">
              <Link to="/" className="hover:text-[var(--aws-orange)]">Home</Link>
              <span aria-hidden>/</span>
              <span className="text-[var(--aws-dark)] font-medium">Profile</span>
              <span aria-hidden>/</span>
              <span className="text-[var(--aws-dark)]">{TABS.find((t) => t.id === activeTab)?.label ?? 'Overview'}</span>
            </nav>
            {/* Mobile tab dropdown / pills */}
            <div className="flex lg:hidden gap-1 overflow-x-auto pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium shrink-0 ${
                    activeTab === tab.id ? 'bg-[var(--aws-orange)] text-white' : 'bg-[#f4f4f4] text-[#545b64] hover:bg-[#e8e8e8]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
          {error && (
            <div className="mb-6 p-4 bg-[#fff4e5] border border-[#ffb366] flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 rounded bg-[#ffb366] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-[var(--aws-dark)]">Something went wrong</p>
                  <p className="text-[#545b64] text-sm mt-0.5">{error}</p>
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--aws-dark)] text-white text-sm font-medium hover:bg-[var(--aws-dark-hover)] shrink-0">
                Try again
              </button>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--aws-dark)]">
              {activeTab === 'overview' ? `Welcome, ${user?.first_name || 'there'}` : TABS.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-[#545b64] mt-1">
              {activeTab === 'overview'
                ? 'Your account overview, outstanding payments, and quick links.'
                : `Manage your ${(TABS.find((t) => t.id === activeTab)?.label ?? '').toLowerCase()}.`}
            </p>
            {activeTab === 'overview' && (
              <div className="mt-4 p-4 bg-[#f8fafc] border border-[var(--aws-card-border)] rounded-lg">
                <p className="text-sm text-[#475569] leading-relaxed">
                  Here you can view your details and summary, pay any approved quotes, and use the quick links below. Click the coloured summary boxes or the menu on the left to open Messages, Quotes, Invoices, or Projects. Change your name and email under Profile Settings.
                </p>
              </div>
            )}
          </div>

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
