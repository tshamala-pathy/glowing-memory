import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';
import AccountDropdown from './AccountDropdown';

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact', hideForSuperuser: true },
  { to: '/blog', label: 'Blog', clientOnly: true },
];

const DesktopNavLink = ({ to, label, active, guest }) => (
  <Link
    to={to}
    className={`relative px-3.5 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-lg ${
      guest
        ? active
          ? 'text-amber-300 bg-white/10'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
        : active
          ? 'text-amber-700 bg-amber-50'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    {label}
    {active && !guest && (
      <span className="absolute bottom-1 left-3.5 right-3.5 h-0.5 bg-amber-500 rounded-full" aria-hidden />
    )}
  </Link>
);

const MobileNavLink = ({ to, label, active, onClick, guest }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
      guest
        ? active
          ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
          : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
        : active
          ? 'bg-amber-50 text-amber-800 border-l-2 border-amber-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
    }`}
  >
    {label}
    {active && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${guest ? 'bg-amber-400' : 'bg-amber-600'}`} aria-hidden />}
  </Link>
);

const CLIENT_WORKSPACE_LINKS = [
  { to: '/profile', label: 'Profile' },
  { to: '/files', label: 'Files' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Calendar' },
];

const mobileLinkClass = (active, guest = false) =>
  guest
    ? `block px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
        active ? 'bg-amber-500/20 text-amber-200' : 'text-slate-300 hover:bg-white/5'
      }`
    : `block px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
        active
          ? 'bg-amber-50 text-amber-800 border-l-2 border-amber-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
      }`;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isClient = isAuthenticated && user?.is_superuser !== true;
  const isSuperuser = isAuthenticated && user?.is_superuser === true;
  const isGuest = !isAuthenticated;

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const visiblePublicLinks = PUBLIC_LINKS.filter((link) => {
    if (link.hideForSuperuser && isSuperuser) return false;
    if (link.clientOnly && !isClient) return false;
    return true;
  });

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 overflow-visible">
      {/* Accent line */}
      <div
        className={`h-0.5 w-full ${
          isGuest
            ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600'
            : 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600'
        }`}
        aria-hidden
      />

      <nav
        className={`overflow-visible transition-colors duration-300 ${
          isGuest
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-lg shadow-slate-950/30'
            : 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          <div className="flex items-center h-[4.25rem] gap-3 lg:gap-4 overflow-visible">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/pathycode-logo.png"
                alt="PathyCode logo"
                className="h-9 w-auto transform group-hover:scale-105 transition-transform drop-shadow-sm"
              />
              <span
                className={`text-lg font-bold hidden sm:block tracking-tight ${
                  isGuest ? 'text-white' : 'text-slate-900'
                }`}
              >
                PathyCode
              </span>
            </Link>

            {/* Desktop nav */}
            <nav
              className={`hidden md:flex items-center gap-0.5 shrink-0 pl-3 ml-1 ${
                isGuest ? 'border-l border-white/10' : 'border-l border-slate-200'
              }`}
              aria-label="Main navigation"
            >
              {visiblePublicLinks.map((link) => (
                <DesktopNavLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  active={isActive(link.to, link.exact)}
                  guest={isGuest}
                />
              ))}
            </nav>

            <div className="flex-1 min-w-2" aria-hidden />

            {/* Search + actions */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0 overflow-visible">
              <div className="w-48 lg:w-56 xl:w-64 overflow-visible">
                <SearchBar className="w-full" variant={isGuest ? 'dark' : 'light'} />
              </div>

              {isAuthenticated ? (
                <>
                  {isSuperuser && (
                    <Link
                      to="/admin"
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive('/admin')
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                  <NotificationDropdown />
                  <AccountDropdown />
                </>
              ) : (
                <div className="flex items-center gap-2 pl-1">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-full transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-600/25 hover:shadow-amber-500/30 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden flex items-center gap-1">
              {isAuthenticated && (
                <>
                  <NotificationDropdown />
                  <AccountDropdown />
                </>
              )}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isGuest ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div
              className={`md:hidden py-4 fade-in max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t ${
                isGuest ? 'border-white/10 bg-slate-900/95' : 'border-slate-200'
              }`}
            >
              <div className="px-4 mb-5">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                    isGuest ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Search
                </p>
                <SearchBar className="w-full" variant={isGuest ? 'dark' : 'light'} />
              </div>

              <p
                className={`px-4 text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isGuest ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Navigation
              </p>
              <div className="space-y-1 px-2 mb-4">
                {visiblePublicLinks.map((link) => (
                  <MobileNavLink
                    key={link.to}
                    to={link.to}
                    label={link.label}
                    active={isActive(link.to, link.exact)}
                    onClick={closeMobileMenu}
                    guest={isGuest}
                  />
                ))}
              </div>

              {isAuthenticated && isClient && (
                <>
                  <p className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    My workspace
                  </p>
                  <div className="space-y-0.5 mb-4 px-2">
                    {CLIENT_WORKSPACE_LINKS.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={mobileLinkClass(isActive(link.to))}
                        onClick={closeMobileMenu}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {isAuthenticated && isSuperuser && (
                <div className="px-4 mb-4">
                  <Link
                    to="/admin"
                    className={mobileLinkClass(isActive('/admin'))}
                    onClick={closeMobileMenu}
                  >
                    Admin Panel
                  </Link>
                </div>
              )}

              {isGuest && (
                <div className="px-4 pt-4 mt-2 border-t border-white/10 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-3 text-center text-slate-200 font-medium border border-white/20 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full px-4 py-3 text-center font-semibold text-white rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-600/20 transition-all"
                    onClick={closeMobileMenu}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
