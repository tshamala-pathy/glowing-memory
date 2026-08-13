import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  ADMIN_INPUT_CLASS,
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminRefreshButton,
  AdminTableWrap,
} from '../../components/admin/adminPageUi';
import { formatDate, formatDateTime } from '../../utils/formatters';
import api from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1554224225-6726b3ff858f?auto=format&fit=crop&w=1920&q=85';

const PERIOD_OPTIONS = [
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'Year to date' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

const FUNNEL_LINKS = {
  pending: '/admin/quotes?status=pending',
  reviewed: '/admin/quotes?status=reviewed',
  approved: '/admin/quotes?status=approved',
  paid: '/admin/quotes?status=paid',
};

/** Saved dashboard layouts — filter which widget groups are visible. */
const SAVED_VIEWS = {
  full: {
    label: 'Full dashboard',
    sections: ['all'],
    period: null,
  },
  month_end: {
    label: 'Month-end close',
    sections: ['revenue', 'vat', 'collections', 'monthly_chart', 'recent', 'smart'],
    period: 'month',
  },
  collections: {
    label: 'Collections focus',
    sections: ['collections', 'payment_followups', 'upcoming', 'aging', 'needs_attention', 'client_health', 'forecast', 'reconciliation', 'finance_activity'],
    period: 'month',
  },
  sales_pipeline: {
    label: 'Sales pipeline',
    sections: ['funnel', 'pipeline', 'service_type', 'smart'],
    period: 'quarter',
  },
};

const HEALTH_STYLES = {
  green: { badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  amber: { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  red: { badge: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
};

/** One left-border accent per section — cards stay white; slate only. */
const SECTION_ACCENTS = {
  revenue: 'border-l-slate-900',
  smart: 'border-l-slate-700',
  collections: 'border-l-slate-600',
  vat: 'border-l-slate-500',
  pipeline: 'border-l-slate-800',
};

const SECTION_BAND_DOT = {
  revenue: 'bg-slate-900',
  smart: 'bg-slate-700',
  collections: 'bg-slate-600',
  vat: 'bg-slate-500',
  pipeline: 'bg-slate-800',
};

const FUNNEL_STAGE_BAR = {
  pending: 'bg-slate-400',
  reviewed: 'bg-slate-500',
  approved: 'bg-slate-600',
  paid: 'bg-slate-900',
};

const sectionStat = (section, stat, { primary = false } = {}) => {
  if (primary) {
    return {
      tone: 'bg-slate-900 text-white border border-slate-800 shadow-sm',
      iconBg: 'bg-white/15',
      ...stat,
    };
  }
  const accent = SECTION_ACCENTS[section] || SECTION_ACCENTS.revenue;
  return {
    tone: `bg-white border border-slate-200 border-l-4 ${accent} shadow-sm`,
    iconBg: 'bg-slate-100 text-slate-600',
    ...stat,
  };
};

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

const formatPct = (value) => {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
};

const pctSublabel = (value, label) => {
  const formatted = formatPct(value);
  if (!formatted) return null;
  return `${formatted} ${label}`;
};

const EMPTY_DATA = {
  period: 'month',
  period_label: '',
  total_revenue: 0,
  yearly_revenue: 0,
  monthly_revenue: {},
  monthly_revenue_detail: [],
  current_month_revenue: 0,
  revenue_mom_change_pct: null,
  revenue_yoy_change_pct: null,
  vat_summary: {
    vat_collected: 0,
    vat_ytd: 0,
    subtotal_collected: 0,
    total_collected: 0,
    paid_invoice_count: 0,
  },
  quote_funnel: { total: 0, stages: [], conversion_rates: {}, ancillary: {} },
  revenue_by_service_type: [],
  reconciliation: { mismatch_count: 0, items: [] },
  smart_metrics: { dso_days: null, revenue_per_active_project: null, active_projects_count: 0 },
  client_health: [],
  cash_forecast: { horizon_days: 30, expected_total: 0, item_count: 0, items: [] },
  upcoming_days: 14,
  upcoming_due: [],
  unpaid_invoices_total: 0,
  unpaid_invoices_count: 0,
  overdue_invoices_total: 0,
  overdue_invoices_count: 0,
  paid_invoices_count: 0,
  partially_paid_count: 0,
  partially_paid_total: 0,
  average_invoice_value: 0,
  average_days_to_paid: null,
  collection_rate_pct: 0,
  overdue_aging: {
    days_0_30: { count: 0, amount: 0 },
    days_31_60: { count: 0, amount: 0 },
    days_60_plus: { count: 0, amount: 0 },
  },
  payments: {
    paid_this_month_count: 0,
    paid_this_month_total: 0,
    pending_count: 0,
    pending_total: 0,
    failed_count: 0,
    failed_total: 0,
    success_rate_pct: 0,
  },
  pipeline: {
    approved_unpaid_quotes_count: 0,
    approved_unpaid_quotes_total: 0,
  },
  active_projects_count: 0,
  top_clients: [],
  needs_attention: [],
  payment_followups: [],
  finance_activity: [],
  recent_collections: [],
};

const SectionBand = ({ bandKey, title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2.5">
      <span
        className={`w-1 h-5 rounded-full shrink-0 ${SECTION_BAND_DOT[bandKey] || 'bg-slate-400'}`}
        aria-hidden
      />
      {title}
    </h3>
    {children}
  </div>
);

const SectionCard = ({ title, subtitle, children, action, sectionId }) => (
  <div
    data-section={sectionId}
    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
  >
    <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3 bg-slate-50/50">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <div className="text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wide">
          {action}
        </div>
      )}
    </div>
    {children}
  </div>
);

const POST_ACTION_KEYS = new Set([
  'send_reminder',
  'mark_contacted',
  'send_payment_reminder',
  'mark_quote_contacted',
]);

const DashboardActionButtons = ({ actions, actionBusy, onAction }) => {
  if (!actions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {actions.map((action) =>
        action.href && !POST_ACTION_KEYS.has(action.key) ? (
          <Link
            key={action.key}
            to={action.href}
            target={action.external ? '_blank' : undefined}
            rel={action.external ? 'noopener noreferrer' : undefined}
            className="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
          >
            {action.label}
          </Link>
        ) : (
          <button
            key={action.key}
            type="button"
            disabled={actionBusy === action.key + action.url}
            onClick={() => onAction(action)}
            className="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {actionBusy === action.key + action.url ? 'Working…' : action.label}
          </button>
        )
      )}
    </div>
  );
};

const followupBadgeClass = (type) => {
  if (type === 'failed_payment') return 'bg-rose-100 text-rose-800';
  if (type === 'overdue_invoice') return 'bg-orange-100 text-orange-800';
  if (type === 'pending_invoice') return 'bg-amber-100 text-amber-800';
  if (type === 'approved_quote') return 'bg-indigo-100 text-indigo-800';
  return 'bg-slate-100 text-slate-700';
};

const followupBadgeLabel = (type) => {
  if (type === 'failed_payment') return 'Failed payment';
  if (type === 'overdue_invoice') return 'Overdue';
  if (type === 'pending_invoice') return 'Pending invoice';
  if (type === 'approved_quote') return 'Approved — awaiting payment';
  return type;
};

const RevenueBarChart = ({ rows, formatCurrency, safeNum }) => {
  if (!rows?.length) return null;
  const chartRows = [...rows].reverse().slice(-8);
  const max = Math.max(...chartRows.map((r) => safeNum(r.revenue)), 1);
  return (
    <div className="px-5 sm:px-6 py-5 flex items-end gap-2 sm:gap-3 h-44">
      {chartRows.map((row) => {
        const heightPct = Math.max((safeNum(row.revenue) / max) * 100, row.revenue ? 6 : 0);
        return (
          <div key={row.month} className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0">
            <span className="text-[10px] font-semibold text-slate-700 tabular-nums truncate w-full text-center">
              {formatCurrency(safeNum(row.revenue)).replace('R ', 'R')}
            </span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-slate-700 to-slate-500 transition-all"
              style={{ height: `${heightPct}%`, minHeight: row.revenue ? '4px' : 0 }}
              title={`${row.month}: ${formatCurrency(safeNum(row.revenue))}`}
            />
            <span className="text-[10px] text-slate-500 truncate w-full text-center">{formatMonth(row.month)}</span>
          </div>
        );
      })}
    </div>
  );
};

const AdminFinancialDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [upcomingDays, setUpcomingDays] = useState(14);
  const [savedView, setSavedView] = useState('full');
  const [actionBusy, setActionBusy] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const safeNum = (v) => (v != null && !isNaN(parseFloat(v)) ? parseFloat(v) : 0);

  const isSectionVisible = (sectionKey) => {
    const view = SAVED_VIEWS[savedView] || SAVED_VIEWS.full;
    return view.sections.includes('all') || view.sections.includes(sectionKey);
  };

  const buildQueryParams = useCallback(() => {
    const params = { period, upcoming_days: upcomingDays };
    if (period === 'custom' && customStart && customEnd) {
      params.start = customStart;
      params.end = customEnd;
    }
    return params;
  }, [period, customStart, customEnd, upcomingDays]);

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      if (period === 'custom' && (!customStart || !customEnd)) return;
      try {
        setError(null);
        if (isRefresh) setRefreshing(true);
        const response = await api.get('/invoices/dashboard/', { params: buildQueryParams() });
        setData({ ...EMPTY_DATA, ...response.data });
      } catch (err) {
        setError(err.response?.status === 403 ? 'Access denied' : 'Failed to load dashboard');
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [buildQueryParams, period, customStart, customEnd, upcomingDays]
  );

  const handleExport = async (exportType) => {
    if (period === 'custom' && (!customStart || !customEnd)) return;
    try {
      setExporting(true);
      const params = { ...buildQueryParams(), export: exportType };
      const isCsv = exportType === 'csv';
      const response = await api.get('/invoices/dashboard/', {
        params,
        responseType: 'blob',
      });
      const mime = isCsv ? 'text/csv;charset=utf-8' : 'application/pdf';
      const filename = isCsv ? 'financial-dashboard-accountant.csv' : 'financial-dashboard.pdf';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Failed to export ${exportType === 'csv' ? 'CSV' : 'PDF'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDashboardAction = async (action) => {
    if (action.href && !POST_ACTION_KEYS.has(action.key)) {
      if (action.external) {
        window.open(action.href, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (!action.url) return;
    try {
      setError(null);
      setActionBusy(action.key + action.url);
      const response = await api.post(action.url);
      setSuccessMessage(response.data?.detail || `${action.label} recorded.`);
      await fetchDashboard(true);
    } catch (err) {
      setSuccessMessage(null);
      const detail = err.response?.data?.detail
        || err.response?.data?.error
        || (typeof err.response?.data === 'string' ? err.response.data : null)
        || err.message;
      setError(detail || `Action failed: ${action.label}`);
    } finally {
      setActionBusy(null);
    }
  };

  const applySavedView = (viewKey) => {
    setSavedView(viewKey);
    const view = SAVED_VIEWS[viewKey];
    if (view?.period) setPeriod(view.period);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true && user.is_staff !== true) {
      navigate('/profile');
      return;
    }
    if (period === 'custom' && (!customStart || !customEnd)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDashboard();
  }, [isAuthenticated, user, navigate, fetchDashboard, period, customStart, customEnd, upcomingDays]);

  const monthlyDetail = useMemo(() => {
    if (Array.isArray(data.monthly_revenue_detail) && data.monthly_revenue_detail.length) {
      return data.monthly_revenue_detail;
    }
    return Object.entries(data.monthly_revenue || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, revenue]) => ({ month, revenue, change_pct: null }));
  }, [data.monthly_revenue_detail, data.monthly_revenue]);

  if (loading) {
    return (
      <AdminLayout allowStaff={true}>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  if (user && user.is_superuser !== true && user.is_staff !== true) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only staff and admin users can access the Financial Dashboard.</p>
            <Link
              to="/profile"
              className="inline-block px-5 py-2.5 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
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
            <button
              type="button"
              onClick={() => fetchDashboard()}
              className="px-6 py-2.5 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const aging = data.overdue_aging || EMPTY_DATA.overdue_aging;
  const payments = data.payments || EMPTY_DATA.payments;
  const pipeline = data.pipeline || EMPTY_DATA.pipeline;
  const vat = data.vat_summary || EMPTY_DATA.vat_summary;
  const funnel = data.quote_funnel || EMPTY_DATA.quote_funnel;
  const conversion = funnel.conversion_rates || {};
  const ancillary = funnel.ancillary || {};
  const smart = data.smart_metrics || EMPTY_DATA.smart_metrics;
  const reconciliation = data.reconciliation || EMPTY_DATA.reconciliation;
  const forecast = data.cash_forecast || EMPTY_DATA.cash_forecast;
  const periodLabel = data.period_label || 'This month';
  const revenueLabel = period === 'all' ? 'Total revenue' : 'Period revenue';
  const upcomingHorizon = data.upcoming_days || upcomingDays;

  const revenueStats = [
    sectionStat('revenue', {
      label: revenueLabel,
      value: formatCurrency(safeNum(data.total_revenue)),
      sublabel: periodLabel,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/admin/invoices?status=paid',
    }, { primary: true }),
    sectionStat('revenue', {
      label: 'Year to date',
      value: formatCurrency(safeNum(data.yearly_revenue)),
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    }),
    sectionStat('revenue', {
      label: 'This month',
      value: formatCurrency(safeNum(data.current_month_revenue)),
      sublabel: pctSublabel(data.revenue_mom_change_pct, 'vs last month'),
      sublabelClass: Number(data.revenue_mom_change_pct) >= 0 ? 'text-emerald-600' : 'text-rose-600',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    }),
    sectionStat('revenue', {
      label: 'Avg invoice',
      value: formatCurrency(safeNum(data.average_invoice_value)),
      sublabel: data.average_days_to_paid != null ? `${data.average_days_to_paid} days to paid` : null,
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    }),
  ];

  const collectionsStats = [
    sectionStat('collections', {
      label: 'Outstanding',
      value: formatCurrency(safeNum(data.unpaid_invoices_total)),
      sublabel: `${data.unpaid_invoices_count || 0} open invoices`,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      href: '/admin/invoices?status=unpaid',
    }),
    sectionStat('collections', {
      label: 'Overdue',
      value: formatCurrency(safeNum(data.overdue_invoices_total)),
      sublabel: `${data.overdue_invoices_count || 0} overdue`,
      valueClass: 'text-rose-700',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/admin/invoices?due=overdue',
    }),
    sectionStat('collections', {
      label: 'Partially paid',
      value: formatCurrency(safeNum(data.partially_paid_total)),
      sublabel: `${data.partially_paid_count || 0} invoices`,
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      href: '/admin/invoices?status=unpaid',
    }),
    sectionStat('collections', {
      label: 'Collection rate',
      value: `${safeNum(data.collection_rate_pct).toFixed(1)}%`,
      sublabel: `${data.paid_invoices_count || 0} paid in period`,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/admin/invoices?status=paid',
    }),
  ];

  const pipelineStats = [
    sectionStat('pipeline', {
      label: 'Quote pipeline',
      value: formatCurrency(safeNum(pipeline.approved_unpaid_quotes_total)),
      sublabel: `${pipeline.approved_unpaid_quotes_count || 0} approved awaiting payment`,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      href: '/admin/quotes?status=approved',
    }),
    sectionStat('pipeline', {
      label: 'Paid this month',
      value: formatCurrency(safeNum(payments.paid_this_month_total)),
      sublabel: `${payments.paid_this_month_count || 0} PayFast payments`,
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    }),
    sectionStat('pipeline', {
      label: 'Pending payments',
      value: formatCurrency(safeNum(payments.pending_total)),
      sublabel: `${payments.pending_count || 0} in progress`,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    }),
    sectionStat('pipeline', {
      label: 'Failed payments',
      value: formatCurrency(safeNum(payments.failed_total)),
      sublabel: `${payments.success_rate_pct ?? 0}% success rate`,
      valueClass: 'text-rose-700',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    }),
  ];

  const vatStats = [
    sectionStat('vat', {
      label: 'VAT collected',
      value: formatCurrency(safeNum(vat.vat_collected)),
      sublabel: `${vat.paid_invoice_count || 0} paid invoices`,
      icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
      href: '/admin/invoices?status=paid',
    }),
    sectionStat('vat', {
      label: 'Subtotal (ex VAT)',
      value: formatCurrency(safeNum(vat.subtotal_collected)),
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    }),
    sectionStat('vat', {
      label: 'Gross collected',
      value: formatCurrency(safeNum(vat.total_collected)),
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }, { primary: true }),
    sectionStat('vat', {
      label: 'VAT YTD',
      value: formatCurrency(safeNum(vat.vat_ytd)),
      sublabel: 'Year to date',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      href: '/admin/invoices?status=paid',
    }),
    sectionStat('vat', {
      label: 'Expected (30d)',
      value: formatCurrency(safeNum(forecast.expected_total)),
      sublabel: `${forecast.item_count || 0} items`,
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    }),
    sectionStat('vat', {
      label: 'Upcoming due',
      value: data.upcoming_due?.length || 0,
      sublabel: `Next ${upcomingHorizon} days`,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      href: '/admin/invoices?due=upcoming',
    }),
  ];

  const smartStats = [
    sectionStat('smart', {
      label: 'DSO',
      value: smart.dso_days != null ? `${smart.dso_days} days` : '—',
      sublabel: 'Days sales outstanding',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    }),
    sectionStat('smart', {
      label: 'Rev / active project',
      value: smart.revenue_per_active_project != null
        ? formatCurrency(safeNum(smart.revenue_per_active_project))
        : '—',
      sublabel: `${smart.active_projects_count || 0} active projects`,
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    }),
    sectionStat('smart', {
      label: 'Avg days to paid',
      value: smart.average_days_to_paid != null ? `${smart.average_days_to_paid} days` : '—',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    }),
    sectionStat('smart', {
      label: 'Reconciliation',
      value: reconciliation.mismatch_count || 0,
      sublabel: 'PayFast ↔ invoice mismatches',
      valueClass: reconciliation.mismatch_count ? 'text-rose-700' : undefined,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    }),
  ];

  const agingCards = [
    { key: 'days_0_30', label: '1–30 days', tone: 'bg-white border border-slate-200', text: 'text-slate-800' },
    { key: 'days_31_60', label: '31–60 days', tone: 'bg-white border border-slate-300', text: 'text-slate-800' },
    { key: 'days_60_plus', label: '60+ days', tone: 'bg-white border border-slate-400', text: 'text-slate-900' },
  ];

  const funnelMax = Math.max(...(funnel.stages || []).map((s) => s.count), 1);

  return (
    <AdminLayout allowStaff={true}>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Finance"
          title="Financial Dashboard"
          description={`Revenue, collections, pipeline, and payment health · ${periodLabel}`}
          primaryAction={
            <div className="flex flex-wrap gap-2">
              <AdminRefreshButton onClick={() => fetchDashboard(true)} refreshing={refreshing} />
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting || (period === 'custom' && (!customStart || !customEnd))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm shadow-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting…' : 'Export PDF'}
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={exporting || (period === 'custom' && (!customStart || !customEnd))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          }
          secondaryAction={
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/invoices"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm shadow-md hover:bg-slate-50 transition-colors"
              >
                Invoices
              </Link>
              <Link
                to="/admin/quotes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Quotes
              </Link>
            </div>
          }
        />

        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm px-5 sm:px-6 py-4 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px]">
              <label htmlFor="dashboard-view" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Saved view
              </label>
              <select
                id="dashboard-view"
                value={savedView}
                onChange={(e) => applySavedView(e.target.value)}
                className={`${ADMIN_INPUT_CLASS} !mt-0`}
              >
                {Object.entries(SAVED_VIEWS).map(([key, view]) => (
                  <option key={key} value={key}>
                    {view.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label htmlFor="dashboard-period" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Date range
              </label>
              <select
                id="dashboard-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={`${ADMIN_INPUT_CLASS} !mt-0`}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label htmlFor="dashboard-upcoming" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Upcoming due
              </label>
              <select
                id="dashboard-upcoming"
                value={upcomingDays}
                onChange={(e) => setUpcomingDays(Number(e.target.value))}
                className={`${ADMIN_INPUT_CLASS} !mt-0`}
              >
                <option value={7}>Next 7 days</option>
                <option value={14}>Next 14 days</option>
              </select>
            </div>
            {period === 'custom' && (
              <>
                <div>
                  <label htmlFor="dashboard-start" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    From
                  </label>
                  <input
                    id="dashboard-start"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={`${ADMIN_INPUT_CLASS} !mt-0`}
                  />
                </div>
                <div>
                  <label htmlFor="dashboard-end" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    To
                  </label>
                  <input
                    id="dashboard-end"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={`${ADMIN_INPUT_CLASS} !mt-0`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchDashboard()}
                  disabled={!customStart || !customEnd}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  Apply
                </button>
              </>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start justify-between gap-3">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs uppercase shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {isSectionVisible('revenue') && (
        <SectionBand bandKey="revenue" title="Revenue">
          <AdminStatGrid stats={revenueStats} />
        </SectionBand>
        )}

        {isSectionVisible('smart') && (
        <SectionBand bandKey="smart" title="Smart finance metrics">
          <AdminStatGrid stats={smartStats} />
        </SectionBand>
        )}

        {isSectionVisible('collections') && (
        <SectionBand bandKey="collections" title="Collections">
          <AdminStatGrid stats={collectionsStats} />
        </SectionBand>
        )}

        {isSectionVisible('vat') && (
        <SectionBand bandKey="vat" title="VAT & upcoming">
          <AdminStatGrid stats={vatStats} />
        </SectionBand>
        )}

        {isSectionVisible('pipeline') && (
        <SectionBand bandKey="pipeline" title="Pipeline & payments">
          <AdminStatGrid stats={pipelineStats} />
        </SectionBand>
        )}

        {isSectionVisible('payment_followups') && (
        <SectionCard
          sectionId="payment_followups"
          title="Payment follow-up"
          subtitle="Approved quotes and open invoices awaiting payment — remind clients so projects can proceed"
          action={
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/quotes?status=approved" className="text-xs font-bold uppercase tracking-wide">
                Approved quotes
              </Link>
              <Link to="/admin/invoices?status=unpaid" className="text-xs font-bold uppercase tracking-wide">
                Open invoices
              </Link>
            </div>
          }
        >
          {!data.payment_followups?.length ? (
            <p className="px-5 sm:px-6 py-8 text-sm text-slate-500 text-center">
              No approved quotes or open invoices awaiting payment.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.payment_followups.map((item) => (
                <li
                  key={`followup-${item.type}-${item.id}`}
                  className="px-5 sm:px-6 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${followupBadgeClass(item.type)}`}>
                        {followupBadgeLabel(item.type)}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {item.client_name}
                      {item.project_title ? ` · ${item.project_title}` : ''}
                      {item.approved_at ? ` · approved ${formatDate(item.approved_at)}` : ''}
                      {item.days_overdue != null ? ` · ${item.days_overdue} days overdue` : ''}
                      {item.days_until_due != null ? ` · due in ${item.days_until_due} days` : ''}
                      {item.due_date && item.days_overdue == null && item.days_until_due == null
                        ? ` · due ${formatDate(item.due_date)}`
                        : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Project work starts after this invoice is paid.</p>
                    <DashboardActionButtons
                      actions={item.actions}
                      actionBusy={actionBusy}
                      onAction={handleDashboardAction}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                    {formatCurrency(safeNum(item.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        )}

        {(isSectionVisible('funnel') || isSectionVisible('upcoming')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isSectionVisible('funnel') && (
          <SectionCard
            sectionId="funnel"
            title="Quote funnel"
            subtitle={`Pending → Reviewed → Approved → Paid · ${funnel.total || 0} quotes`}
            action={
              <Link to="/admin/quotes" className="text-xs font-bold uppercase tracking-wide">
                View quotes
              </Link>
            }
          >
            <div className="p-5 sm:p-6 space-y-4">
              {(funnel.stages || []).map((stage) => (
                <Link key={stage.key} to={FUNNEL_LINKS[stage.key] || '/admin/quotes'} className="block group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">{stage.label}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{stage.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${FUNNEL_STAGE_BAR[stage.key] || 'bg-slate-500'}`}
                      style={{ width: `${Math.max((stage.count / funnelMax) * 100, stage.count ? 4 : 0)}%` }}
                    />
                  </div>
                </Link>
              ))}
              {(ancillary.changes_requested > 0 || ancillary.rejected > 0) && (
                <p className="text-xs text-slate-500">
                  Also: {ancillary.changes_requested || 0} changes requested · {ancillary.rejected || 0} rejected
                </p>
              )}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {conversion.pending_to_reviewed != null && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-slate-600 font-semibold">Pending → reviewed</p>
                    <p className="text-slate-900 text-lg font-bold mt-1">{conversion.pending_to_reviewed}%</p>
                  </div>
                )}
                {conversion.reviewed_to_approved != null && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-slate-600 font-semibold">Reviewed → approved</p>
                    <p className="text-slate-900 text-lg font-bold mt-1">{conversion.reviewed_to_approved}%</p>
                  </div>
                )}
                {conversion.approved_to_paid != null && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-slate-600 font-semibold">Approved → paid</p>
                    <p className="text-slate-900 text-lg font-bold mt-1">{conversion.approved_to_paid}%</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
          )}

          {isSectionVisible('upcoming') && (
          <SectionCard
            sectionId="upcoming"
            title="Upcoming due invoices"
            subtitle={`Due within the next ${upcomingHorizon} days`}
            action={
              <Link to="/admin/invoices?due=upcoming" className="text-xs font-bold uppercase tracking-wide">
                View all
              </Link>
            }
          >
            {!data.upcoming_due?.length ? (
              <p className="px-5 sm:px-6 py-8 text-sm text-slate-500 text-center">
                No invoices due in the next {upcomingHorizon} days.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.upcoming_due.map((inv) => (
                  <li key={inv.id} className="px-5 sm:px-6 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50">
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/invoices?invoice=${inv.id}`}>
                        <p className="text-sm font-semibold text-slate-900 truncate hover:text-slate-700">{inv.invoice_number}</p>
                      </Link>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {inv.client_name}
                        {inv.project_title ? ` · ${inv.project_title}` : ''}
                        {inv.due_date ? ` · due ${formatDate(inv.due_date)}` : ''}
                        {inv.days_until_due != null ? ` · in ${inv.days_until_due} days` : ''}
                      </p>
                      <DashboardActionButtons
                        actions={inv.actions}
                        actionBusy={actionBusy}
                        onAction={handleDashboardAction}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                      {formatCurrency(safeNum(inv.amount_due))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          )}
        </div>
        )}

        {isSectionVisible('service_type') && data.revenue_by_service_type?.length > 0 && (
          <SectionCard sectionId="service_type" title="Revenue by service type" subtitle={periodLabel}>
            <AdminTableWrap>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Service</th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Invoices</th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.revenue_by_service_type.map((row, idx) => (
                    <tr key={row.service_type} className={`hover:bg-slate-50/80 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-5 sm:px-6 py-3.5 text-sm font-semibold text-slate-900">{row.service_type}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-sm text-slate-600 text-right">{row.invoice_count}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-sm font-semibold text-slate-900 text-right tabular-nums">
                        {formatCurrency(safeNum(row.revenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableWrap>
          </SectionCard>
        )}

        {(isSectionVisible('monthly_chart') || isSectionVisible('aging')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isSectionVisible('monthly_chart') && monthlyDetail.length > 0 && (
            <SectionCard sectionId="monthly_chart" title="Monthly revenue trend" subtitle={`Paid invoices · ${periodLabel}`}>
              <RevenueBarChart rows={monthlyDetail} formatCurrency={formatCurrency} safeNum={safeNum} />
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {monthlyDetail.slice(0, 4).map((row) => (
                  <div key={row.month} className="flex items-center justify-between px-5 sm:px-6 py-3">
                    <p className="font-medium text-slate-800 text-sm">{formatMonth(row.month)}</p>
                    <span className="font-semibold text-slate-900 tabular-nums text-sm">{formatCurrency(safeNum(row.revenue))}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {isSectionVisible('aging') && (
          <SectionCard
            sectionId="aging"
            title="Overdue aging"
            subtitle="Outstanding balance by days past due"
            action={
              <Link to="/admin/invoices?due=overdue" className="text-xs font-bold uppercase tracking-wide">
                View overdue
              </Link>
            }
          >
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {agingCards.map(({ key, label, tone, text }) => {
                const bucket = aging[key] || { count: 0, amount: 0 };
                return (
                  <div key={key} className={`rounded-xl border p-4 ${tone}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${text}`}>{label}</p>
                    <p className={`mt-2 text-2xl font-bold ${text}`}>{formatCurrency(safeNum(bucket.amount))}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {bucket.count || 0} invoice{bucket.count === 1 ? '' : 's'}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="px-5 sm:px-6 pb-5 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>{data.active_projects_count || 0} active projects</span>
              {data.revenue_yoy_change_pct != null && (
                <span
                  className={
                    Number(data.revenue_yoy_change_pct) >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'
                  }
                >
                  {formatPct(data.revenue_yoy_change_pct)} vs same month last year
                </span>
              )}
            </div>
          </SectionCard>
          )}
        </div>
        )}

        {(isSectionVisible('needs_attention') || isSectionVisible('recent')) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {isSectionVisible('needs_attention') && (
          <SectionCard
            sectionId="needs_attention"
            title="Needs attention"
            subtitle="Overdue invoices, pending payments, and failed PayFast attempts"
            action={
              <Link to="/admin/invoices?due=overdue" className="text-xs font-bold uppercase tracking-wide">
                View all
              </Link>
            }
          >
            {!data.needs_attention?.length ? (
              <p className="px-5 sm:px-6 py-8 text-sm text-slate-500 text-center">Nothing urgent right now.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.needs_attention.map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="px-5 sm:px-6 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${followupBadgeClass(item.type)}`}>
                          {followupBadgeLabel(item.type)}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {item.client_name}
                        {item.project_title ? ` · ${item.project_title}` : ''}
                        {item.days_overdue != null ? ` · ${item.days_overdue} days overdue` : ''}
                        {item.days_until_due != null ? ` · due in ${item.days_until_due} days` : ''}
                        {item.due_date ? ` · due ${formatDate(item.due_date)}` : ''}
                      </p>
                      <DashboardActionButtons
                        actions={item.actions}
                        actionBusy={actionBusy}
                        onAction={handleDashboardAction}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                      {formatCurrency(safeNum(item.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          )}

          {isSectionVisible('recent') && (
          <SectionCard
            sectionId="recent"
            title="Recent collections"
            subtitle="Latest paid invoices in selected period"
            action={
              <Link to="/admin/invoices?status=paid" className="text-xs font-bold uppercase tracking-wide">
                View all
              </Link>
            }
          >
            {!data.recent_collections?.length ? (
              <p className="px-5 sm:px-6 py-8 text-sm text-slate-500 text-center">No paid invoices in this period.</p>
            ) : (
              <AdminTableWrap>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Invoice
                      </th>
                      <th className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">
                        Client
                      </th>
                      <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent_collections.map((row, idx) => (
                      <tr key={row.id} className={`transition-colors hover:bg-slate-50/80 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-5 sm:px-6 py-3 text-sm">
                          <p className="font-semibold text-slate-900">{row.invoice_number}</p>
                          {row.paid_date && <p className="text-xs text-slate-500">{formatDate(row.paid_date)}</p>}
                        </td>
                        <td className="px-5 sm:px-6 py-3 text-sm text-slate-600 hidden sm:table-cell truncate max-w-[160px]">
                          {row.client_name}
                        </td>
                        <td className="px-5 sm:px-6 py-3 text-sm font-semibold text-slate-900 text-right tabular-nums">
                          {formatCurrency(safeNum(row.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
            )}
          </SectionCard>
          )}
        </div>
        )}

        {isSectionVisible('reconciliation') && reconciliation.items?.length > 0 && (
          <SectionCard sectionId="reconciliation" title="PayFast reconciliation" subtitle="Invoice ↔ payment mismatches">
            <ul className="divide-y divide-slate-100">
              {reconciliation.items.map((item) => (
                <li key={`${item.type}-${item.invoice_id}-${item.payment_id}`} className="px-5 sm:px-6 py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                      Mismatch
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.client_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(safeNum(item.amount))}</span>
                    {item.invoice_id && (
                      <Link to={`/admin/invoices?invoice=${item.invoice_id}`} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                        Open invoice
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {isSectionVisible('forecast') && (
          <SectionCard sectionId="forecast" title="Expected cash-in (30 days)" subtitle={`${forecast.item_count || 0} items · ${formatCurrency(safeNum(forecast.expected_total))}`}>
            {!forecast.items?.length ? (
              <p className="px-5 sm:px-6 py-8 text-sm text-slate-500 text-center">No expected collections in the next 30 days.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {forecast.items.map((item, idx) => (
                  <li key={`${item.type}-${item.id}`} className={`px-5 sm:px-6 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{item.type.replace('_', ' ')}</span>
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.client_name}{item.expected_date ? ` · ${formatDate(item.expected_date)}` : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(safeNum(item.amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        )}

        {isSectionVisible('client_health') && data.client_health?.length > 0 && (
          <SectionCard sectionId="client_health" title="Client health" subtitle="Green = healthy · Amber = slow · Red = at risk">
            <AdminTableWrap>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Client</th>
                    <th className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Health</th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Outstanding</th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.client_health.map((client) => {
                    const styles = HEALTH_STYLES[client.score] || HEALTH_STYLES.amber;
                    return (
                      <tr key={client.client_id} className="hover:bg-slate-50/80">
                        <td className="px-5 sm:px-6 py-3.5 text-sm font-semibold text-slate-900">{client.client_name}</td>
                        <td className="px-5 sm:px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${styles.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                            {client.label}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-sm text-slate-700 text-right tabular-nums hidden sm:table-cell">
                          {formatCurrency(safeNum(client.outstanding_balance))}
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-sm text-slate-900 text-right tabular-nums hidden md:table-cell">
                          {formatCurrency(safeNum(client.total_revenue))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </AdminTableWrap>
          </SectionCard>
        )}

        {(savedView === 'full' || isSectionVisible('finance_activity')) && (
          <SectionCard
            sectionId="finance_activity"
            title="Finance activity log"
            subtitle="Reminders sent, contact notes, payments, and invoice updates — recorded automatically"
          >
            {!data.finance_activity?.length ? (
              <p className="px-5 sm:px-6 py-8 text-sm text-slate-500 text-center">No finance activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.finance_activity.map((entry) => (
                  <li key={entry.id} className="px-5 sm:px-6 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {entry.user_name}
                        {entry.details ? ` · ${entry.details}` : ''}
                        {entry.object_type && entry.object_id ? ` · ${entry.object_type} #${entry.object_id}` : ''}
                      </p>
                    </div>
                    <time className="text-xs text-slate-400 shrink-0 tabular-nums">
                      {entry.timestamp ? formatDateTime(entry.timestamp) : '—'}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        )}

        {(savedView === 'full' || isSectionVisible('client_health')) && data.top_clients?.length > 0 && (
          <SectionCard sectionId="top_clients" title="Top clients" subtitle={`By paid revenue · ${periodLabel}`}>
            <AdminTableWrap>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Client
                    </th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Revenue
                    </th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">
                      Outstanding
                    </th>
                    <th className="px-5 sm:px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">
                      Last payment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.top_clients.map((client, idx) => (
                    <tr key={client.client_id} className={`transition-colors hover:bg-slate-50/80 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-5 sm:px-6 py-3.5 text-sm font-semibold text-slate-900">{client.client_name}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-sm font-semibold text-slate-900 text-right tabular-nums">
                        {formatCurrency(safeNum(client.total_revenue))}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-sm text-slate-700 text-right tabular-nums hidden md:table-cell">
                        {formatCurrency(safeNum(client.unpaid_balance))}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-sm text-slate-500 text-right hidden lg:table-cell">
                        {client.last_payment_date ? formatDate(client.last_payment_date) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableWrap>
          </SectionCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinancialDashboard;
