import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">PathyCode</span>
            </Link>
          </div>

          {/* Desktop Navigation — top 4 only: Home, Services, Pricing, Contact */}
          <div className="hidden md:flex items-center gap-x-1 flex-1 mx-2 lg:mx-4 min-w-0">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isActive('/')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isActive('/services')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Services
            </Link>
            <Link
              to="/pricing"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isActive('/pricing')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isActive('/contact')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Contact
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/blog"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    isActive('/blog')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Blog
                </Link>
                <Link
                  to="/clients"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    isActive('/clients')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Clients
                </Link>
                <Link
                  to="/case-studies"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    isActive('/case-studies')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Case Studies
                </Link>
                <Link
                  to="/my-projects"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    isActive('/my-projects')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  My Projects
                </Link>
                <Link
                  to="/messages"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    isActive('/messages')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Messages
                </Link>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:block mx-4">
            <SearchBar />
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>
                {user?.is_superuser === true && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {user?.first_name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation — scrollable so it fits any device height */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Mobile Search Bar */}
            <div className="px-4 mb-4">
              <SearchBar />
            </div>
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Main</p>
            <div className="space-y-1">
              <Link
                to="/"
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/services"
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/services')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/pricing"
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/pricing')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/contact')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {isAuthenticated && (
                <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Portal</p>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    to="/blog"
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/blog')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    to="/clients"
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/clients')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Clients
                  </Link>
                  <Link
                    to="/case-studies"
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/case-studies')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Case Studies
                  </Link>
                  <Link
                    to="/my-projects"
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/my-projects')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Projects
                  </Link>
                  <Link
                    to="/messages"
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/messages')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                </>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/profile')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {user?.is_superuser === true && (
                    <Link
                      to="/admin"
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        isActive('/admin')
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <div className="px-4 py-3 border-t border-gray-200 mt-2">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-2 text-center text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full px-4 py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
