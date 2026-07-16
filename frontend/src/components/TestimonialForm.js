import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { getUserAvatarUrl } from '../utils/userAvatar';

const StarIcon = ({ filled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="focus:outline-none p-1 hover:scale-110 transition-transform"
  >
    <svg
      className={`w-8 h-8 ${filled ? 'text-amber-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  </button>
);

const TestimonialForm = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    company: '',
    testimonial: '',
    rating: 5,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const avatarUrl = getUserAvatarUrl(user);
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '';

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || displayName,
      company: prev.company || user.client_profile?.name || prev.company,
    }));
  }, [isAuthenticated, user, displayName]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await api.post('/testimonials/', formData);
      setSuccess(true);
      setFormData({
        name: displayName || '',
        position: '',
        company: user?.client_profile?.name || '',
        testimonial: '',
        rating: 5,
      });
    } catch (err) {
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please try again later.');
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            err.message ||
            'Failed to submit testimonial. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-600 focus:border-slate-600 outline-none transition placeholder:text-slate-400';

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 sm:px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Share Your Experience</h2>
        <p className="text-slate-200 text-sm mt-1">We&apos;d love to hear about your experience working with us.</p>
      </div>

      <div className="p-6 sm:p-8">
        {isAuthenticated && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <UserAvatar src={avatarUrl} name={displayName} email={user?.email} size="lg" ring />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Your profile photo</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {avatarUrl
                  ? 'This photo is linked to your account and will appear on published testimonials.'
                  : 'Add a profile photo so it appears on your testimonial and across your account.'}
              </p>
              <Link
                to="/profile"
                className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                {avatarUrl ? 'Update photo in profile →' : 'Upload photo in profile →'}
              </Link>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-800 font-semibold">Thank you!</p>
              <p className="text-emerald-700 text-sm mt-0.5">Your testimonial will be reviewed before publishing.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className={inputCls}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-semibold text-slate-700 mb-2">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                className={inputCls}
                placeholder="Software Engineer"
                value={formData.position}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              className={inputCls}
              placeholder="Company Name"
              value={formData.company}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= formData.rating}
                  onClick={() => setFormData({ ...formData, rating: star })}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="testimonial" className="block text-sm font-semibold text-slate-700 mb-2">
              Your Testimonial *
            </label>
            <textarea
              id="testimonial"
              name="testimonial"
              required
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Tell us about your experience..."
              value={formData.testimonial}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold shadow-lg shadow-slate-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Testimonial'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TestimonialForm;
