import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const quoteIdFromUrl = searchParams.get('quote');
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const hasInvoiceForApprovedQuote = quoteIdFromUrl && invoices.some((inv) => String(inv.quote) === String(quoteIdFromUrl));

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Client Portal</h1>
          <p className="text-gray-600 mb-8">Please log in to view your quotes, invoices, and projects.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-600 mt-1">Your quotes, invoices, and projects in one place. You only see data for your account.</p>
        </div>

        {/* Hero image */}
        <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border border-gray-200/60 bg-white">
          <img
            src="/client-portal-hero.png"
            alt=""
            className="w-full h-auto object-cover object-center"
            style={{ maxHeight: '280px' }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
            {error}
          </div>
        )}

        {quoteIdFromUrl && hasInvoiceForApprovedQuote && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </span>
            <p className="font-medium">Your quote was approved. Pay your invoice below.</p>
          </div>
        )}

        {/* My Quotes — only the logged-in client's quotes */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </span>
            My Quotes
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {quotes.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-500 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No quotes yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-4">You don&apos;t have any quote requests. When you submit a quote request, it will appear here.</p>
                <Link to="/request-quote" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Request a quote</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estimated</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{q.title || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusClass(q.status)}`}>{q.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(q.total_price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(q.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* My Invoices — only the logged-in client's invoices */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </span>
            My Invoices
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-green-500 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No invoices yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Invoices are created after your quote is approved. When you have one, it will appear here for download.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
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
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(inv)}
                            disabled={downloadingId === inv.id}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
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

        {/* My Projects — only the logged-in client's projects */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            My Projects
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {projects.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 text-purple-500 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Projects are created automatically when an invoice is paid. Once you have an active project, it will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {projects.map((p) => (
                  <li key={p.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{p.name || p.quote_project_title || 'Project'}</p>
                      {p.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectStatusClass(p.status)}`}>
                        {p.status === 'in_progress' ? 'In Progress' : p.status === 'completed' ? 'Completed' : p.status || 'Pending'}
                      </span>
                      <Link to="/my-projects" className="text-sm font-medium text-blue-600 hover:text-blue-800">View details</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link to="/profile" className="text-blue-600 hover:text-blue-800 font-medium">Back to Profile</Link>
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
