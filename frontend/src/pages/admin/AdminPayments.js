import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminRefreshButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const statusClass = (status) => {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-800';
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (status === 'processing' || status === 'pending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
};

const AdminPayments = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('payfast');
  const [invoicePayments, setInvoicePayments] = useState([]);
  const [payfastPayments, setPayfastPayments] = useState([]);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const { data } = await api.get('/invoices/admin/payments/');
      setInvoicePayments(data.invoice_payments || []);
      setPayfastPayments(data.payfast_payments || []);
    } catch {
      setInvoicePayments([]);
      setPayfastPayments([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && !user.is_superuser) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  const rows = useMemo(() => {
    const list = tab === 'payfast' ? payfastPayments : invoicePayments;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        String(p.quote_title || '').toLowerCase().includes(q)
        || String(p.client || '').toLowerCase().includes(q)
        || String(p.status || '').toLowerCase().includes(q),
    );
  }, [tab, payfastPayments, invoicePayments, search]);

  const paidCount = [...invoicePayments, ...payfastPayments].filter((p) => p.status === 'paid').length;

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageBanner
        title="Payments"
        description="PayFast attempts and invoice payment records (Django admin parity)."
        actions={<AdminRefreshButton onClick={() => fetchData(true)} refreshing={refreshing} />}
      />
      <AdminStatGrid
        stats={[
          { label: 'PayFast records', value: payfastPayments.length, tone: 'bg-white border border-slate-200' },
          { label: 'Invoice payments', value: invoicePayments.length, tone: 'bg-white border border-slate-200' },
          { label: 'Paid (combined)', value: paidCount, tone: 'bg-emerald-50 border border-emerald-200' },
        ]}
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: 'payfast', label: 'PayFast payments' },
          { id: 'invoice', label: 'Invoice payments' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === t.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AdminListSection
        className="mt-6"
        title={tab === 'payfast' ? 'PayFast payment log' : 'Invoice payment log'}
        toolbar={
          <input
            type="search"
            placeholder="Search client, quote, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-full max-w-xs"
          />
        }
      >
        <AdminTableWrap>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-3 pr-4">Quote</th>
                <th className="py-3 pr-4">Client</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
                {tab === 'payfast' && <th className="py-3 pr-4">Reference</th>}
                <th className="py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={`${p.source}-${p.id}`} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{p.quote_title || `#${p.quote_id}`}</td>
                  <td className="py-3 pr-4 text-slate-600">{p.client || '—'}</td>
                  <td className="py-3 pr-4">
                    {tab === 'payfast' ? `${p.currency?.toUpperCase() || ''} ${p.amount}` : `R ${p.amount}`}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  {tab === 'payfast' && <td className="py-3 pr-4 text-xs text-slate-500">{p.provider_reference || '—'}</td>}
                  <td className="py-3 text-slate-500">{formatDateTime(p.paid_at || p.payment_date || p.created_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={tab === 'payfast' ? 6 : 5} className="py-8 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminListSection>
    </AdminLayout>
  );
};

export default AdminPayments;
