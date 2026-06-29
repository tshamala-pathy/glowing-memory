/**
 * Payment page for an approved quote — modern SaaS checkout experience.
 *
 * Route: /payment/:quoteId
 * Sections: Header → Payment Details → Order Summary → Payment Action → Confirmation
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

const STATUS_LABELS = {
  awaiting_payment: 'Awaiting payment',
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
};

const Payment = () => {
  const { quoteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [screen, setScreen] = useState('checkout'); // checkout | processing | success | failed

  const paymentFailed = searchParams.get('status') === 'failed';

  useEffect(() => {
    if (paymentFailed) setScreen('failed');
  }, [paymentFailed]);

  useEffect(() => {
    if (!isAuthenticated || !quoteId) {
      setLoading(false);
      return;
    }
    const fetchPaymentInfo = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: res } = await api.get(`/payment/quote/${quoteId}/`);
        setData(res);
        if (res?.already_paid) setScreen('success');
      } catch (err) {
        const msg = err.response?.data?.error || 'Unable to load payment details.';
        setError(msg);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentInfo();
  }, [isAuthenticated, quoteId]);

  const handleConfirmPayment = async () => {
    if (!quoteId || submitting) return;
    setSubmitting(true);
    setScreen('processing');
    setError('');
    try {
      const { data: res } = await api.post(`/payment/quote/${quoteId}/start-pay/`);
      if (res?.redirect_url) {
        window.location.href = res.redirect_url;
        return;
      }
      setScreen('failed');
      setError('Unable to start payment. Please try again.');
    } catch (err) {
      setScreen('failed');
      const msg = err.response?.data?.error || 'Unable to start payment. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const quoteAmount = data?.quote_amount ?? data?.amount;
  const invoiceAmount = data?.invoice_amount ?? data?.amount;
  const paymentStatus = data?.payment_status || 'awaiting_payment';
  const statusLabel = STATUS_LABELS[paymentStatus] || paymentStatus;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 text-center border border-white/20">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-slate-700 text-white flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in required</h1>
          <p className="text-slate-600 mb-6">Please log in to complete your secure payment.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-slate-800 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-400/30" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" />
        </div>
        <p className="text-blue-100 font-medium">Loading payment details…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Unable to load payment</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link to="/portal" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-slate-800 text-white font-semibold rounded-xl">
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  /* ── Confirmation screens ── */
  if (screen === 'success' || data?.already_paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_ease-in-out_1]">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-bold">Payment successful</h1>
            <p className="text-emerald-100 mt-2 text-sm">Your invoice and project are being prepared.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Project</span><span className="font-medium text-slate-900">{data?.project_title}</span></div>
              {data?.invoice_number && (
                <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span className="font-medium text-slate-900">{data.invoice_number}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Amount paid</span><span className="font-bold text-emerald-700">{formatCurrency(invoiceAmount)}</span></div>
            </div>
            <Link to="/portal" className="block w-full text-center px-6 py-3.5 bg-gradient-to-r from-blue-600 to-slate-800 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Go to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-2xl font-bold">Payment failed</h1>
            <p className="text-red-100 mt-2 text-sm">{error || 'Something went wrong. Please try again.'}</p>
          </div>
          <div className="p-6 space-y-3">
            <button type="button" onClick={() => { setScreen('checkout'); setError(''); }} className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-slate-800 text-white font-semibold rounded-xl hover:opacity-90">
              Try again
            </button>
            <Link to="/profile" className="block w-full text-center px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50">
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur rounded-2xl p-10 border border-white/20">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full border-4 border-blue-400/40 border-t-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Processing payment</h2>
          <p className="text-blue-100 text-sm">Redirecting you to PayFast secure checkout…</p>
          <p className="text-blue-200/70 text-xs mt-4">Do not close this window.</p>
        </div>
      </div>
    );
  }

  /* ── Main checkout ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <nav className="flex items-center gap-2 text-sm text-blue-200/80 mb-3">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
            <span>/</span>
            <span className="text-white font-medium">Payment</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Secure Payment</h1>
              <p className="text-sm text-blue-200/70">Powered by PayFast · SSL encrypted</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Payment Details + Action */}
          <div className="lg:col-span-3 space-y-6">
            {/* Payment Details */}
            <section className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-blue-900 text-white">
                <h2 className="font-semibold">Payment Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{data?.project_title || 'Quote'}</p>
                  {data?.service_type && <p className="text-sm text-slate-500 mt-0.5">{data.service_type}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Payment method</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">PayFast</span>
                      <span className="text-xs text-slate-500">Card · EFT · Instant</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                    <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {statusLabel}
                    </span>
                  </div>
                </div>
                {data?.client_name && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Billed to</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{data.client_name}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Payment Action */}
            <section className="bg-white rounded-2xl shadow-xl p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={submitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-base"
              >
                {submitting ? 'Redirecting…' : `Pay ${formatCurrency(invoiceAmount)} securely`}
              </button>
              <p className="mt-4 text-xs text-slate-500 text-center leading-relaxed">
                You will be redirected to PayFast&apos;s secure payment page. We never store your card details.
              </p>
              <button type="button" onClick={() => navigate('/profile')} className="mt-4 w-full text-sm text-slate-500 hover:text-slate-800 transition-colors">
                ← Back to Profile
              </button>
            </section>
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Quote amount</span>
                  <span className="font-medium text-slate-800">{formatCurrency(quoteAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Invoice amount</span>
                  <span className="font-medium text-slate-800">{formatCurrency(invoiceAmount)}</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total due</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-slate-800 bg-clip-text text-transparent">
                    {formatCurrency(invoiceAmount)}
                  </span>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-4 mt-2">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      After payment, your invoice is generated automatically and your project workspace is created.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Payment;
