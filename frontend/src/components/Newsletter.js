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
      console.error('Newsletter subscription error:', error);
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
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white shadow-xl">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-lg text-blue-100 mb-8">
          Get the latest updates, insights, and exclusive content delivered to your inbox
        </p>
        
        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg">
            <p className="text-green-100 font-medium">✓ Successfully subscribed! Check your email for confirmation.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg">
            <p className="text-red-100">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        
        <p className="mt-4 text-sm text-blue-100">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default Newsletter;

