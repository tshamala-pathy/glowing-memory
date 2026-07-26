import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatarUrl } from '../../utils/userAvatar';
import {
  CLIENT_WORKSPACE_NAV,
  WorkspaceNavIcon,
  getWorkspaceAccent,
} from '../../constants/clientWorkspaceNav';

const isNavActive = (pathname, to) => {
  if (to === '/profile') {
    return pathname === '/profile' || pathname.startsWith('/profile/');
  }
  return pathname === to || pathname.startsWith(`${to}/`);
};

const SidebarNavLink = ({ item, active, onNavigate }) => {
  const accent = getWorkspaceAccent(item.accent);

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? accent.sidebarActive
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
      }`}
    >
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          active ? accent.sidebarActiveIcon : accent.sidebarIcon
        }`}
      >
        <WorkspaceNavIcon name={item.icon} className="w-4 h-4" />
      </span>
      <span className="leading-tight">{item.label}</span>
    </Link>
  );
};

const ClientWorkspaceLayout = ({ title, description, children, actions }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Account';
  const userInitial = user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U';
  const avatarUrl = getUserAvatarUrl(user);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    logout();
    navigate('/');
  };

  const sidebar = (
    <>
      <div className="shrink-0 px-5 pt-6 pb-5 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={closeSidebar}>
          <img
            src="/pathycode-logo.png"
            alt="PathyCode"
            className="h-8 w-auto brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity"
          />
          <div>
            <p className="text-sm font-bold text-white tracking-tight">PathyCode</p>
            <p className="text-[11px] text-violet-300/80 font-medium">Client workspace</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Workspace">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>
        {CLIENT_WORKSPACE_NAV.map((item) => (
          <SidebarNavLink
            key={item.to}
            item={item}
            active={isNavActive(location.pathname, item.to)}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>

      <div className="shrink-0 mt-auto p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
        <div className="flex items-center gap-3 px-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-violet-500/30" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-violet-500/30">
              {userInitial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-200 transition-colors"
        >
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
            <WorkspaceNavIcon name="signOut" className="w-4 h-4" />
          </span>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 min-h-screen bg-slate-900 border-r border-slate-800">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={closeSidebar}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full min-h-0 bg-slate-900 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-0.5 p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Open workspace menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <nav className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Link to="/profile" className="hover:text-violet-700 transition-colors font-medium">
                      Dashboard
                    </Link>
                    <span aria-hidden className="text-slate-300">/</span>
                    <span className="text-slate-800 font-medium truncate">{title}</span>
                  </nav>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                  {description && (
                    <p className="mt-1 text-sm text-slate-600 max-w-2xl">{description}</p>
                  )}
                </div>
              </div>
              {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ClientWorkspaceLayout;
