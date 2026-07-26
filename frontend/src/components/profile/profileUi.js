import React, { useEffect, useState } from 'react';

const PROFILE_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&q=85';

export const PROFILE_IMAGES = {
  overview: PROFILE_IMAGE_FALLBACK,
  messages: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=85',
  quotes: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=85',
  invoices: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=85',
  projects: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=85',
  testimonials: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1920&q=85',
  settings: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=85',
  workspace: PROFILE_IMAGE_FALLBACK,
  activity: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
};

export const ProfileBannerImage = ({ src, className = 'absolute inset-0 w-full h-full object-cover' }) => {
  const [bannerSrc, setBannerSrc] = useState(src || PROFILE_IMAGE_FALLBACK);

  useEffect(() => {
    setBannerSrc(src || PROFILE_IMAGE_FALLBACK);
  }, [src]);

  return (
    <img
      src={bannerSrc}
      alt=""
      aria-hidden="true"
      className={className}
      onError={() => {
        if (bannerSrc !== PROFILE_IMAGE_FALLBACK) {
          setBannerSrc(PROFILE_IMAGE_FALLBACK);
        }
      }}
    />
  );
};

export const ProfileTabBanner = ({ image, eyebrow, title, subtitle, icon, children, accent = 'from-slate-950/85 via-slate-900/70 to-teal-900/45' }) => (
  <div className="mb-8 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-900/5">
    <div className="relative min-h-[200px] sm:min-h-[240px]">
      <ProfileBannerImage src={image} />
      <div className={`absolute inset-0 bg-gradient-to-r ${accent}`} />
      <div className="relative px-6 py-8 sm:px-8 sm:py-10 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            {icon && (
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-lg backdrop-blur-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-teal-200/95 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2">{eyebrow}</p>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-3 text-sm sm:text-base text-slate-200/95 leading-relaxed max-w-2xl">{subtitle}</p>
              )}
            </div>
          </div>
          {children && <div className="flex flex-wrap items-center gap-3 lg:justify-end">{children}</div>}
        </div>
      </div>
    </div>
  </div>
);

export const ProfileSectionCard = ({ title, icon, iconBg = 'bg-teal-50', iconColor = 'text-teal-700', children, className = '' }) => (
  <div className={`bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-900/[0.03] ${className}`}>
    <div className="px-6 sm:px-8 py-4 border-b border-slate-100 bg-gradient-to-r from-[#faf9f7] to-white">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 sm:p-8">{children}</div>
  </div>
);

export const ProfileEmptyState = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 text-teal-700 flex items-center justify-center mb-4 ring-1 ring-teal-100">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm max-w-md leading-relaxed mb-6">{message}</p>
    {action}
  </div>
);

export const ProfileLoadingState = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-sm font-medium text-slate-600">{label}</p>
  </div>
);

export const ProfileStatPill = ({ count, label }) => (
  <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur-sm min-w-[5.5rem]">
    <p className="text-2xl font-bold tabular-nums text-white">{count}</p>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-100/90">{label}</p>
  </div>
);
