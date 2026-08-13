import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  ADMIN_INPUT_CLASS,
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=85';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const defaultFormData = {
  project: '',
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  internal_notes: '',
};

const AdminTasks = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/clients/tasks/');
      const data = response.data.results || response.data;
      const list = Array.isArray(data) ? data : [];
      setTasks(list);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/clients/projects/');
      const data = response.data.results || response.data;
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true && user.is_staff !== true) {
      navigate('/profile');
      return;
    }
    fetchTasks();
    fetchProjects();
  }, [isAuthenticated, user, navigate, fetchTasks, fetchProjects]);

  const handleEdit = (task) => {
    const projectId = typeof task.project === 'object' ? task.project?.id : task.project;
    setEditingTask(task);
    setFormData({
      project: String(projectId || ''),
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      internal_notes: task.internal_notes || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = (task) => {
    setDeleteDialog({ open: true, task });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.task) return;
    try {
      await api.delete(`/clients/tasks/${deleteDialog.task.id}/`);
      fetchTasks();
      setDeleteDialog({ open: false, task: null });
    } catch {
      alert('Failed to delete task');
    }
  };

  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      await api.patch(`/clients/tasks/${task.id}/`, { status: newStatus });
      fetchTasks();
    } catch {
      alert('Failed to update status');
    }
  };

  const isOverdue = (task) => {
    if (!task.due_date) return false;
    const today = new Date().toISOString().slice(0, 10);
    return task.status !== 'done' && task.due_date < today;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchTerm ||
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const groupedByProject = useMemo(() => {
    const map = {};
    filteredTasks.forEach((task) => {
      const projectId = typeof task.project === 'object' ? task.project?.id : task.project;
      const key = projectId ?? 'none';
      if (!map[key]) {
        map[key] = {
          projectId,
          tasks: [],
        };
      }
      map[key].tasks.push(task);
    });
    return Object.values(map);
  }, [filteredTasks]);

  const overdueTasks = useMemo(() => tasks.filter((t) => isOverdue(t)), [tasks]);

  const statusBadge = (value) => {
    const base = 'px-2 py-1 text-xs rounded-full capitalize ';
    if (value === 'done') return base + 'bg-green-100 text-green-800';
    if (value === 'in_progress') return base + 'bg-blue-100 text-blue-800';
    return base + 'bg-gray-100 text-gray-800';
  };

  const priorityBadge = (value) => {
    const base = 'px-2 py-1 text-xs rounded-full capitalize ';
    if (value === 'high') return base + 'bg-red-100 text-red-800';
    if (value === 'medium') return base + 'bg-amber-100 text-amber-800';
    return base + 'bg-gray-100 text-gray-800';
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    setFormData(defaultFormData);
    setFormError('');
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project || !formData.title.trim()) {
      setFormError('Project and title are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingTask) {
        await api.patch(`/clients/tasks/${editingTask.id}/`, formData);
      } else {
        await api.post('/clients/tasks/', formData);
      }
      await fetchTasks();
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      const msg =
        error.response?.data?.project?.[0] ||
        error.response?.data?.title?.[0] ||
        error.response?.data?.detail ||
        'Failed to save task.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    {
      label: 'Total',
      value: filteredTasks.length,
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    {
      label: 'To Do',
      value: filteredTasks.filter((t) => t.status === 'todo').length,
      tone: 'bg-white border border-slate-100',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'In Progress',
      value: filteredTasks.filter((t) => t.status === 'in_progress').length,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      label: 'Done',
      value: filteredTasks.filter((t) => t.status === 'done').length,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      tone: 'bg-white border border-red-100',
      valueClass: 'text-red-600',
      iconBg: 'bg-red-100 text-red-600',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
  ];

  const statusFilters = [
    { id: 'all', label: 'All', count: tasks.length },
    ...STATUS_OPTIONS.map((opt) => ({
      id: opt.value,
      label: opt.label,
      count: tasks.filter((t) => t.status === opt.value).length,
    })),
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  if (loading) {
    return (
      <AdminLayout allowStaff={true}>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout allowStaff={true}>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Business"
          title="Project Tasks"
          description="Internal task board grouped by project. Clients never see these tasks."
          primaryAction={
            <AdminPrimaryBannerButton onClick={handleCreateNew}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New task
            </AdminPrimaryBannerButton>
          }
          secondaryAction={
            <div className="flex flex-wrap gap-3">
              <AdminRefreshButton onClick={() => fetchTasks(true)} refreshing={refreshing} />
              <Link
                to="/admin/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          }
        />

        <AdminStatGrid stats={statCards} />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`${ADMIN_INPUT_CLASS} mt-0 max-w-xs`}
          >
            <option value="all">All priorities</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {overdueTasks.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">Overdue tasks</h2>
              <span className="text-sm font-semibold text-red-700">{overdueTasks.length} overdue</span>
            </div>
            <ul className="space-y-2">
              {overdueTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-red-700 truncate">{task.title}</span>
                    <span className="text-slate-500 text-xs truncate">
                      {(() => {
                        const pid = typeof task.project === 'object' ? task.project?.id : task.project;
                        const project = projects.find((p) => p.id === pid);
                        const projectLabel =
                          task.project_name ||
                          project?.name ||
                          project?.quote_project_title ||
                          `Project #${pid}`;
                        return `${projectLabel} • due ${formatDate(task.due_date)}`;
                      })()}
                    </span>
                  </div>
                  <span className={priorityBadge(task.priority)}>{task.priority}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AdminListSection
          title="Tasks by project"
          subtitle="Track internal work across client projects"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by title or description…"
          filters={statusFilters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showingCount={filteredTasks.length}
          totalCount={tasks.length}
          hasActiveFilters={!!searchTerm.trim() || statusFilter !== 'all' || priorityFilter !== 'all'}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setPriorityFilter('all');
          }}
          onCreate={handleCreateNew}
          createLabel="New task"
          emptyTitle="No tasks found"
          emptyDescription="Try adjusting your search or filters, or create a task."
          emptyActionLabel={searchTerm.trim() || statusFilter !== 'all' || priorityFilter !== 'all' ? 'Clear filters' : 'Add first task'}
          onEmptyAction={
            searchTerm.trim() || statusFilter !== 'all' || priorityFilter !== 'all'
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }
              : handleCreateNew
          }
          hideResultCount
        >
          <div className="divide-y divide-slate-100">
            {groupedByProject.map((group) => (
              <div key={group.projectId} className="p-4 sm:p-6">
                <div className="mb-4">
                  {(() => {
                    const gid = typeof group.projectId === 'object' ? group.projectId?.id : group.projectId;
                    const firstTask = group.tasks[0];
                    const project = projects.find((p) => p.id === gid);
                    const projectLabel =
                      firstTask?.project_name ||
                      project?.name ||
                      project?.quote_project_title ||
                      `Project #${gid}`;
                    const clientLabel = firstTask?.client_name
                      ? ` • ${firstTask.client_name}`
                      : project?.client_name
                        ? ` • ${project.client_name}`
                        : '';
                    return (
                      <>
                        <h3 className="text-base font-bold text-slate-900">
                          {projectLabel}
                          <span className="text-sm font-normal text-slate-500">{clientLabel}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                        </p>
                      </>
                    );
                  })()}
                </div>
                <AdminTableWrap>
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white">
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Title</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Priority</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Due</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{task.title}</td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                              className={`text-xs rounded-lg border-0 px-2 py-1 font-semibold focus:ring-2 focus:ring-slate-500 ${statusBadge(task.status)}`}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={priorityBadge(task.priority)}>{task.priority}</span>
                          </td>
                          <td className="px-4 py-3 text-sm hidden md:table-cell">
                            {task.due_date ? (
                              <span className={isOverdue(task) ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                                {formatDate(task.due_date)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AdminActionButtons
                              onEdit={() => handleEdit(task)}
                              onDelete={() => handleDelete(task)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AdminTableWrap>
              </div>
            ))}
          </div>
        </AdminListSection>

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)} />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{editingTask ? 'Edit Task' : 'Add Task'}</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleFormSubmit} className="px-5 py-4 space-y-4">
                  {formError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
                      {formError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.quote_project_title || `Project #${p.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internal notes <span className="text-gray-400 text-xs">(optional, admin only)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.internal_notes}
                      onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, task: null })}
          onConfirm={confirmDelete}
          title="Delete Task"
          message={`Are you sure you want to delete the task "${deleteDialog.task?.title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
