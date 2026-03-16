/**
 * Payment page for an approved quote.
 * Route: /payment/:quoteId
 * Only accessible when quote.status === 'approved'. After successful payment,
 * Invoice and Project are created automatically; user is redirected to portal.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

const Payment = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setError('');
    try {
      // API creates Payment and returns PayFast URL; redirect so user reaches card-entry page
      const { data: res } = await api.post(`/payment/quote/${quoteId}/start-pay/`);
      if (res?.redirect_url) {
        window.location.href = res.redirect_url;
        return;
      }
      setError('Unable to start payment. Please try again.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Unable to start payment. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white border border-[var(--aws-card-border)] p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Sign in required</h1>
          <p className="text-[#545b64] mb-6">Please log in to complete payment.</p>
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
        <div className="inline-block w-10 h-10 border-2 border-[var(--aws-orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white border border-[var(--aws-card-border)] p-8 text-center">
          <div className="w-12 h-12 rounded bg-[#fff4e5] text-[var(--aws-orange)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Unable to load payment</h1>
          <p className="text-[#545b64] mb-6">{error}</p>
          <Link to="/portal" className="inline-block px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)]">
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const alreadyPaid = data?.already_paid;

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#545b64] mb-2">
          <Link to="/" className="hover:text-[var(--aws-orange)]">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/profile" className="hover:text-[var(--aws-orange)]">Profile</Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--aws-dark)] font-medium">Payment</span>
        </nav>
        <h1 className="text-xl font-bold text-[var(--aws-dark)]">Payment</h1>
      </div>
      <div className="max-w-lg mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa]">
            <h2 className="text-base font-semibold text-[var(--aws-dark)]">
              {alreadyPaid ? 'Payment already completed' : 'Complete payment'}
            </h2>
            <p className="text-sm text-[#545b64] mt-0.5">{data?.project_title || 'Quote'}</p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-[#fff4e5] border border-[#ffb366] text-[var(--aws-dark)] text-sm">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between py-4 border-y border-[var(--aws-card-border)]">
              <span className="text-[#545b64]">Amount</span>
              <span className="text-xl font-semibold text-[var(--aws-dark)]">{formatCurrency(data?.amount)}</span>
            </div>
            {alreadyPaid ? (
              <div className="mt-6">
                <p className="text-[#545b64] mb-4">This quote has already been paid. Your invoice and project are in your portal.</p>
                <Link to="/portal" className="inline-block w-full text-center px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)] transition-colors">
                  Go to Portal
                </Link>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Redirecting...' : 'Pay now'}
                </button>
                <p className="mt-3 text-sm text-[#545b64] text-center">
                  You will be redirected to our secure payment page to enter your card details.
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="mt-6 text-center">
          <Link to="/profile" className="text-sm font-medium text-[var(--aws-orange)] hover:underline">← Back to Profile</Link>
        </p>
      </div>
    </div>
  );
};

export default Payment;
