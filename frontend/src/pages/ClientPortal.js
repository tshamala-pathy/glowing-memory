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
  const { isAuthenticated } = useAuth();
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
        <div className="max-w-md w-full bg-white border border-[var(--aws-card-border)] p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--aws-dark)] mb-2">Client Portal</h1>
          <p className="text-[#545b64] mb-6">Please log in to view your quotes, invoices, and projects.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)] transition-colors">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-[var(--aws-orange)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#545b64]">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      {/* AWS-style header bar */}
      <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#545b64] mb-2">
          <Link to="/" className="hover:text-[var(--aws-orange)]">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/profile" className="hover:text-[var(--aws-orange)]">Profile</Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--aws-dark)] font-medium">Client Portal</span>
        </nav>
        <h1 className="text-2xl font-bold text-[var(--aws-dark)]">Client Portal</h1>
        <p className="text-sm text-[#545b64] mt-1">Your quotes, invoices, and projects in one place.</p>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-[#fff4e5] border border-[#ffb366] text-[var(--aws-dark)] flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--aws-orange)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {quoteIdFromUrl && approvedQuoteNotPaid && (
          <div className="mb-6 p-4 bg-[#fff4e5] border border-[#ffb366] flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-3">
              <span className="flex-shrink-0 w-10 h-10 rounded bg-[#ffb366]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--aws-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <p className="font-medium text-[var(--aws-dark)]">Complete payment for your approved quote.</p>
            </span>
            <Link to={`/payment/${quoteIdFromUrl}`} className="inline-flex px-4 py-2 bg-[var(--aws-orange)] text-white text-sm font-medium hover:bg-[var(--aws-orange-hover)]">Go to payment</Link>
          </div>
        )}
        {quoteIdFromUrl && hasInvoiceForApprovedQuote && (
          <div className="mb-6 p-4 bg-[#e8f5e9] border border-[#81c784] text-[var(--aws-dark)] flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 rounded bg-[#81c784]/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </span>
            <p className="font-medium">Your quote was approved and paid. View your invoice below.</p>
          </div>
        )}

        {/* My Quotes */}
        <section className="mb-10">
          <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa] flex items-center gap-3">
              <span className="w-9 h-9 rounded bg-[#f4f4f4] text-[var(--aws-dark)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              <h2 className="text-base font-semibold text-[var(--aws-dark)]">My Quotes</h2>
            </div>
            {quotes.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-[#f4f4f4] text-[#737373] mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--aws-dark)] mb-1">No quotes yet</h3>
                <p className="text-[#545b64] max-w-sm mx-auto mb-4">You don&apos;t have any quote requests. When you submit a quote request, it will appear here.</p>
                <Link to="/request-quote" className="inline-flex px-4 py-2 bg-[var(--aws-orange)] text-white text-sm font-medium hover:bg-[var(--aws-orange-hover)] transition-colors">Request a quote</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--aws-card-border)]">
                  <thead className="bg-[#fafafa]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Estimated</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#545b64] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--aws-card-border)]">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{q.title || '—'}</div>
                          {(canApproveDecline(q) && (q.admin_response || q.estimated_delivery_time)) && (
                            <div className="mt-1 text-xs text-gray-500">
                              {q.estimated_delivery_time && <span>Delivery: {q.estimated_delivery_time}. </span>}
                              {q.admin_response && <span className="line-clamp-2">{q.admin_response}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusClass(q.status)}`}>{q.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(q.total_price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(q.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          {canApproveDecline(q) && (
                            <span className="inline-flex gap-2 mr-2">
                              <button
                                type="button"
                                onClick={() => handleQuoteDecision(q, 'approve')}
                                disabled={decisionLoadingId === q.id}
                                className="text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50"
                              >
                                {decisionLoadingId === q.id ? '...' : '✔ Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuoteDecision(q, 'decline')}
                                disabled={decisionLoadingId === q.id}
                                className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                ✖ Decline
                              </button>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadQuote(q)}
                            disabled={downloadingId === `quote-${q.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            {downloadingId === `quote-${q.id}` ? 'Downloading...' : 'Download PDF'}
                          </button>
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
          <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa] flex items-center gap-3">
              <span className="w-9 h-9 rounded bg-[#f4f4f4] text-[var(--aws-dark)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              <h2 className="text-base font-semibold text-[var(--aws-dark)]">My Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-[#f4f4f4] text-[#737373] mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--aws-dark)] mb-1">No invoices yet</h3>
                <p className="text-[#545b64] max-w-sm mx-auto">Invoices are created after your quote is approved. When you have one, it will appear here for download.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--aws-card-border)]">
                  <thead className="bg-[#fafafa]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#545b64] uppercase tracking-wider">Due date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#545b64] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--aws-card-border)]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.invoice_number || inv.id}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInvoiceStatusClass(inv.status)}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(inv.total_amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                        <td className="px-4 py-3 text-right flex gap-3 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-sm font-medium text-[var(--aws-dark)] hover:text-[var(--aws-orange)]"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(inv)}
                            disabled={downloadingId === inv.id}
                            className="text-sm font-medium text-[var(--aws-orange)] hover:underline disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? 'Downloading...' : 'Download PDF'}
                          </button>
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
          <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa] flex items-center gap-3">
              <span className="w-9 h-9 rounded bg-[#f4f4f4] text-[var(--aws-dark)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </span>
              <h2 className="text-base font-semibold text-[var(--aws-dark)]">My Projects</h2>
            </div>
            {projects.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-[#f4f4f4] text-[#737373] mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--aws-dark)] mb-1">No projects yet</h3>
                <p className="text-[#545b64] max-w-sm mx-auto">Projects are created automatically when an invoice is paid. Once you have an active project, it will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--aws-card-border)]">
                {projects.map((p) => (
                  <li key={p.id} className="px-6 py-4 hover:bg-[#fafafa] flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-[var(--aws-dark)]">{p.name || p.quote_project_title || 'Project'}</p>
                      {p.description && <p className="text-sm text-[#545b64] mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getProjectStatusClass(p.status)}`}>
                        {p.status === 'in_progress' ? 'In Progress' : p.status === 'completed' ? 'Completed' : p.status || 'Pending'}
                      </span>
                      <Link to="/my-projects" className="text-sm font-medium text-[var(--aws-orange)] hover:underline">View details</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-[var(--aws-card-border)]">
          <Link to="/profile" className="text-sm font-medium text-[var(--aws-orange)] hover:underline">← Back to Profile</Link>
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
