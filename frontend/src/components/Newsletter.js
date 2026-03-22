import React, { useState } from 'react';
import api from '../services/api';

const Newsletter = () => {
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
    } catch (error) {
      if (error.isNetworkError) {
        setError('Cannot connect to server. Please try again later.');
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.email?.[0] ||
                            error.message || 
                            'Failed to subscribe. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-8 lg:p-12 text-white shadow-xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
      <div className="relative max-w-2xl mx-auto text-center">
        <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">Stay in the loop</h2>
        <p className="text-slate-100 text-lg mb-8 max-w-lg mx-auto">
          Get the latest updates, insights, and exclusive content delivered to your inbox. No spam.
        </p>

        {success && (
          <div className="mb-6 p-4 bg-slate-500/30 border border-slate-400/50 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-50 font-medium">Successfully subscribed! Welcome to the list.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl">
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-500"
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                Subscribing...
              </span>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-200/90 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default Newsletter;

