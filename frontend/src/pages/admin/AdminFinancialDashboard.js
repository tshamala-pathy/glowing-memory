import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [isAuthenticated, user, navigate]);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const response = await api.get('/invoices/dashboard/');
      setData(response.data);
    } catch (err) {
      console.error('Error fetching financial dashboard:', err);
      setError(err.response?.status === 403 ? 'Access denied' : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading financial dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (user && user.is_superuser !== true && user.is_staff !== true) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only staff and admin users can access the Financial Dashboard.</p>
          <Link to="/profile" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Profile
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (value) => `R ${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const formatMonth = (key) => {
    const [y, m] = key.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const monthlyEntries = Object.entries(data.monthly_revenue).sort((a, b) => b[0].localeCompare(a[0]));
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthRevenue = data.monthly_revenue[currentMonthKey] || 0;

  return (
    <AdminLayout allowStaff={true}>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-600 mt-1">Revenue and financial overview</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Refresh
            </button>
            <Link
              to="/admin/invoices"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Invoices
            </Link>
          </div>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.total_revenue)}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Total Revenue</div>
            <p className="text-xs text-gray-400 mt-2">All paid invoices</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(currentMonthRevenue)}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Monthly Revenue</div>
            <p className="text-xs text-gray-400 mt-2">This month (paid invoices)</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.unpaid_invoices_total)}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Unpaid Invoices</div>
            <p className="text-xs text-gray-400 mt-2">Total amount due</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(data.overdue_invoices_total)}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Overdue Invoices</div>
            <p className="text-xs text-gray-400 mt-2">Past due date</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.active_projects_count}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Active Projects</div>
            <p className="text-xs text-gray-400 mt-2">Pending + In progress</p>
          </div>
        </div>

        {/* Monthly revenue breakdown */}
        {monthlyEntries.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue (Last 6 Months)</h2>
            <div className="space-y-3">
              {monthlyEntries.map(([monthKey, revenue]) => (
                <div key={monthKey} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700 font-medium">{formatMonth(monthKey)}</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(revenue)}</span>
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
