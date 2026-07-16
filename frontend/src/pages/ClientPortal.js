import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDate, formatCurrency, getQuoteStatusClass, getInvoiceStatusClass, getProjectStatusClass } from '../utils/formatters';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

/**
 * Client Portal: shows the logged-in client's quotes, invoices, and projects.
 * Uses the single /api/profile/ endpoint to avoid duplicate API calls.
 * Empty sections show a friendly empty-state message.
 */
const ClientPortal = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteIdFromUrl = searchParams.get('quote');
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);
  const hasInvoiceForApprovedQuote = quoteIdFromUrl && invoices.some((inv) => String(inv.quote) === String(quoteIdFromUrl));
  const approvedQuoteNotPaid = quoteIdFromUrl && !invoices.some((inv) => String(inv.quote) === String(quoteIdFromUrl)) && quotes.some((q) => String(q.id) === String(quoteIdFromUrl) && (q.status === 'approved' || q.status === 'Approved'));

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/profile/');
        setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) setError('Please log in to view your quotes, invoices, and projects.');
        else if (status === 403) setError('You do not have access to this data.');
        else setError('Failed to load portal data. Please try again later.');
        setQuotes([]);
        setInvoices([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const handleDownloadInvoice = async (invoice) => {
    if (downloadingId) return;
    setDownloadingId(invoice.id);
    try {
      const res = await api.get(`/invoices/${invoice.id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice.invoice_number || invoice.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download invoice.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadQuote = async (quote) => {
    if (downloadingId) return;
    setDownloadingId(`quote-${quote.id}`);
    try {
      const res = await api.get(`/quotes/${quote.id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote_${quote.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download quote.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Client can approve or decline after admin has replied (status is 'reviewed' or legacy 'replied')
  const canApproveDecline = (q) => {
    const s = (q.status || '').toLowerCase();
    return s === 'reviewed' || s === 'replied';
  };
  const handleQuoteDecision = async (quote, decision) => {
    if (decisionLoadingId) return;
    setDecisionLoadingId(quote.id);
    setError('');
    try {
      await api.post(`/quotes/${quote.id}/decision/`, { decision });
      if (decision === 'approve') {
        navigate(`/payment/${quote.id}`, { replace: true });
        return;
      }
      const { data } = await api.get('/profile/');
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch (err) {
      setError(err.response?.data?.status?.[0] || err.response?.data?.error || 'Action failed.');
    } finally {
      setDecisionLoadingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-lg shadow-teal-900/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Portal</h1>
          <p className="text-slate-600 mt-2 leading-relaxed">Sign in to see your quotes, invoices, and projects in one place.</p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-3 text-white font-semibold shadow-md shadow-teal-900/15 transition hover:bg-teal-500"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading your portal…</p>
          <p className="text-slate-500 text-sm mt-1">Fetching quotes, invoices, and projects</p>
        </div>
      </div>
    );
  }

  const firstName = user?.first_name?.trim();
  const portalGreeting = firstName ? `Hi, ${firstName}` : 'Welcome';

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Link to="/" className="hover:text-teal-700 transition-colors">
              Home
            </Link>
            <span aria-hidden className="text-slate-400">
              /
            </span>
            <Link to="/profile" className="hover:text-teal-700 transition-colors">
              Profile
            </Link>
            <span aria-hidden className="text-slate-400">
              /
            </span>
            <span className="font-medium text-slate-900">Client Portal</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl shadow-slate-900/[0.08] ring-1 ring-slate-900/5">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-6 py-8 sm:px-8 sm:py-10 text-white">
            <div className="absolute inset-0 opacity-[0.14] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="min-w-0 max-w-2xl">
                <p className="text-teal-200/95 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2">One dashboard</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Client Portal</h1>
                <p className="mt-3 text-base sm:text-lg text-slate-300/95 leading-relaxed">
                  Your quotes, invoices, and projects in one place—clear, current, and easy to act on.
                </p>
                <p className="mt-2 text-sm text-teal-100/90">{portalGreeting}</p>
              </div>
              <div className="flex flex-wrap gap-2.5 lg:justify-end">
                {[
                  { n: quotes.length, label: 'Quotes', tone: 'from-amber-500/25 to-amber-600/10 border-amber-400/30' },
                  { n: invoices.length, label: 'Invoices', tone: 'from-emerald-500/25 to-emerald-600/10 border-emerald-400/30' },
                  { n: projects.length, label: 'Projects', tone: 'from-teal-500/25 to-cyan-600/10 border-teal-400/30' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-xl border px-4 py-3 text-center backdrop-blur-sm bg-gradient-to-br ${s.tone}`}
                  >
                    <p className="text-2xl font-bold tabular-nums text-white">{s.n}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-200/95">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-md transition hover:bg-teal-50"
              >
                Full profile
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/my-projects"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Project hub
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-amber-950 shadow-sm">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium flex-1">{error}</p>
          </div>
        )}

        {quoteIdFromUrl && approvedQuoteNotPaid && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50/80 p-4 sm:px-5 shadow-sm">
            <span className="flex items-center gap-3 min-w-0">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p className="font-semibold text-slate-900">Complete payment for your approved quote.</p>
            </span>
            <Link
              to={`/payment/${quoteIdFromUrl}`}
              className="inline-flex justify-center items-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-500 shrink-0"
            >
              Go to payment
            </Link>
          </div>
        )}
        {quoteIdFromUrl && hasInvoiceForApprovedQuote && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-950 shadow-sm">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-200/60">
              <svg className="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="font-semibold">Your quote was approved and paid. Your invoice is listed below.</p>
          </div>
        )}

        {/* My Quotes */}
        <section className="mb-10">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-orange-50/50 to-slate-50/50 px-5 sm:px-6 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">My Quotes</h2>
                <p className="text-xs text-slate-600 mt-0.5">Estimates and proposals</p>
              </div>
            </div>
            {quotes.length === 0 ? (
              <div className="p-10 sm:p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No quotes yet</h3>
                <p className="text-slate-600 max-w-sm mx-auto mt-2 mb-6 text-sm leading-relaxed">
                  When you request a quote, it will show up here with status updates and PDFs.
                </p>
                <Link
                  to="/request-quote"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-900/10 transition hover:bg-amber-500"
                >
                  Request a quote
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/90">
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Project</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Estimated</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Date</th>
                      <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {quotes.map((q) => (
                      <tr key={q.id} className="transition-colors hover:bg-amber-50/40">
                        <td className="px-4 py-3 align-top">
                          <div className="text-sm font-semibold text-slate-900">{q.title || '—'}</div>
                          {canApproveDecline(q) && (q.admin_response || q.estimated_delivery_time) && (
                            <div className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                              {q.estimated_delivery_time && <span>Delivery: {q.estimated_delivery_time}. </span>}
                              {q.admin_response && <span className="line-clamp-2">{q.admin_response}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getQuoteStatusClass(q.status)}`}>{q.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 tabular-nums align-top">{formatCurrency(q.total_price)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 tabular-nums align-top">{formatDate(q.created_at)}</td>
                        <td className="px-4 py-3 text-right align-top">
                          <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                            {canApproveDecline(q) && (
                              <>
                                <Link
                                  to={`/proposal/${q.id}`}
                                  className="inline-flex rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                                >
                                  Proposal
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleQuoteDecision(q, 'approve')}
                                  disabled={decisionLoadingId === q.id}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  {decisionLoadingId === q.id ? '…' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuoteDecision(q, 'decline')}
                                  disabled={decisionLoadingId === q.id}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadQuote(q)}
                              disabled={downloadingId === `quote-${q.id}`}
                              className="text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50"
                            >
                              {downloadingId === `quote-${q.id}` ? 'Downloading…' : 'PDF'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* My Invoices */}
        <section className="mb-10">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50/50 px-5 sm:px-6 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">My Invoices</h2>
                <p className="text-xs text-slate-600 mt-0.5">Totals, due dates, and PDFs</p>
              </div>
            </div>
            {invoices.length === 0 ? (
              <div className="p-10 sm:p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No invoices yet</h3>
                <p className="text-slate-600 max-w-md mx-auto mt-2 text-sm leading-relaxed">
                  Invoices appear after your quote is approved and we’re ready to bill. You’ll be able to view and download PDFs here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/90">
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Invoice #</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Total</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Due date</th>
                      <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="transition-colors hover:bg-emerald-50/35">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 tabular-nums">{inv.invoice_number || inv.id}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getInvoiceStatusClass(inv.status)}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 tabular-nums">{formatCurrency(inv.total_amount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 tabular-nums">{formatDate(inv.due_date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(inv)}
                              disabled={downloadingId === inv.id}
                              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 disabled:opacity-50"
                            >
                              {downloadingId === inv.id ? '…' : 'PDF'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* My Projects */}
        <section>
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] mb-6">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-slate-50/50 px-5 sm:px-6 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">My Projects</h2>
                <p className="text-xs text-slate-600 mt-0.5">Active work after payment</p>
              </div>
            </div>
            {projects.length === 0 ? (
              <div className="p-10 sm:p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
                <p className="text-slate-600 max-w-md mx-auto mt-2 text-sm leading-relaxed">
                  Projects are created when an invoice is paid. You’ll see status and details here as work moves forward.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 transition-colors hover:bg-teal-50/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{p.name || p.quote_project_title || 'Project'}</p>
                      {p.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getProjectStatusClass(p.status)}`}
                      >
                        {p.status === 'in_progress'
                          ? 'In Progress'
                          : p.status === 'completed'
                            ? 'Completed'
                            : p.status || 'Pending'}
                      </span>
                      <Link
                        to="/my-projects"
                        className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
                      >
                        Details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/90 pt-8">
          <p className="text-sm text-slate-500">Need account settings or contact info?</p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/[0.04] hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-900 transition-colors"
          >
            <span aria-hidden>←</span> Back to profile
          </Link>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownloadPDF={handleDownloadInvoice}
          isDownloading={downloadingId === selectedInvoice?.id}
        />
      )}
    </div>
  );
};

export default ClientPortal;
