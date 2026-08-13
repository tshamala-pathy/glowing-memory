import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { PROFILE_IMAGES } from './profileUi';

/**
 * Modern client workspace overview for the Profile page.
 */
const ProfileWorkspace = ({
  user,
  client,
  avatarUrl,
  displayName,
  stats,
  threads,
  quotes,
  invoices,
  projects,
  approvedUnpaidQuotes,
  setActiveTab,
}) => {
  const joinDate = user?.date_joined ? formatDate(user.date_joined) : '—';
  const statItems = [
    { label: 'Projects', value: stats?.total_projects ?? projects.length, color: 'from-violet-500 to-purple-600', tab: 'projects', image: PROFILE_IMAGES.projects },
    { label: 'Quotes', value: stats?.total_quotes ?? quotes.length, color: 'from-amber-500 to-orange-600', tab: 'quotes', image: PROFILE_IMAGES.quotes },
    { label: 'Invoices', value: stats?.total_invoices ?? invoices.length, color: 'from-emerald-500 to-teal-600', tab: 'invoices', image: PROFILE_IMAGES.invoices },
    { label: 'Messages', value: threads?.length ?? 0, color: 'from-sky-500 to-blue-600', tab: 'messages', image: PROFILE_IMAGES.messages },
  ];

  const recentMessages = (threads || []).slice(0, 3);
  const recentProjects = (projects || []).slice(0, 3);
  const recentInvoices = (invoices || []).slice(0, 3);
  const recentQuotes = (quotes || []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Quick stats with image cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statItems.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActiveTab(s.tab)}
            className="group relative overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <img src={s.image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/55 to-slate-900/20" />
            <div className="relative p-4 sm:p-5 min-h-[7.5rem] flex flex-col justify-end">
              <p className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent drop-shadow-sm`}>{s.value}</p>
              <p className="text-sm font-semibold text-white/95 mt-1">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal-800 mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            to="/request-quote"
            className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white hover:border-amber-200 hover:shadow-md transition-all group"
          >
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </span>
            <span className="text-sm font-bold text-slate-800">Request quote</span>
          </Link>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className="flex items-center gap-3 p-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white hover:border-violet-200 hover:shadow-md transition-all group text-left"
          >
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            <span className="text-sm font-bold text-slate-800">View projects</span>
          </button>
          <Link
            to="/contact"
            className="flex items-center gap-3 p-4 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white hover:border-teal-200 hover:shadow-md transition-all group"
          >
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </span>
            <span className="text-sm font-bold text-slate-800">Contact support</span>
          </Link>
        </div>
      </div>

      {/* Client snapshot */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <img src={PROFILE_IMAGES.workspace} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/70 to-teal-900/40" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white/20 shadow-xl">
              {displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0 text-white">
            <p className="text-teal-200 text-xs font-bold uppercase tracking-wider">Your account</p>
            <p className="text-xl font-bold mt-1 truncate">{displayName}</p>
            <p className="text-slate-300 text-sm truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
              <span>Joined {joinDate}</span>
              {client?.name && <span>· {client.name}</span>}
              {client?.industry && <span>· {client.industry}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition backdrop-blur-sm text-white shrink-0"
          >
            Account settings
          </button>
        </div>
      </div>

      {/* Outstanding payments */}
      {approvedUnpaidQuotes?.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Outstanding payments
          </h2>
          <ul className="space-y-2">
            {approvedUnpaidQuotes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl p-3.5 border border-amber-100 shadow-sm">
                <span className="font-semibold text-slate-900">{q.title || q.project_title || `Quote #${q.id}`}</span>
                <Link to={`/payment/${q.id}`} className="text-sm font-bold text-amber-700 hover:text-amber-800">
                  Pay {formatCurrency(q.total_price ?? q.estimated_amount)} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Activity feed */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <ActivityCard title="Recent messages" empty="No conversations yet" onViewAll={() => setActiveTab('messages')} accent="from-sky-600/80 to-blue-800/70">
          {recentMessages.map((t) => (
            <Link key={t.id} to={`/messages/${t.id}`} className="block p-3 rounded-xl hover:bg-teal-50/80 transition-colors">
              <p className="text-sm font-semibold text-slate-900">{t.project_name || `Thread #${t.id}`}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(t.updated_at || t.last_message_at)}</p>
            </Link>
          ))}
        </ActivityCard>
        <ActivityCard title="Recent projects" empty="No projects yet" onViewAll={() => setActiveTab('projects')} accent="from-violet-600/80 to-purple-800/70">
          {recentProjects.map((p) => (
            <Link key={p.id} to={`/portal/projects/${p.id}`} className="block p-3 rounded-xl hover:bg-violet-50/80 transition-colors">
              <p className="text-sm font-semibold text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{p.status?.replace(/_/g, ' ')}</p>
            </Link>
          ))}
        </ActivityCard>
        <ActivityCard title="Recent invoices" empty="No invoices yet" onViewAll={() => setActiveTab('invoices')} accent="from-emerald-600/80 to-teal-800/70">
          {recentInvoices.map((inv) => (
            <div key={inv.id} className="p-3 rounded-xl hover:bg-emerald-50/80 transition-colors">
              <p className="text-sm font-semibold text-slate-900">{inv.invoice_number || `Invoice #${inv.id}`}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(inv.total_amount)} · {inv.status}</p>
            </div>
          ))}
        </ActivityCard>
        <ActivityCard title="Recent quotes" empty="No quotes yet" onViewAll={() => setActiveTab('quotes')} accent="from-amber-500/80 to-orange-700/70">
          {recentQuotes.map((q) => (
            <div key={q.id} className="p-3 rounded-xl hover:bg-amber-50/80 transition-colors">
              <p className="text-sm font-semibold text-slate-900">{q.title || q.project_title || `Quote #${q.id}`}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{q.status}</p>
            </div>
          ))}
        </ActivityCard>
      </div>
    </div>
  );
};

const ActivityCard = ({ title, children, empty, onViewAll, accent }) => {
  const hasItems = React.Children.count(children) > 0;
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden ring-1 ring-slate-900/[0.03]">
      <div className={`relative px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r ${accent}`}>
        <div className="relative flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button type="button" onClick={onViewAll} className="text-xs text-white/90 hover:text-white font-semibold underline-offset-2 hover:underline">
            View all
          </button>
        </div>
      </div>
      <div className="p-2">
        {hasItems ? children : <p className="p-4 text-sm text-slate-500 text-center">{empty}</p>}
      </div>
    </div>
  );
};

export default ProfileWorkspace;
