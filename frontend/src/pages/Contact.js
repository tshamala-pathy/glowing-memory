import React, { useState } from 'react';
import api from '../services/api';
import TestimonialForm from '../components/TestimonialForm';

// Hero image: phone / communication (local so it always loads)
const HERO_IMAGE = `${process.env.PUBLIC_URL || ''}/contact-hero.jpg`;
const HERO_IMAGE_ALT = 'Contact us - phone and communication';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);

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
      await api.post('/contact/', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error sending message:', err);
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      } else {
        const errorMessage = err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to send message. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      content: 'contact@pathycode.com',
      link: 'mailto:contact@pathycode.com',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Address',
      content: '123 Tech Street, Innovation City, IC 12345',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero with full-width photo */}
      <section className="relative h-[42vh] min-h-[320px] max-h-[500px] overflow-hidden">
        {!heroImageError ? (
          <img
            src={HERO_IMAGE}
            alt={HERO_IMAGE_ALT}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setHeroImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-lg">
            Get in touch
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-slate-200 max-w-xl drop-shadow">
            Have a question or want to work together? We’d love to hear from you.
          </p>
        </div>
      </section>

      {/* Main content: form + contact info */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Contact form card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-6 sm:px-8 pt-8 pb-2">
                <h2 className="text-2xl font-bold text-slate-900">Send us a message</h2>
                <p className="mt-1 text-slate-600">We typically reply within 24 hours.</p>
              </div>

              <div className="px-6 sm:px-8 pb-8">
                {success && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-800 font-semibold">Message sent successfully</p>
                      <p className="text-emerald-700 text-sm mt-0.5">We’ll get back to you as soon as possible.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      placeholder="What’s this about?"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-900/25 hover:shadow-xl hover:shadow-slate-900/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send message'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Contact info + hours */}
          <div className="lg:col-span-5 space-y-5">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex items-start gap-4 hover:shadow-slate-200/60 transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  {info.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{info.title}</h3>
                  {info.link !== '#' ? (
                    <a href={info.link} className="text-slate-600 hover:text-blue-600 transition-colors break-all">
                      {info.content}
                    </a>
                  ) : (
                    <p className="text-slate-600">{info.content}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Business hours</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Monday – Friday</span>
                  <span>9:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Saturday</span>
                  <span>10:00 AM – 4:00 PM</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial section */}
        <div className="mt-14">
          <TestimonialForm />
        </div>
      </section>
    </div>
  );
};

export default Contact;
