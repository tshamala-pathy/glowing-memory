import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/formatters';
import { useDropdownPosition } from '../utils/dropdownPortal';
import { useNotifications } from '../hooks/useNotifications';

const DEFAULT_ICON =
  'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';

const EVENT_ICONS = {
  quote_submitted: 'M12 4v16m8-8H4',
  quote_reviewed: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  quote_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  quote_rejected: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  quote_changes_requested: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  quote_paid: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  payment_completed: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  payment_failed: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  invoice_generated: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  invoice_paid: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  invoice_overdue: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  project_created: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  project_updated: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  project_completed: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  task_assigned: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  task_completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  task_updated: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  file_uploaded: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  calendar_event: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  new_message: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  thread_created: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
  testimonial_submitted: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  testimonial_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  profile_updated: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  password_changed: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  email_changed: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  contact_submitted: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  newsletter_subscribed: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  user_registered: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
};

const NotificationDropdown = ({ variant = 'default', pollMs = 60000 }) => {
  const [open, setOpen] = useState(false);
  const { items, unread, loading, error, load, markRead, markAllRead, removeNotification } = useNotifications({ pollMs });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const ref = useRef(null);
  const isAdmin = variant === 'admin';
  const dropdownStyle = useDropdownPosition(buttonRef, open, {
    minWidth: 320,
    maxWidth: 384,
    align: 'right',
    zIndex: 9999,
  });

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current?.contains(e.target) || panelRef.current?.contains(e.target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleViewClick = (notification) => {
    if (!notification.is_read) {
      markRead(notification.id).catch(() => {});
    }
    setOpen(false);
  };

  const buttonClass = isAdmin
    ? 'relative flex items-center gap-2 px-3 py-2 rounded-lg text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors border border-red-200 bg-red-50/60'
    : 'relative p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors';

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className={buttonClass}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {isAdmin && <span className="text-sm font-semibold hidden sm:inline">Alerts</span>}
        {unread > 0 && (
          <span className={`absolute ${isAdmin ? '-top-1 -right-1' : 'top-1 right-1'} min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold ring-2 ring-white`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && dropdownStyle &&
        createPortal(
          <div
            ref={panelRef}
            style={dropdownStyle}
            className="bg-white rounded-xl shadow-xl border border-red-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{unread} unread</span>
              )}
            </div>
            {unread > 0 && (
              <div className="px-4 py-2 border-b border-red-50 bg-red-50/50 text-right">
                <button type="button" onClick={() => markAllRead()} className="text-xs font-medium text-red-700 hover:text-red-900">
                  Mark all read
                </button>
              </div>
            )}
            <div className="max-h-80 overflow-y-auto">
              {loading && items.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">Loading…</p>
              ) : error && items.length === 0 ? (
                <p className="p-4 text-sm text-red-600 text-center">{error}</p>
              ) : items.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">No notifications yet</p>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-red-50/80 hover:bg-red-50/30 transition-colors ${n.is_read ? 'opacity-65' : 'bg-red-50/70 border-l-2 border-l-red-500'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={EVENT_ICONS[n.event_type] || DEFAULT_ICON} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {n.link && (
                          <Link
                            to={n.link}
                            state={{ notificationId: n.id }}
                            onClick={() => handleViewClick(n)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
                          >
                            View
                          </Link>
                        )}
                        {!n.is_read && (
                          <button type="button" onClick={() => markRead(n.id)} className="text-xs text-gray-500 hover:text-gray-800">
                            Mark read
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              const result = await removeNotification(n.id);
                              if (result?.error) alert(result.error);
                            }}
                            className="text-xs text-gray-500 hover:text-red-700"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default NotificationDropdown;
