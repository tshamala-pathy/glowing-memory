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
  project: '',
  title: '',
  description: '',
  event_type: 'deadline',
  start_at: '',
  end_at: '',
  all_day: false,
};

const AdminCalendar = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [eventsRes, usersRes, projectsRes] = await Promise.all([
        api.get('/calendar/'),
        api.get('/users/list/', { params: { page_size: 500 } }),
        api.get('/clients/projects/'),
      ]);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data?.results || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.results || []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.results || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
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

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      user: form.user || user.id,
      project: form.project || null,
      end_at: form.end_at || null,
    };
    try {
      if (editing) {
        await api.patch(`/calendar/${editing.id}/`, payload);
      } else {
        await api.post('/calendar/', payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      fetchData(true);
    } catch {
      alert('Failed to save event');
    }
  };

  const handleEdit = (ev) => {
    setEditing(ev);
    setForm({
      user: ev.user || '',
      project: ev.project || '',
      title: ev.title || '',
      description: ev.description || '',
      event_type: ev.event_type || 'deadline',
      start_at: ev.start_at ? ev.start_at.slice(0, 16) : '',
      end_at: ev.end_at ? ev.end_at.slice(0, 16) : '',
      all_day: !!ev.all_day,
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteDialog.event) return;
    try {
      await api.delete(`/calendar/${deleteDialog.event.id}/`);
      setDeleteDialog({ open: false, event: null });
      fetchData(true);
    } catch {
      alert('Failed to delete event');
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
        title="Calendar"
        description="Manage deadlines, meetings, and reminders for any user."
        actions={
          <>
            <AdminRefreshButton onClick={() => fetchData(true)} loading={refreshing} />
            <AdminPrimaryBannerButton onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }}>
              Add event
            </AdminPrimaryBannerButton>
          </>
        }
      />
      {showForm && (
        <form onSubmit={handleSave} className="mb-6 bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">User</label>
            <select className={ADMIN_INPUT_CLASS} value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} required>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Project (optional)</label>
            <select className={ADMIN_INPUT_CLASS} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input className={ADMIN_INPUT_CLASS} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Type</label>
            <select className={ADMIN_INPUT_CLASS} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
              <option value="deadline">Deadline</option>
              <option value="meeting">Meeting</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Start</label>
            <input type="datetime-local" className={ADMIN_INPUT_CLASS} value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">End (optional)</label>
            <input type="datetime-local" className={ADMIN_INPUT_CLASS} value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">Cancel</button>
          </div>
        </form>
      )}
      <AdminListSection title="All calendar events">
        <AdminTableWrap>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Project</th>
                <th className="py-3 pr-4">Start</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{ev.title}</td>
                  <td className="py-3 pr-4 capitalize">{ev.event_type}</td>
                  <td className="py-3 pr-4">{ev.project_name || '—'}</td>
                  <td className="py-3 pr-4">{formatDateTime(ev.start_at)}</td>
                  <td className="py-3">
                    <AdminActionButtons
                      actions={[
                        { label: 'Edit', onClick: () => handleEdit(ev) },
                        { label: 'Delete', tone: 'danger', onClick: () => setDeleteDialog({ open: true, event: ev }) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminListSection>
      <ConfirmDialog open={deleteDialog.open} title="Delete event?" message="This cannot be undone." onConfirm={confirmDelete} onCancel={() => setDeleteDialog({ open: false, event: null })} />
    </AdminLayout>
  );
};

export default AdminCalendar;
