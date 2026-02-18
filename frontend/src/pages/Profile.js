import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'messages', label: 'My Messages', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'quotes', label: 'My Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'invoices', label: 'My Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'projects', label: 'My Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'testimonials', label: 'Testimonials', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'settings', label: 'Account Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

/** Spacing constants for consistent layout */
const SPACING = {
  section: 'space-y-6',
  cardGap: 'gap-6',
};

/** Status badge: pending (amber), approved/completed (green), rejected/overdue (red), etc. */
const StatusBadge = ({ status, label }) => {
  const variants = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    new: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    replied: 'bg-blue-100 text-blue-800 border-blue-200',
    read: 'bg-slate-100 text-slate-700 border-slate-200',
    sent: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
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

/** Reusable section card with icon and title */
const SectionCard = ({ title, icon, iconBg = 'bg-slate-100', iconColor = 'text-slate-600', children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden ${className}`}>
    <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-gray-50/50">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
        <span className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
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
  <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 flex items-center justify-center mb-5 ring-4 ring-gray-100">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-base max-w-md leading-relaxed mb-6">{message}</p>
    {action}
  </div>
);

/** Loading skeleton for section content */
const LoadingState = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-sm font-medium text-gray-500">{label}</p>
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
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProfile = async () => {
      setDataLoading(true);
      setError('');
      try {
        const { data } = await api.get('/profile/');
        setClient(data.client ?? null);
        setMessages(data.messages ?? []);
        setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setProjects(Array.isArray(data.projects) ? data.projects : []);
        setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
      } catch (err) {
        setError('We couldn\'t load your profile data. Please check your connection and try again.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const msgIcon = 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
  const docIcon = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  const projectIcon = 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
  const starIcon = 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
  const inboxIcon = 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-5" />
          <p className="text-gray-600 font-semibold text-lg">Welcome back! Loading your profile...</p>
          <p className="text-gray-500 text-sm mt-1">This will only take a moment</p>
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
          <SectionCard title="Personal details" icon={TABS[0].icon} iconBg="bg-blue-50" iconColor="text-blue-600">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center ${SPACING.cardGap}`}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg flex-shrink-0">
                {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-lg">{user?.first_name} {user?.last_name}</p>
                <p className="text-gray-600 text-sm mt-0.5">{user?.email}</p>
                {client?.name && <p className="text-gray-600 text-sm mt-0.5">Company: {client.name}</p>}
                {user?.is_superuser && <span className="inline-block mt-2"><StatusBadge status="admin" label="Admin" /></span>}
              </div>
            </div>
          </SectionCard>

          {client && (
            <SectionCard title="Client details" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" iconBg="bg-teal-50" iconColor="text-teal-600">
              <dl className={`grid grid-cols-1 sm:grid-cols-2 ${SPACING.cardGap}`}>
                <div><dt className="text-sm text-gray-500">Company / Name</dt><dd className="font-medium text-gray-900">{client.name}</dd></div>
                {client.industry && <div><dt className="text-sm text-gray-500">Industry</dt><dd className="text-gray-900">{client.industry}</dd></div>}
                {client.description && <div className="sm:col-span-2"><dt className="text-sm text-gray-500">Description</dt><dd className="text-gray-900">{client.description}</dd></div>}
              </dl>
            </SectionCard>
          )}

          <SectionCard title="Summary" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" iconBg="bg-indigo-50" iconColor="text-indigo-600">
            <div className={`grid grid-cols-2 sm:grid-cols-4 ${SPACING.cardGap}`}>
              {[
                { count: messages.length, label: 'Messages', color: 'bg-blue-50 text-blue-700' },
                { count: quotes.length, label: 'Quotes', color: 'bg-amber-50 text-amber-700' },
                { count: invoices.length, label: 'Invoices', color: 'bg-green-50 text-green-700' },
                { count: projects.length, label: 'Projects', color: 'bg-purple-50 text-purple-700' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-4 text-center ${item.color}`}>
                  <p className="text-2xl sm:text-3xl font-bold">{item.count}</p>
                  <p className="text-xs sm:text-sm font-medium mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Quick access" icon="M13 10V3L4 14h7v7l9-11h-7z" iconBg="bg-slate-100" iconColor="text-slate-600">
            <div className="flex flex-wrap gap-3">
              <Link to="/portal" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Client Portal</Link>
              <Link to="/my-projects" className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">My Projects</Link>
              <Link to="/request-quote" className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Request Quote</Link>
              <Link to="/contact" className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Contact</Link>
              {user?.is_superuser && <Link to="/admin" className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm">Admin Dashboard</Link>}
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
          ) : messages.length === 0 ? (
            <EmptyState
              icon={msgIcon}
              title="Your inbox is empty"
              message="You haven't sent any messages yet. Reach out anytime—we're here to help and would love to hear from you."
              action={<Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">Send a message</Link>}
            />
          ) : (
            <ul className="divide-y divide-gray-100 space-y-0">
              {messages.map((m) => (
                <li key={m.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-semibold text-gray-900">{m.subject}</p>
                    {m.status && <StatusBadge status={m.status} />}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{m.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDateTime(m.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'quotes') {
      return (
        <SectionCard title="My Quotes" icon={docIcon} iconBg="bg-amber-50" iconColor="text-amber-600">
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
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimated</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{q.project_title || '—'}</td>
                      <td className="px-4 sm:px-6 py-4"><StatusBadge status={q.status} /></td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{formatCurrency(q.estimated_amount)}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{formatDate(q.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{inv.invoice_number || inv.id}</td>
                      <td className="px-4 sm:px-6 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
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
      return (
        <SectionCard title="Account activity" icon={TABS[6].icon} iconBg="bg-slate-100" iconColor="text-slate-600">
          <dl className={`grid grid-cols-1 sm:grid-cols-2 ${SPACING.cardGap}`}>
            <div className="p-4 rounded-xl bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Account created</dt>
              <dd className="mt-1 font-semibold text-gray-900">{formatDateTime(user?.date_joined)}</dd>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Last login</dt>
              <dd className="mt-1 font-semibold text-gray-900">{user?.last_login ? formatDateTime(user.last_login) : '—'}</dd>
            </div>
          </dl>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2">Profile information</h3>
            <p className="text-sm text-gray-600 leading-relaxed">To update your profile, contact support or use the admin panel if you have admin access. We're here to help!</p>
          </div>
        </SectionCard>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl lg:max-w-5xl mx-auto">
        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-900">Something went wrong</p>
                <p className="text-red-700 text-sm mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shrink-0"
            >
              Try again
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg flex-shrink-0">
              {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{user?.first_name} {user?.last_name}</h1>
              <p className="text-gray-600 text-sm truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm border border-gray-200 text-blue-700'
                  : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-2">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
