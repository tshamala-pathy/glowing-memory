import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency, formatRelativeTime } from '../utils/formatters';

/**
 * Modern SaaS workspace overview for the Profile page.
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
    { label: 'Projects', value: stats?.total_projects ?? projects.length, color: 'from-violet-500 to-purple-600', tab: 'projects' },
    { label: 'Quotes', value: stats?.total_quotes ?? quotes.length, color: 'from-amber-500 to-orange-600', tab: 'quotes' },
    { label: 'Invoices', value: stats?.total_invoices ?? invoices.length, color: 'from-emerald-500 to-teal-600', tab: 'invoices' },
    { label: 'Payments', value: stats?.total_payments ?? 0, color: 'from-blue-500 to-slate-700', tab: 'invoices' },
  ];

  const recentMessages = (threads || []).slice(0, 3);
  const recentProjects = (projects || []).slice(0, 3);
  const recentInvoices = (invoices || []).slice(0, 3);
  const recentQuotes = (quotes || []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero / Profile Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggIGQ9Ik0wIDBoNjB2NjBIMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMzAgMzBtLTUgMGExIDEgMCAxIDAgMTAgMCAxIDEgMCAwMC0xMCAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20">
              {displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-sm font-medium">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 truncate">{displayName}</h1>
            <p className="text-blue-100/80 text-sm mt-1 truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-blue-200/90">
              <span>Joined {joinDate}</span>
              {client?.name && <span>· {client.name}</span>}
              {client?.industry && <span>· {client.industry}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-colors backdrop-blur"
          >
            Account settings
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActiveTab(s.tab)}
            className="group rounded-xl bg-white border border-slate-200 p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <p className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            <p className="text-sm font-medium text-slate-600 mt-1 group-hover:text-slate-900">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/request-quote" className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
            <span className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </span>
            <span className="text-sm font-semibold text-slate-800">Request Quote</span>
          </Link>
          <button type="button" onClick={() => setActiveTab('projects')} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 transition-colors group text-left">
            <span className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            <span className="text-sm font-semibold text-slate-800">View Projects</span>
          </button>
          <Link to="/contact" className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
            <span className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </span>
            <span className="text-sm font-semibold text-slate-800">Contact Support</span>
          </Link>
        </div>
      </div>

      {/* Outstanding payments */}
      {approvedUnpaidQuotes?.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
          <h2 className="text-sm font-semibold text-amber-900 mb-3">Outstanding payments</h2>
          <ul className="space-y-2">
            {approvedUnpaidQuotes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg p-3 border border-amber-100">
                <span className="font-medium text-slate-900">{q.title || q.project_title || `Quote #${q.id}`}</span>
                <Link to={`/payment/${q.id}`} className="text-sm font-semibold text-blue-700 hover:underline">
                  Pay {formatCurrency(q.total_price ?? q.estimated_amount)} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Activity feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityCard title="Recent messages" empty="No conversations yet" onViewAll={() => setActiveTab('messages')}>
          {recentMessages.map((t) => (
            <Link key={t.id} to={`/messages/${t.id}`} className="block p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">{t.project_name || `Thread #${t.id}`}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(t.updated_at)}</p>
            </Link>
          ))}
        </ActivityCard>
        <ActivityCard title="Recent projects" empty="No projects yet" onViewAll={() => setActiveTab('projects')}>
          {recentProjects.map((p) => (
            <Link key={p.id} to={`/portal/projects/${p.id}`} className="block p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{p.status?.replace(/_/g, ' ')}</p>
            </Link>
          ))}
        </ActivityCard>
        <ActivityCard title="Recent invoices" empty="No invoices yet" onViewAll={() => setActiveTab('invoices')}>
          {recentInvoices.map((inv) => (
            <div key={inv.id} className="p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">{inv.invoice_number || `Invoice #${inv.id}`}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(inv.total_amount)} · {inv.status}</p>
            </div>
          ))}
        </ActivityCard>
        <ActivityCard title="Recent quotes" empty="No quotes yet" onViewAll={() => setActiveTab('quotes')}>
          {recentQuotes.map((q) => (
            <div key={q.id} className="p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">{q.title || q.project_title || `Quote #${q.id}`}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{q.status}</p>
            </div>
          ))}
        </ActivityCard>
      </div>
    </div>
  );
};

const ActivityCard = ({ title, children, empty, onViewAll }) => {
  const hasItems = React.Children.count(children) > 0;
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/80">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button type="button" onClick={onViewAll} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
      </div>
      <div className="p-2">
        {hasItems ? children : <p className="p-4 text-sm text-slate-500 text-center">{empty}</p>}
      </div>
    </div>
  );
};

export default ProfileWorkspace;
