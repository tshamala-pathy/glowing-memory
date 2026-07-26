import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  ADMIN_INPUT_CLASS,
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminListSection,
  AdminTableWrap,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
  AdminActionButtons,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const defaultForm = {
  user: '',
  title: '',
  message: '',
  event_type: 'quote_reviewed',
  link: '',
};

const AdminNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const fetchData = useCallback(async () => {
    try {
      const [nRes, uRes] = await Promise.all([
        api.get('/notifications/admin/'),
        api.get('/users/list/'),
      ]);
      setItems(Array.isArray(nRes.data) ? nRes.data : nRes.data?.results || []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : uRes.data?.results || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && !user.is_superuser) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications/admin/', form);
      setShowForm(false);
      setForm(defaultForm);
      fetchData();
    } catch {
      alert('Failed to create notification');
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await api.delete(`/notifications/admin/${deleteDialog.item.id}/`);
      setDeleteDialog({ open: false, item: null });
      fetchData();
    } catch {
      alert('Failed to delete notification');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageBanner
        title="In-app Notifications"
        description="View and send notifications to any user (Django admin: Notifications)."
        actions={
          <>
            <AdminRefreshButton onClick={fetchData} />
            <AdminPrimaryBannerButton onClick={() => setShowForm(true)}>Send notification</AdminPrimaryBannerButton>
          </>
        }
      />
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white rounded-2xl border p-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">User</label>
            <select className={ADMIN_INPUT_CLASS} value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} required>
              <option value="">Select user</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Event type</label>
            <input className={ADMIN_INPUT_CLASS} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input className={ADMIN_INPUT_CLASS} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Message</label>
            <input className={ADMIN_INPUT_CLASS} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Link (optional)</label>
            <input className={ADMIN_INPUT_CLASS} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/profile" />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">Send</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-xl text-sm">Cancel</button>
          </div>
        </form>
      )}
      <AdminListSection title="All notifications">
        <AdminTableWrap>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Read</th>
                <th className="py-3 pr-4">Sent</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{n.user_email}</td>
                  <td className="py-3 pr-4 font-medium">{n.title}</td>
                  <td className="py-3 pr-4 text-xs">{n.event_type}</td>
                  <td className="py-3 pr-4">{n.is_read ? 'Yes' : 'No'}</td>
                  <td className="py-3 pr-4">{formatDateTime(n.created_at)}</td>
                  <td className="py-3">
                    <AdminActionButtons actions={[{ label: 'Delete', tone: 'danger', onClick: () => setDeleteDialog({ open: true, item: n }) }]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminListSection>
      <ConfirmDialog open={deleteDialog.open} title="Delete notification?" onConfirm={confirmDelete} onCancel={() => setDeleteDialog({ open: false, item: null })} />
    </AdminLayout>
  );
};

export default AdminNotifications;
