import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const NewsletterPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/newsletter/subscribe/', { email, name });
      setSuccess(true);
      setEmail('');
      setName('');
    } catch (err) {
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please try again later.');
      } else {
        const errorMessage = err.response?.data?.detail ||
          err.response?.data?.email?.[0] ||
          err.message ||
          'Failed to subscribe. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex p-4 bg-white/20 rounded-2xl mb-8">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Newsletter
          </h1>
          <p className="text-slate-100 text-lg sm:text-xl max-w-2xl mx-auto mb-2">
            Stay in the loop with the latest updates, insights, and exclusive content.
          </p>
          <p className="text-slate-200/90 text-base max-w-xl mx-auto">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 bg-gray-50 py-12 sm:py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
            {success ? (
              <div className="text-center py-4">
                <div className="inline-flex p-4 bg-slate-100 rounded-full mb-6">
                  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're subscribed!</h2>
                <p className="text-gray-600 mb-8">Thanks for joining. We'll keep you updated.</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-xl transition"
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Subscribe</h2>
                <p className="text-gray-500 text-sm mb-6">Enter your details below.</p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Name (optional)</label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Subscribing...
                      </span>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </form>

                <p className="mt-6 text-xs text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPage;
