import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
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
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('/clients/tasks/');
      const data = response.data.results || response.data;
      const list = Array.isArray(data) ? data : [];
      setTasks(list);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
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
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
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

  const stats = [
    { label: 'Total', value: filteredTasks.length },
    { label: 'To Do', value: filteredTasks.filter((t) => t.status === 'todo').length },
    { label: 'In Progress', value: filteredTasks.filter((t) => t.status === 'in_progress').length },
    { label: 'Done', value: filteredTasks.filter((t) => t.status === 'done').length },
    { label: 'Overdue', value: overdueTasks.length },
  ];

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

  if (loading) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading tasks...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout allowStaff={true}>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Project Tasks</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Internal task board, grouped by project. Clients never see these tasks.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleCreateNew}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </button>
              <button
                onClick={fetchTasks}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-lg sm:rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                Refresh
              </button>
              <Link
                to="/admin/projects"
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                Projects
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-slate-600">{s.value}</p>
              <p className="text-sm font-medium text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all-status'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value || 'all-priority'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overdue tasks summary */}
        {overdueTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Overdue Tasks</h2>
              <span className="text-sm font-medium text-red-700">{overdueTasks.length} overdue</span>
            </div>
            <ul className="space-y-2">
              {overdueTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-red-700">{task.title}</span>
                    <span className="text-gray-500">
                      {(() => {
                        const pid = typeof task.project === 'object' ? task.project?.id : task.project;
                        const project = projects.find((p) => p.id === pid);
                        const projectLabel =
                          task.project_name ||
                          project?.name ||
                          project?.quote_project_title ||
                          `Project #${pid}`;
                        const clientLabel = task.client_name
                          ? ` • Client: ${task.client_name}`
                          : project?.client_name
                            ? ` • Client: ${project.client_name}`
                            : '';
                        return `${projectLabel}${clientLabel} • due ${formatDate(task.due_date)}`;
                      })()}
                    </span>
                  </div>
                  <span className={priorityBadge(task.priority)}>{task.priority}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Grouped tasks by project */}
        <div className="space-y-6">
          {groupedByProject.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            groupedByProject.map((group) => (
              <div key={group.projectId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50">
                  <div>
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
                        ? ` • Client: ${firstTask.client_name}`
                        : project?.client_name
                          ? ` • Client: ${project.client_name}`
                          : '';
                      return (
                        <h2 className="text-lg font-bold text-gray-900">
                          {projectLabel}
                          <span className="text-sm font-normal text-gray-500">{clientLabel}</span>
                        </h2>
                      );
                    })()}
                    <p className="text-sm text-gray-500">
                      {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50/80">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{task.title}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <select
                              value={task.status}
                              onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                              className={`text-sm rounded-lg border-0 px-2 py-1 font-medium focus:ring-2 focus:ring-slate-500 ${statusBadge(task.status)}`}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={priorityBadge(task.priority)}>{task.priority}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm">
                            {task.due_date ? (
                              <span className={isOverdue(task) ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                                {formatDate(task.due_date)}
                              </span>
                            ) : (
                              <span className="text-gray-400">No due date</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleEdit(task)}
                                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(task)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New/Edit Task Modal */}
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
