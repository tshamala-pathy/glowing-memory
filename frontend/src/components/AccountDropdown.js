import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getUserAvatarUrl } from '../utils/userAvatar';
import { useDropdownPosition } from '../utils/dropdownPortal';

const CLIENT_LINKS = [
  { to: '/profile', label: 'Dashboard' },
  { to: '/files', label: 'Files' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Calendar' },
];

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white';

const AccountDropdown = () => {
  const { user, logout, refreshUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ first_name: '', last_name: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const ref = useRef(null);
  const fileInputRef = useRef(null);

  const isClient = isAuthenticated && user?.is_superuser !== true;
  const isSuperuser = isAuthenticated && user?.is_superuser === true;

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Account';
  const userInitial = user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U';

  const dropdownStyle = useDropdownPosition(buttonRef, open, {
    minWidth: 340,
    maxWidth: 400,
    align: 'right',
  });

  const resetForm = useCallback(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setMessage({ type: '', text: '' });
  }, [user]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview]
  );

  if (!isAuthenticated || !user) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      formData.append('first_name', form.first_name.trim());
      formData.append('last_name', form.last_name.trim());
      formData.append('bio', form.bio.trim());
      if (avatarFile) formData.append('avatar', avatarFile);
      await api.patch('/users/profile/update/', formData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Your information was saved.' });
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.first_name?.[0] ||
        data?.last_name?.[0] ||
        data?.bio?.[0] ||
        data?.avatar?.[0] ||
        data?.detail ||
        'Could not save your changes. Please try again.';
      setMessage({ type: 'error', text: typeof msg === 'string' ? msg : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    setOpen(false);
    logout();
    navigate('/');
  };

  const avatarSrc = avatarPreview || getUserAvatarUrl(user);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative p-1 rounded-lg transition-colors ${
          open ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-100'
        }`}
        aria-label="My account"
        aria-expanded={open}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
            <span className="text-white text-sm font-semibold">{userInitial}</span>
          </div>
        )}
      </button>

      {open &&
        dropdownStyle &&
        createPortal(
          <div
            ref={panelRef}
            style={dropdownStyle}
            className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white">
              <p className="font-semibold text-sm">My account</p>
              <p className="text-xs text-blue-100/90 mt-0.5 truncate">{user.email}</p>
            </div>

            <div className="max-h-[min(32rem,calc(100vh-5rem))] overflow-y-auto">
              <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative shrink-0 group"
                    title="Change photo"
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-200" />
                    ) : (
                      <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white ring-2 ring-slate-200">
                        {userInitial}
                      </div>
                    )}
                    <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity">
                      Edit
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Profile photo appears on testimonials and across your account.
                    </p>
                    {isSuperuser && (
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="acct-first-name" className="block text-xs font-medium text-slate-600 mb-1">
                        First name
                      </label>
                      <input
                        id="acct-first-name"
                        type="text"
                        value={form.first_name}
                        onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                        className={inputClass}
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label htmlFor="acct-last-name" className="block text-xs font-medium text-slate-600 mb-1">
                        Last name
                      </label>
                      <input
                        id="acct-last-name"
                        type="text"
                        value={form.last_name}
                        onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                        className={inputClass}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="acct-bio" className="block text-xs font-medium text-slate-600 mb-1">
                      Bio
                    </label>
                    <textarea
                      id="acct-bio"
                      rows={2}
                      value={form.bio}
                      onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                      className={`${inputClass} resize-none`}
                      placeholder="A short note about you or your business"
                    />
                  </div>

                  {message.text && (
                    <p
                      className={`text-xs px-2 py-1.5 rounded-lg ${
                        message.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {message.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </form>

                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Password, email & full settings →
                </Link>
              </div>

              {isClient && (
                <div className="px-2 py-2 border-b border-slate-100">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Workspace
                  </p>
                  {CLIENT_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              {isSuperuser && (
                <div className="px-2 py-2 border-b border-slate-100">
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    Admin dashboard
                  </Link>
                </div>
              )}

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AccountDropdown;
