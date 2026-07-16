import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

/**
 * Curated photography — cohesive cool neutrals + warm accents (Unsplash).
 * Local asset adds texture without extra network for one band.
 */
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=88',
  heroAccent: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=88',
  approach: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=88',
  cta: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2400&q=88',
  empty: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=85',
  craft: '/blog/hero-writing-desk.jpg',
};

const PLACEHOLDER_BY_THEME = {
  web: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1200&q=85',
  backend: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85',
  support: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a4?auto=format&fit=crop&w=1200&q=85',
  mobile: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=85',
  default: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85',
};

const DELIVERY_STEPS = [
  {
    title: 'Discovery',
    blurb: 'Goals, constraints, and success metrics captured up front.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
  },
  {
    title: 'Design & build',
    blurb: 'Iterative delivery with visible progress and room for feedback.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    ),
  },
  {
    title: 'Launch',
    blurb: 'Hardening, documentation, and a clean handover you can own.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
  },
  {
    title: 'Support',
    blurb: 'Optional care plans for improvements, fixes, and scaling.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    ),
  },
];

const getPlaceholderTheme = (service) => {
  const blob = `${(service.name || '').toLowerCase()} ${(service.description || '').toLowerCase()}`;
  if (blob.includes('mobile') || blob.includes('app')) return 'mobile';
  if (
    blob.includes('web') ||
    blob.includes('frontend') ||
    blob.includes('website') ||
    blob.includes('ui') ||
    blob.includes('responsive')
  ) {
    return 'web';
  }
  if (
    blob.includes('backend') ||
    blob.includes('api') ||
    blob.includes('server') ||
    blob.includes('database') ||
    blob.includes('django')
  ) {
    return 'backend';
  }
  if (
    blob.includes('maintenance') ||
    blob.includes('support') ||
    blob.includes('consulting') ||
    blob.includes('devops')
  ) {
    return 'support';
  }
  return 'default';
};

const getServicePlaceholderUrl = (service) => PLACEHOLDER_BY_THEME[getPlaceholderTheme(service)];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/');
      const data = response.data?.results ?? response.data ?? [];
      const list = Array.isArray(data) ? data : [];
      setServices(list);
      setError('');
    } catch (err) {
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      } else {
        const errorMessage =
          err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to fetch services';
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (service) => {
    const theme = getPlaceholderTheme(service);
    const cls = 'h-full w-full';
    if (theme === 'web') {
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    if (theme === 'backend') {
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      );
    }
    if (theme === 'support') {
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    if (theme === 'mobile') {
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  };

  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof features === 'string' ? features.split(',').map((f) => f.trim()).filter((f) => f) : [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f4f1]">
        <div className="relative h-[min(72vh,560px)] overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-300 via-slate-200 to-stone-200" />
          <div className="absolute inset-0 bg-slate-900/20" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-12 h-4 w-32 animate-pulse rounded-full bg-slate-300/80" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div
                key={k}
                className="overflow-hidden rounded-[1.35rem] border border-slate-200/60 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)]"
              >
                <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
                <div className="space-y-4 p-7">
                  <div className="h-5 w-2/3 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-lg bg-slate-50" />
                  <div className="h-10 animate-pulse rounded-lg bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4f1] px-4">
        <div className="max-w-md text-center">
          <div className="rounded-2xl border border-red-200/80 bg-white p-8 shadow-lg shadow-slate-200/40">
            <svg className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Error Loading Services</h2>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedServices = [...services].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f6f4f1] text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(120,113,108,0.08),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_20%,rgba(14,165,233,0.06),transparent_50%),radial-gradient(ellipse_60%_45%_at_0%_90%,rgba(99,102,241,0.05),transparent_50%)]"
        aria-hidden
      />

      <main>
        <header className="relative">
          <div className="absolute inset-0 min-h-[min(92vh,620px)]">
            <img
              src={IMAGES.hero}
              alt="Modern workspace with natural light"
              className="h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-slate-950/75 to-slate-900/55" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-transparent to-slate-950/50" aria-hidden />
            <div
              className="absolute inset-0 opacity-[0.35] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M0%2038.59l2.83-2.83%201.41%201.41L1.41%2040H0v-1.41zM0%201.4l2.83%202.83%201.41-1.41L1.41%200H0v1.41zM38.59%2040l-2.83-2.83%201.41-1.41L40%2038.59V40h-1.41zM40%201.41l-2.83%202.83-1.41-1.41L38.59%200H40v1.41zM20%2018.6l2.83-2.83%201.41%201.41L21.41%2020l2.83%202.83-1.41%201.41L20%2021.41l-2.83%202.83-1.41-1.41L18.59%2020l-2.83-2.83%201.41-1.41L20%2018.59z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
              aria-hidden
            />
          </div>

          <div className="relative z-10 mx-auto grid min-h-[min(88vh,600px)] max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-28 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-20 lg:pt-32">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/95 backdrop-blur-md sm:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.85)]" aria-hidden />
                Services
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Thoughtful builds for teams that care about quality
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-200/95 sm:text-xl">
                From crisp product interfaces to dependable APIs and backends — we ship work that feels as good as it
                looks, with clear communication at every step.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#offerings"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-stone-100"
                >
                  Browse offerings
                </a>
                <Link
                  to="/contact"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  Start a conversation
                </Link>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:ml-auto lg:mr-0">
                <div
                  className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-sky-400/25 via-white/10 to-amber-200/20 opacity-80 blur-2xl"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-[1.35rem] border border-white/20 shadow-2xl shadow-black/40 ring-1 ring-white/10">
                  <img
                    src={IMAGES.heroAccent}
                    alt="City skyline representing scale and ambition"
                    className="aspect-[4/5] w-full object-cover object-[center_30%] sm:aspect-[5/6]"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" aria-hidden />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/90">What you can expect</p>
                    <ul className="mt-4 space-y-3 text-sm font-medium text-white/95">
                      <li className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-200">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        Calm project rhythm with visible milestones
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-200">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        Production-minded engineering decisions
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-200">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        Documentation you can actually use
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section
          className="relative z-20 -mt-6 border-y border-stone-200/80 bg-white/90 shadow-sm shadow-stone-200/30 backdrop-blur-md sm:-mt-10"
          aria-labelledby="delivery-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="mx-auto mb-8 max-w-2xl text-center lg:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Process</p>
              <h2 id="delivery-heading" className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                How we deliver
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Four clear phases so you always know where things stand — from discovery through optional ongoing support.
              </p>
            </div>
            <ol className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {DELIVERY_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="relative flex h-full flex-col rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white shadow-md shadow-sky-900/15"
                      aria-hidden
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        {step.icon}
                      </svg>
                    </span>
                    <span className="min-w-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-600 ring-1 ring-stone-200/80">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{step.blurb}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-stone-200/60 bg-gradient-to-br from-white via-[#faf8f5] to-stone-100/80">
          <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
            <div className="relative min-h-[280px] lg:min-h-[420px]">
              <img
                src={IMAGES.approach}
                alt="Team collaborating at a laptop"
                className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900/55 via-stone-900/25 to-stone-900/10 lg:from-stone-900/40 lg:via-transparent lg:to-transparent" aria-hidden />
            </div>
            <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">How we partner</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Precision without the jargon
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                You get direct access to the people doing the work — clear estimates, honest trade-offs, and builds that
                age well as your product grows.
              </p>
              <ul className="mt-8 space-y-4 text-slate-700">
                {[
                  'Security and performance considered from day one, not bolted on later.',
                  'APIs and admin tools your team can operate without a manual.',
                  'Flexible engagement: scoped projects or ongoing product support.',
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="relative border-b border-stone-200/60 bg-[#f0ebe3]/50">
          <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2 lg:[direction:rtl]">
            <div className="relative min-h-[240px] [direction:ltr] lg:min-h-[360px]">
              <img
                src={IMAGES.craft}
                alt="Writing and planning at a desk"
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-stone-900/35 to-transparent lg:from-stone-900/25" aria-hidden />
            </div>
            <div className="flex flex-col justify-center px-6 py-12 [direction:ltr] sm:px-10 lg:px-14 lg:py-16">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Craft, documented</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-slate-600">
                Every engagement ends with something your stakeholders can understand: readable specs, handover notes,
                and a codebase structured for the next developer — whether that is us or your in-house team.
              </p>
              <Link
                to="/about"
                className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-sky-800 transition hover:text-sky-950"
              >
                Read more about us
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="relative pb-20 pt-14 sm:pb-24 sm:pt-16" aria-labelledby="services-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {sortedServices.length === 0 ? (
              <div id="offerings" className="scroll-mt-24 overflow-hidden rounded-[1.5rem] bg-white shadow-xl shadow-stone-300/40 ring-1 ring-stone-200/80">
                <div className="grid md:grid-cols-2">
                  <div className="relative min-h-[240px] md:min-h-[300px]">
                    <img
                      src={IMAGES.empty}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/45 to-slate-950/35" aria-hidden />
                  </div>
                  <div className="flex flex-col justify-center bg-white p-8 md:p-12">
                    <h2 id="services-heading" className="text-2xl font-semibold text-slate-900 md:text-3xl">
                      No services listed yet
                    </h2>
                    <p className="mt-4 leading-relaxed text-slate-600">
                      We&apos;re updating this page. In the meantime, tell us what you need — we&apos;ll propose a tailored
                      approach.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link
                        to="/contact"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800"
                      >
                        Contact us
                      </Link>
                      <Link to="/pricing" className="text-center text-base font-semibold text-sky-800 hover:text-sky-950 sm:pl-2">
                        View pricing overview →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div id="offerings" className="scroll-mt-24 mb-12 max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Offerings</p>
                  <h2 id="services-heading" className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Capabilities shaped around your roadmap
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-slate-600">
                    Open any card for the full story — scope notes, feature lists, and how to engage. Images preview the
                    flavour of each line of work.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                  {sortedServices.map((service) => {
                    const features = parseFeatures(service.features);
                    const fallbackPhoto = getServicePlaceholderUrl(service);
                    return (
                      <Link
                        key={service.id}
                        to={`/services/${service.id}`}
                        className="group block h-full rounded-[1.35rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f4f1]"
                      >
                        <article className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-stone-200/80 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.03] transition duration-300 hover:-translate-y-1 hover:border-sky-200/90 hover:shadow-[0_32px_70px_-24px_rgba(14,116,144,0.22)]">
                          <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                            <img
                              src={service.image ? getMediaUrl(service.image) : fallbackPhoto}
                              alt=""
                              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackPhoto;
                              }}
                              aria-hidden
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-stone-950/10 to-transparent opacity-90"
                              aria-hidden
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <div className="flex items-end justify-between gap-3">
                                <h3 className="text-xl font-semibold leading-snug text-white drop-shadow sm:text-[1.35rem]">
                                  {service.name}
                                </h3>
                                {service.is_featured && (
                                  <span className="shrink-0 rounded-full bg-amber-300/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-md">
                                    Featured
                                  </span>
                                )}
                              </div>
                              {service.price != null && parseFloat(service.price) > 0 && (
                                <p className="mt-2 text-sm font-medium text-white/90">
                                  From{' '}
                                  <span className="font-semibold text-white">
                                    R {parseFloat(service.price).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                                  </span>{' '}
                                  ZAR
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-6 sm:p-7">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-800 text-white shadow-lg shadow-sky-900/20">
                                <div className="h-6 w-6">{getServiceIcon(service)}</div>
                              </div>
                              <p className="flex-1 text-[15px] leading-relaxed text-slate-600 line-clamp-3 sm:text-base">
                                {service.short_description || service.description}
                              </p>
                            </div>

                            {features.length > 0 && (
                              <ul className="mt-6 space-y-2.5 border-t border-stone-100 pt-6">
                                {features.slice(0, 3).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                                    <svg
                                      className="mt-0.5 h-5 w-5 shrink-0 text-sky-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-hidden
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{feature}</span>
                                  </li>
                                ))}
                                {features.length > 3 && (
                                  <li className="pl-8 text-sm text-slate-500">+{features.length - 3} more in full details</li>
                                )}
                              </ul>
                            )}

                            {service.categories && Array.isArray(service.categories) && service.categories.length > 0 && (
                              <div className="mt-5 flex flex-wrap gap-2">
                                {service.categories.slice(0, 3).map((category, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-stone-200/80"
                                  >
                                    {typeof category === 'object' ? category.name : category}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-6">
                              <span className="text-sm font-semibold text-sky-900 group-hover:text-sky-950">
                                View full service
                              </span>
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-800 transition group-hover:bg-sky-700 group-hover:text-white">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {sortedServices.length > 0 && (
              <div className="relative mt-16 overflow-hidden rounded-[1.5rem] shadow-2xl shadow-stone-400/30 ring-1 ring-white/20 sm:mt-20">
                <img
                  src={IMAGES.cta}
                  alt="Professionals in a meeting"
                  className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-indigo-950/82 to-slate-950/92" aria-hidden />
                <div
                  className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_15%,rgba(255,255,255,0.12),transparent_60%)]"
                  aria-hidden
                />
                <div className="relative z-10 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/90">Next step</p>
                  <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    Need a tailored blend of services?
                  </h2>
                  <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-200/95">
                    We assemble the right mix for your goals, budget, and timeline — then keep you in the loop as we
                    ship.
                  </p>
                  <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      to="/contact"
                      className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-xl transition hover:bg-stone-100"
                    >
                      Talk to us
                    </Link>
                    <Link
                      to="/pricing"
                      className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-2xl border-2 border-white/80 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
                    >
                      See pricing
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Services;
