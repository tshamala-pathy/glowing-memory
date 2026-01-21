import React, { useState } from 'react';
import api from '../services/api';

const TestimonialForm = () => {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/testimonials/', formData);
      setSuccess(true);
      setFormData({
        name: '',
        position: '',
        company: '',
        testimonial: '',
        rating: 5,
      });
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      if (error.isNetworkError) {
        setError('Cannot connect to server. Please try again later.');
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message ||
                            error.message || 
                            'Failed to submit testimonial. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Share Your Experience</h2>
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Thank you for your testimonial! It will be reviewed before publishing.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input-professional"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-semibold text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              id="position"
              name="position"
              className="input-professional"
              placeholder="Software Engineer"
              value={formData.position}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            className="input-professional"
            placeholder="Company Name"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= formData.rating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="testimonial" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Testimonial *
          </label>
          <textarea
            id="testimonial"
            name="testimonial"
            required
            rows={5}
            className="input-professional resize-none"
            placeholder="Tell us about your experience..."
            value={formData.testimonial}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Submitting...' : 'Submit Testimonial'}
        </button>
      </form>
    </div>
  );
};

export default TestimonialForm;

