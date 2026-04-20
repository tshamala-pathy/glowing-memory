import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const publicUrl = process.env.PUBLIC_URL || '';

const IMAGES = {
  /** Flow of updates / insights — “in the loop” */
  loop: `${publicUrl}/newsletter/loop-insights.jpg`,
  /** Inbox / mail — newsletter delivery */
  mail: `${publicUrl}/newsletter/hero-newsletter.jpg`,
};

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
        const errorMessage =
          err.response?.data?.detail ||
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero: loop imagery + copy */}
      <header className="relative overflow-hidden border-b border-slate-100/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="order-2 space-y-6 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Updates on repeat
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[2.75rem] lg:leading-tight">
              Newsletter
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-600 sm:text-xl">
              Stay in the loop with the latest updates, insights, and exclusive content.
            </p>
            <p className="flex flex-wrap items-center gap-2 text-base text-slate-500">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              No spam. Unsubscribe anytime.
            </p>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
                <img
                  src={IMAGES.mail}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  width={224}
                  height={160}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Straight to your inbox</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  One email when it matters—product notes, stories, and tips in a single thread you can skim or save.
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-200/60 blur-2xl sm:h-32 sm:w-32" aria-hidden />
              <div className="absolute -bottom-6 -left-4 h-20 w-20 rounded-full bg-slate-300/40 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-3xl bg-slate-100 shadow-xl ring-1 ring-slate-200/80">
                <img
                  src={IMAGES.loop}
                  alt="Insights and updates flowing in a continuous loop"
                  className="aspect-[4/3] w-full object-cover object-center sm:aspect-[5/4]"
                  loading="eager"
                  decoding="async"
                  width={1200}
                  height={960}
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-500 sm:text-left">
                A steady stream of what we&apos;re learning—so you stay in the loop.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] sm:p-10">
            {success ? (
              <div className="py-2 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <svg className="h-9 w-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">You&apos;re subscribed!</h2>
                <p className="mt-2 text-slate-600">Thanks for joining. We&apos;ll keep you updated.</p>
                <Link
                  to="/"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-slate-900">Subscribe</h2>
                  <p className="mt-1 text-sm text-slate-500">Enter your details below. We&apos;ll only send what&apos;s useful.</p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Name <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Subscribing...
                      </span>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </form>

                <p className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  We respect your privacy. Unsubscribe at any time with one click.
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
