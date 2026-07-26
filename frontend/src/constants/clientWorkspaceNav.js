/** Shared client workspace navigation (Dashboard, Files, Tasks, Calendar). */
export const CLIENT_WORKSPACE_NAV = [
  {
    to: '/profile',
    label: 'Dashboard',
    icon: 'dashboard',
    description: 'Overview, quotes & invoices',
    accent: 'violet',
  },
  {
    to: '/files',
    label: 'Files',
    icon: 'files',
    description: 'Shared project documents',
    accent: 'amber',
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: 'tasks',
    description: 'Progress & due dates',
    accent: 'emerald',
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: 'calendar',
    description: 'Meetings & deadlines',
    accent: 'sky',
  },
];

export const WORKSPACE_ACCENT_STYLES = {
  violet: {
    sidebarIcon: 'bg-violet-500/20 text-violet-300',
    sidebarActive: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/30',
    sidebarActiveIcon: 'bg-white/20 text-white',
    dropdownIcon: 'bg-violet-100 text-violet-600',
    dropdownActive: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md',
    dropdownActiveIcon: 'bg-white/20 text-white',
  },
  amber: {
    sidebarIcon: 'bg-amber-500/20 text-amber-300',
    sidebarActive: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-950/30',
    sidebarActiveIcon: 'bg-white/20 text-white',
    dropdownIcon: 'bg-amber-100 text-amber-700',
    dropdownActive: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md',
    dropdownActiveIcon: 'bg-white/20 text-white',
  },
  emerald: {
    sidebarIcon: 'bg-emerald-500/20 text-emerald-300',
    sidebarActive: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/30',
    sidebarActiveIcon: 'bg-white/20 text-white',
    dropdownIcon: 'bg-emerald-100 text-emerald-700',
    dropdownActive: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md',
    dropdownActiveIcon: 'bg-white/20 text-white',
  },
  sky: {
    sidebarIcon: 'bg-sky-500/20 text-sky-300',
    sidebarActive: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-950/30',
    sidebarActiveIcon: 'bg-white/20 text-white',
    dropdownIcon: 'bg-sky-100 text-sky-700',
    dropdownActive: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md',
    dropdownActiveIcon: 'bg-white/20 text-white',
  },
};

export const getWorkspaceAccent = (accentKey) =>
  WORKSPACE_ACCENT_STYLES[accentKey] || WORKSPACE_ACCENT_STYLES.violet;

export const WorkspaceNavIcon = ({ name, className = 'w-5 h-5' }) => {
  const icons = {
    dashboard: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    ),
    files: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
    tasks: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
    calendar: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    signOut: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    ),
  };

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {icons[name]}
    </svg>
  );
};
