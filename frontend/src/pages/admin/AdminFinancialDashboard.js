import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const formatCurrency = (value) => {
  const n = parseFloat(value);
  if (isNaN(n) || !Number.isFinite(n)) return 'R 0.00';
  return `R ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};
const formatMonth = (key) => {
  if (!key || typeof key !== 'string') return '';
  const [y, m] = key.split('-');
  const yr = parseInt(y, 10);
  const mo = parseInt(m, 10) - 1;
  if (isNaN(yr) || isNaN(mo) || mo < 0 || mo > 11) return key;
  return new Date(yr, mo).toLocaleString('default', { month: 'short', year: 'numeric' });
};

const AdminFinancialDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    total_revenue: 0,
    monthly_revenue: {},
    unpaid_invoices_total: 0,
    overdue_invoices_total: 0,
    active_projects_count: 0,
  });

  const safeNum = (v) => (v != null && !isNaN(parseFloat(v)) ? parseFloat(v) : 0);
  const safeObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/invoices/dashboard/');
      setData(response.data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Access denied' : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true && user.is_staff !== true) {
      navigate('/profile');
      return;
    }
    fetchDashboard();
  }, [isAuthenticated, user, navigate, fetchDashboard]);

  if (loading) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading financial dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (user && user.is_superuser !== true && user.is_staff !== true) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only staff and admin users can access the Financial Dashboard.</p>
            <Link to="/profile" className="inline-block px-5 py-2.5 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors">
              Go to Profile
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-800 font-medium mb-6">{error}</p>
            <button onClick={fetchDashboard} className="px-6 py-2.5 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const monthlyRev = safeObj(data.monthly_revenue);
  const monthlyEntries = Object.entries(monthlyRev)
    .sort((a, b) => (b[0] || '').localeCompare(a[0] || ''))
    .slice(0, 6);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthRevenue = safeNum(monthlyRev[currentMonthKey]);

  const metrics = [
    {
      label: 'Total Revenue',
      value: formatCurrency(safeNum(data.total_revenue)),
      sub: 'All paid invoices',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      bg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      label: 'This Month',
      value: formatCurrency(currentMonthRevenue || 0),
      sub: 'Current month (paid)',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
      bg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      label: 'Unpaid',
      value: formatCurrency(safeNum(data.unpaid_invoices_total)),
      sub: 'Total amount due',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      ),
      bg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: formatCurrency(safeNum(data.overdue_invoices_total)),
      sub: 'Past due date',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      bg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      valueClass: 'text-amber-700',
    },
    {
      label: 'Active Projects',
      value: Math.max(0, parseInt(data.active_projects_count, 10) || 0),
      sub: 'Planning, design, development, testing',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      ),
      bg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
  ];

  return (
    <AdminLayout allowStaff={true}>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Financial Dashboard</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Revenue and financial overview</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={fetchDashboard}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm sm:text-base transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <Link
                to="/admin/invoices"
                className="px-4 py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm sm:text-base transition-all shadow-lg flex items-center gap-2"
              >
                View Invoices
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-lg sm:text-2xl font-bold ${m.valueClass || 'text-gray-900'}`}>{m.value}</p>
                  <p className="text-sm font-medium text-gray-600 mt-0.5">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
                </div>
                <span className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${m.bg}`}>
                  <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${m.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {m.icon}
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>

        {monthlyEntries.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Monthly Revenue</h2>
              <p className="text-sm text-gray-500 mt-0.5">Last 6 months (paid invoices)</p>
            </div>
            <div className="divide-y divide-gray-100">
              {monthlyEntries.map(([monthKey, revenue]) => (
                <div key={monthKey} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50/50 transition-colors">
                  <span className="text-gray-700 font-medium">{formatMonth(monthKey)}</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(safeNum(revenue))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinancialDashboard;
