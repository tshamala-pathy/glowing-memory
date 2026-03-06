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
      await api.post(`/payment/quote/${quoteId}/`);
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Payment could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h1>
          <p className="text-gray-600 mb-4">Please log in to complete payment.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 flex items-center justify-center">
        <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to load payment</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/portal" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const alreadyPaid = data?.already_paid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {alreadyPaid ? 'Payment already completed' : 'Complete payment'}
            </h1>
            <p className="text-gray-600 mb-6">
              {data?.project_title || 'Quote'}
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between py-4 border-y border-gray-200">
              <span className="text-gray-600">Amount</span>
              <span className="text-xl font-semibold text-gray-900">{formatCurrency(data?.amount)}</span>
            </div>
            {alreadyPaid ? (
              <div className="mt-6">
                <p className="text-gray-600 mb-4">This quote has already been paid. Your invoice and project are in your portal.</p>
                <Link to="/portal" className="inline-block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                  Go to Portal
                </Link>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Confirm payment'}
                </button>
                <p className="mt-3 text-sm text-gray-500 text-center">
                  By confirming, an invoice will be created and your project will be set up.
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="mt-6 text-center">
          <Link to="/portal" className="text-blue-600 hover:text-blue-800 font-medium">Back to Portal</Link>
        </p>
      </div>
    </div>
  );
};

export default Payment;
