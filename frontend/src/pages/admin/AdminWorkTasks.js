import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatDate, formatDateTime } from '../../utils/formatters';

const defaultForm = {
  project: '',
  title: '',
  description: '',
  assignees: [],
  status: 'pending',
  priority: 'medium',
  progress: 0,
  due_date: '',
};

const STATUS_FILTERS = [
  { id: 'all', label: 'All statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

const PRIORITY_FILTERS = [
  { id: 'all', label: 'All priorities' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const toDateInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const taskToForm = (task) => ({
  project: task.project ?? '',
  title: task.title ?? '',
  description: task.description ?? '',
  assignees: Array.isArray(task.assignees) ? task.assignees.map((id) => Number(id)) : [],
  status: task.status ?? 'pending',
  priority: task.priority ?? 'medium',
  progress: task.progress ?? 0,
  due_date: toDateInput(task.due_date),
});

const buildPayload = (form) => ({
  project: form.project,
  title: form.title,
  description: form.description || '',
  assignees: (form.assignees || []).map((id) => Number(id)).filter(Boolean),
  status: form.status,
  priority: form.priority || 'medium',
  due_date: form.due_date || null,
  progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
});

const userLabel = (u) => {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} (${u.email})` : u.email;
};

const priorityBadge = (value) => {
  const base = 'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ';
  if (value === 'high') return base + 'bg-red-100 text-red-800';
  if (value === 'medium') return base + 'bg-amber-100 text-amber-800';
  return base + 'bg-slate-100 text-slate-700';
};

const statusBadge = (value) => {
  const base = 'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ';
  if (value === 'completed') return base + 'bg-emerald-100 text-emerald-800';
  if (value === 'active') return base + 'bg-blue-100 text-blue-800';
  return base + 'bg-amber-100 text-amber-800';
};

const AdminWorkTasks = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        api.get('/tasks/'),
        api.get('/clients/projects/'),
        api.get('/users/list/', { params: { page_size: 500 } }),
      ]);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.results || []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.results || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.results || []);
    } catch {
      setTasks([]);
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = searchTerm.trim().toLowerCase();
      const assigneeText = (task.assignee_names || []).join(' ').toLowerCase();
      const matchesSearch = !q
        || task.title?.toLowerCase().includes(q)
        || task.description?.toLowerCase().includes(q)
        || task.project_name?.toLowerCase().includes(q)
        || assigneeText.includes(q);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesProject = !projectFilter || String(task.project) === String(projectFilter);
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter]);

  const hasActiveFilters = !!searchTerm.trim() || statusFilter !== 'all'
    || priorityFilter !== 'all' || !!projectFilter;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('');
  };

  const handleStatusChange = (status) => {
    setForm((prev) => ({
      ...prev,
      status,
      progress: status === 'completed' ? 100 : prev.progress,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = buildPayload(form);
    if (payload.status === 'completed' && payload.progress < 100) {
      payload.progress = 100;
    }
    try {
      if (editing) {
        await api.patch(`/tasks/${editing.id}/`, payload);
      } else {
        await api.post('/tasks/', payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      fetchData(true);
    } catch {
      alert('Failed to save work task');
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.task) return;
    try {
      await api.delete(`/tasks/${deleteDialog.task.id}/`);
      setDeleteDialog({ open: false, task: null });
      fetchData(true);
    } catch {
      alert('Failed to delete task');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/tasks/export_csv/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `work-tasks-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm(taskToForm(task));
    setShowForm(true);
  };

  const teamMembers = useMemo(
    () => users.filter((u) => u.is_staff || u.is_superuser),
    [users],
  );

  const toggleAssignee = (userId) => {
    const id = Number(userId);
    setForm((prev) => {
      const current = prev.assignees || [];
      return {
        ...prev,
        assignees: current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      };
    });
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
        eyebrow="Admin · Operations"
        title="Work Tasks"
        description="Assign tasks to a project manager and team members — track priority, due dates, and progress."
        actions={(
          <>
            <AdminRefreshButton onClick={() => fetchData(true)} refreshing={refreshing} />
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Export CSV
            </button>
            <AdminPrimaryBannerButton onClick={openCreate}>
              Add work task
            </AdminPrimaryBannerButton>
          </>
        )}
      />

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 bg-white rounded-2xl border border-slate-200 p-6 grid md:grid-cols-2 gap-4 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-slate-600">Project</label>
            <select
              className={ADMIN_INPUT_CLASS}
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-slate-600">Team assignees</label>
              <span className="text-xs text-slate-500">
                {(form.assignees || []).length} selected
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Select the project manager and other staff working on this task.
            </p>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {teamMembers.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">No staff users found.</p>
              ) : (
                teamMembers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(form.assignees || []).includes(Number(u.id))}
                      onChange={() => toggleAssignee(u.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    />
                    <span className="text-sm text-slate-800">{userLabel(u)}</span>
                    {u.is_superuser && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input
              className={ADMIN_INPUT_CLASS}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Description</label>
            <textarea
              className={ADMIN_INPUT_CLASS}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Status</label>
            <select
              className={ADMIN_INPUT_CLASS}
              value={form.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Priority</label>
            <select
              className={ADMIN_INPUT_CLASS}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Due date</label>
            <input
              type="date"
              className={ADMIN_INPUT_CLASS}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Progress %</label>
            <input
              type="number"
              min="0"
              max="100"
              className={ADMIN_INPUT_CLASS}
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: e.target.value })}
            />
          </div>
          {editing && (
            <div className="md:col-span-2 text-xs text-slate-500 space-y-1">
              {editing.created_by_name && <p>Created by {editing.created_by_name}</p>}
              {editing.created_at && <p>Created {formatDateTime(editing.created_at)}</p>}
              {editing.updated_at && <p>Updated {formatDateTime(editing.updated_at)}</p>}
              {editing.completed_at && <p>Completed {formatDateTime(editing.completed_at)}</p>}
            </div>
          )}
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">
              {editing ? 'Update task' : 'Create task'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Project</label>
          <select className={ADMIN_INPUT_CLASS} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
          <select className={ADMIN_INPUT_CLASS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Priority</label>
          <select className={ADMIN_INPUT_CLASS} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {PRIORITY_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-end">
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              Clear filters
            </button>
          </div>
        )}
      </div>

      <AdminListSection
        title="Work tasks"
        subtitle="Filter, assign, and track internal delivery work"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search title, description, project, assignee…"
        showingCount={filteredTasks.length}
        totalCount={tasks.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onCreate={openCreate}
        createLabel="Add work task"
        emptyTitle="No work tasks found"
        emptyDescription={hasActiveFilters ? 'Try adjusting your filters.' : 'Create the first work task to get started.'}
        emptyActionLabel={hasActiveFilters ? 'Clear filters' : 'Add work task'}
        onEmptyAction={hasActiveFilters ? clearFilters : openCreate}
      >
        <AdminTableWrap>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Project</th>
                <th className="py-3 pr-4">Team</th>
                <th className="py-3 pr-4">Priority</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Due</th>
                <th className="py-3 pr-4">Progress</th>
                <th className="py-3 pr-4">Created by</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{t.project_name || t.project}</td>
                  <td className="py-3 pr-4">
                    {(t.assignee_names || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.assignee_names.map((name) => (
                          <span
                            key={`${t.id}-${name}`}
                            className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4"><span className={priorityBadge(t.priority)}>{t.priority || 'medium'}</span></td>
                  <td className="py-3 pr-4"><span className={statusBadge(t.status)}>{t.status}</span></td>
                  <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{t.due_date ? formatDate(t.due_date) : '—'}</td>
                  <td className="py-3 pr-4">{t.progress}%</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{t.created_by_name || '—'}</td>
                  <td className="py-3">
                    <AdminActionButtons
                      actions={[
                        { label: 'Edit', onClick: () => openEdit(t) },
                        { label: 'Delete', tone: 'danger', onClick: () => setDeleteDialog({ open: true, task: t }) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">No work tasks match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminListSection>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete work task?"
        message="This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, task: null })}
      />
    </AdminLayout>
  );
};

export default AdminWorkTasks;
