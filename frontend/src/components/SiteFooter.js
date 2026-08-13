import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FOOTER_LINKS = {
  company: [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/newsletter', label: 'Newsletter' },
  ],
  work: [
    { to: '/projects', label: 'Projects' },
    { to: '/services', label: 'Services' },
    { to: '/case-studies', label: 'Case Studies', auth: true },
    { to: '/clients', label: 'Clients', auth: true },
  ],
  resources: [
    { to: '/blog', label: 'Blog', auth: true },
    { to: '/requirements', label: 'Requirements' },
    { to: '/request-quote', label: 'Request a Quote', authOnly: true },
  ],
  account: [
    { to: '/login', label: 'Sign In', guestOnly: true },
    { to: '/register', label: 'Create Account', guestOnly: true },
    { to: '/profile', label: 'My Profile', authOnly: true },
    { to: '/portal', label: 'Client Portal', authOnly: true },
  ],
  legal: [
    { to: '/terms-and-privacy', label: 'Terms & Privacy' },
  ],
};

const FooterColumn = ({ title, links, isAuthenticated }) => (
  <div>
    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400/90 mb-4">{title}</h3>
    <ul className="space-y-2.5">
      {links
        .filter((link) => {
          if (link.guestOnly && isAuthenticated) return false;
          if (link.authOnly && !isAuthenticated) return false;
          return true;
        })
        .map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
    </ul>
  </div>
);

const SiteFooter = () => {
  const { isAuthenticated, user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-amber-500/30">
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" aria-hidden />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-5">
              <img
                src="/pathycode-logo.png"
                alt="PathyCode"
                className="h-10 w-auto group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-bold text-white tracking-tight">PathyCode</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-6">
              We design and build modern websites, applications, and digital solutions that help businesses grow.
            </p>
            <div className="space-y-2.5 text-sm">
              <a
                href="mailto:noreply@pathycodes.com"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                noreply@pathycodes.com
              </a>
              <p className="inline-flex items-center gap-2 text-slate-500">
                <MapPin className="w-4 h-4 shrink-0" />
                South Africa · Remote worldwide
              </p>
            </div>
          </div>

          <FooterColumn title="Company" links={FOOTER_LINKS.company} isAuthenticated={isAuthenticated} />
          <FooterColumn title="Our Work" links={FOOTER_LINKS.work} isAuthenticated={isAuthenticated} />
          <FooterColumn title="Resources" links={FOOTER_LINKS.resources} isAuthenticated={isAuthenticated} />
          <FooterColumn title="Account" links={FOOTER_LINKS.account} isAuthenticated={isAuthenticated} />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            &copy; {year} PathyCode. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {FOOTER_LINKS.legal.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-slate-400 hover:text-amber-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.is_superuser && (
              <Link to="/admin" className="text-slate-400 hover:text-amber-400 transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
