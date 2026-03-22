import React, { useState } from 'react';
import api from '../services/api';
import TestimonialForm from '../components/TestimonialForm';

const HERO_IMAGE = `${process.env.PUBLIC_URL || ''}/contact-hero.jpg`;

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to send message. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      title: 'Email',
      content: 'contact@pathycode.com',
      link: 'mailto:contact@pathycode.com',
    },
    {
      icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      title: 'Phone',
      content: '+27 12 345 6789',
      link: 'tel:+27123456789',
    },
    {
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      title: 'Location',
      content: 'South Africa',
      link: '#',
    },
  ];

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:border-slate-600 focus:ring-2 focus:ring-slate-600/20 outline-none transition placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative min-h-[38vh] overflow-hidden">
        {!heroImageError ? (
          <img
            src={HERO_IMAGE}
            alt="Contact us"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setHeroImageError(true)}
          />
        ) : null}
        <div
          className={`absolute inset-0 ${!heroImageError ? 'bg-slate-900/70' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-28 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-200 max-w-xl">
            Have a question or want to work together? We&apos;d love to hear from you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-slate-300/90 text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              We typically reply within 24 hours
            </span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 sm:px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Send us a message</h2>
                <p className="mt-1 text-slate-200">Fill out the form and we&apos;ll get back to you shortly.</p>
              </div>
              <div className="px-6 sm:px-8 py-8">
                {success && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-800 font-semibold">Message sent successfully</p>
                      <p className="text-emerald-700 text-sm mt-0.5">We&apos;ll get back to you as soon as possible.</p>
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
                        className={inputCls}
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
                        className={inputCls}
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
                      className={inputCls}
                      placeholder="What's this about?"
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
                      className={`${inputCls} resize-none`}
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold shadow-lg shadow-slate-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Contact info */}
          <div className="lg:col-span-5 space-y-5">
            {contactInfo.map((info, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex items-start gap-4 hover:shadow-xl hover:border-slate-200 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{info.title}</h3>
                  {info.link !== '#' ? (
                    <a
                      href={info.link}
                      className="text-slate-600 hover:text-slate-700 transition-colors break-all"
                    >
                      {info.content}
                    </a>
                  ) : (
                    <p className="text-slate-600">{info.content}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Business hours
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-slate-600">
                  <span className="font-medium">Monday – Friday</span>
                  <span>9:00 AM – 6:00 PM</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-slate-600">
                  <span className="font-medium">Saturday</span>
                  <span>10:00 AM – 4:00 PM</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-slate-600">
                  <span className="font-medium">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <TestimonialForm />
        </div>
      </section>
    </div>
  );
};

export default Contact;
