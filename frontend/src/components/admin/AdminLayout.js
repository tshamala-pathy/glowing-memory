import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../NotificationDropdown';
import AccountDropdown from '../AccountDropdown';

const NavIcon = ({ name, className = 'w-5 h-5' }) => {
  const icons = {
    dashboard: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    projects: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    ),
    blog: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    services: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
    ),
    testimonials: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    ),
    about: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    caseStudies: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    contact: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
    newsletter: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    ),
    threads: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    ),
    quotes: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    invoices: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5 3h.01M19 10V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0013.586 3H10a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2v-3" />
    ),
    financial: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    tasks: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m-9 9h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
    users: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
    clients: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    clientProjects: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    ),
  };

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
};

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', path: '/admin', icon: 'dashboard' }],
  },
  {
    label: 'Content & Site',
    items: [
      { name: 'Projects', path: '/admin/projects', icon: 'projects' },
      { name: 'Blog Posts', path: '/admin/blog', icon: 'blog' },
      { name: 'Services', path: '/admin/services', icon: 'services' },
      { name: 'Testimonials', path: '/admin/testimonials', icon: 'testimonials' },
      { name: 'About Us', path: '/admin/about', icon: 'about' },
      { name: 'Case Studies', path: '/admin/case-studies', icon: 'caseStudies' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { name: 'Contact Messages', path: '/admin/contact', icon: 'contact' },
      { name: 'Newsletter', path: '/admin/newsletter', icon: 'newsletter' },
      { name: 'Message Threads', path: '/admin/messaging-threads', icon: 'threads' },
    ],
  },
  {
    label: 'Business',
    items: [
      { name: 'Quotes', path: '/admin/quotes', icon: 'quotes' },
      { name: 'Invoices', path: '/admin/invoices', icon: 'invoices' },
      { name: 'Financial Dashboard', path: '/admin/financial', icon: 'financial' },
      { name: 'Tasks', path: '/admin/tasks', icon: 'tasks' },
    ],
  },
  {
    label: 'Clients & Users',
    items: [
      { name: 'Users', path: '/admin/users', icon: 'users' },
      { name: 'Clients', path: '/admin/clients', icon: 'clients' },
      { name: 'Client Projects', path: '/admin/client-projects', icon: 'clientProjects' },
    ],
  },
];

const AdminLayout = ({ children, allowStaff = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const hasAccess = user?.is_superuser === true || (allowStaff && user?.is_staff === true);
    if (user && !hasAccess) {
      navigate('/profile');
      return;
    }
  }, [isAuthenticated, user, navigate, allowStaff]);

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to sign out of the admin panel?');
    if (!confirmed) return;
    logout();
    navigate('/login');
  };

  const hasAccess = user?.is_superuser === true || (allowStaff && user?.is_staff === true);
  if (!isAuthenticated || !user || !hasAccess) {
    return null;
  }

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const closeSidebarOnNavigate = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200 fixed w-full top-0 z-[100]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/pathycode-logo.png" alt="PathyCode logo" className="h-8 w-auto hidden sm:block" />
                <div>
                  <span className="text-sm font-bold text-slate-900 leading-tight block">PathyCode Admin</span>
                  <span className="text-[11px] text-slate-500 leading-tight hidden sm:block">Control panel</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium hidden sm:inline">
                View Site
              </Link>
              <Link
                to="/profile"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium hidden lg:inline"
              >
                Account settings
              </Link>
              <NotificationDropdown variant="admin" pollMs={30000} />
              <AccountDropdown />
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 pt-16 lg:pt-0 transition-transform duration-300 ease-in-out flex flex-col`}
        >
          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={closeSidebarOnNavigate}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            active
                              ? 'bg-white text-slate-900 font-medium shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <NavIcon
                            name={item.icon}
                            className={`w-5 h-5 flex-shrink-0 ${active ? 'text-slate-700' : 'text-slate-400 group-hover:text-white'}`}
                          />
                          <span className="text-sm leading-tight">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 text-center">PathyCode Admin Panel</p>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
