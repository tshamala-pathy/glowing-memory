import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { formatDate } from '../../utils/formatters';

const defaultFormData = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  bio: '',
  password: '',
  is_active: true,
  is_staff: false,
  is_superuser: false,
};

const AdminUsers = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [isAuthenticated, user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/admin/');
      setUsers(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEdit = (userItem) => {
    setEditingUser(userItem);
    setFormData({
      username: userItem.username || '',
      email: userItem.email || '',
      first_name: userItem.first_name || '',
      last_name: userItem.last_name || '',
      bio: userItem.bio || '',
      password: '',
      is_active: userItem.is_active !== undefined ? userItem.is_active : true,
      is_staff: userItem.is_staff || false,
      is_superuser: userItem.is_superuser || false,
    });
    setShowForm(true);
  };

  const handleDelete = (userItem) => {
    setDeleteDialog({ open: true, user: userItem });
  };

  const toggleSelect = (id) => {
    if (id === user?.id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const deletableIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);
    if (selectedIds.size === deletableIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableIds));
    }
  };

  const handleBulkDelete = () => setBulkDeleteDialog(true);

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await api.delete(`/users/admin/${id}/`);
      }
      setSelectedIds(new Set());
      setBulkDeleteDialog(false);
      fetchUsers();
    } catch {
      alert('Failed to delete some users. Please try again.');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/admin/${deleteDialog.user.id}/`);
      fetchUsers();
      setDeleteDialog({ open: false, user: null });
    } catch {
      alert('Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (editingUser && !submitData.password) delete submitData.password;
    if (submitData.password === '') delete submitData.password;

    if (!editingUser && !submitData.password) {
      alert('Password is required when creating a new user');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await api.put(`/users/admin/${editingUser.id}/`, submitData);
      } else {
        await api.post('/users/admin/', submitData);
      }
      fetchUsers();
      setShowForm(false);
      setEditingUser(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Failed to save user';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const deletableIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);

  const stats = [
    { label: 'Total', value: users.length },
    { label: 'Superusers', value: users.filter((u) => u.is_superuser).length },
    { label: 'Staff', value: users.filter((u) => u.is_staff).length },
    { label: 'Active', value: users.filter((u) => u.is_active).length },
  ];

  const getRoleBadges = (userItem) => {
    const badges = [];
    if (userItem.is_superuser) badges.push({ label: 'Superuser', cls: 'bg-purple-100 text-purple-800' });
    if (userItem.is_staff) badges.push({ label: 'Staff', cls: 'bg-slate-100 text-slate-800' });
    if (!badges.length) badges.push({ label: 'User', cls: 'bg-gray-100 text-gray-800' });
    return badges;
  };

  const getUserDisplayName = (u) => {
    if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
    return u.username || u.email || 'Unknown';
  };

  const getInitial = (u) =>
    u.first_name?.charAt(0) || u.email?.charAt(0) || u.username?.charAt(0) || 'U';

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Users</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage all registered users and their roles.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 bg-red-500/90 hover:bg-red-600 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  Delete ({selectedIds.size})
                </button>
              )}
              <button
                onClick={handleCreate}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </button>
              <button
                onClick={fetchUsers}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-lg sm:rounded-xl font-semibold transition-colors text-sm sm:text-base"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                {s.label}
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search by name, email, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left">
                    {deletableIds.length > 0 && (
                      <input
                        type="checkbox"
                        checked={deletableIds.length > 0 && deletableIds.every((id) => selectedIds.has(id))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No users match your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem) => (
                    <tr
                      key={userItem.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedIds.has(userItem.id) ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        {userItem.id !== user?.id ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(userItem.id)}
                            onChange={() => toggleSelect(userItem.id)}
                            className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {getInitial(userItem)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{getUserDisplayName(userItem)}</div>
                            {userItem.username && (
                              <div className="text-sm text-gray-500">@{userItem.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userItem.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(userItem).map((b) => (
                            <span
                              key={b.label}
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${b.cls}`}
                            >
                              {b.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(userItem.date_joined)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(userItem)}
                            className="text-slate-600 hover:text-slate-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                          {userItem.id !== user?.id && (
                            <button
                              onClick={() => handleDelete(userItem)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              {searchTerm ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            filteredUsers.map((userItem) => (
              <div
                key={userItem.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {userItem.id !== user?.id && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(userItem.id)}
                      onChange={() => toggleSelect(userItem.id)}
                      className="mt-3 h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                    />
                  )}
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold shrink-0 ${
                      userItem.id === user?.id ? 'ml-0' : ''
                    }`}
                  >
                    {getInitial(userItem)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{getUserDisplayName(userItem)}</div>
                    {userItem.username && (
                      <div className="text-sm text-gray-500">@{userItem.username}</div>
                    )}
                    <div className="text-sm text-gray-600 mt-0.5">{userItem.email}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getRoleBadges(userItem).map((b) => (
                        <span
                          key={b.label}
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.cls}`}
                        >
                          {b.label}
                        </span>
                      ))}
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Joined {formatDate(userItem.date_joined)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleEdit(userItem)}
                      className="text-slate-600 hover:text-slate-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                    {userItem.id !== user?.id && (
                      <button
                        onClick={() => handleDelete(userItem)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-900/50 transition-opacity"
                onClick={() => !saving && setShowForm(false)}
              />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-gradient-to-r from-slate-600 to-slate-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    {editingUser ? 'Edit User' : 'Create User'}
                  </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_staff}
                        onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Staff</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_superuser}
                        onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Superuser</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => !saving && setShowForm(false)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700 font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : editingUser ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, user: null })}
          onConfirm={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete "${deleteDialog.user?.username || deleteDialog.user?.email}"? This cannot be undone.`}
        />

        <ConfirmDialog
          isOpen={bulkDeleteDialog}
          onClose={() => setBulkDeleteDialog(false)}
          onConfirm={confirmBulkDelete}
          title="Delete Selected Users"
          message={`Delete ${selectedIds.size} user${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
