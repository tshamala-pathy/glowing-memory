import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import api from '../../services/api';

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

const AdminTasks = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    project: '',
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    internal_notes: '',
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/clients/tasks/');
      const data = response.data.results || response.data;
      const list = Array.isArray(data) ? data : [];
      setTasks(list);
      // #region agent log
      const first = list[0];
      const projectVal = first?.project;
      fetch('http://127.0.0.1:7242/ingest/09dda989-d72c-43d8-8020-eb55e586cb02', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c877e1' },
        body: JSON.stringify({
          sessionId: 'c877e1',
          location: 'AdminTasks.js:fetchTasks',
          message: 'Tasks loaded',
          data: {
            taskCount: list.length,
            firstTaskProject: projectVal,
            firstTaskProjectType: typeof projectVal,
            firstTaskProjectId: projectVal && typeof projectVal === 'object' ? projectVal.id : projectVal,
          },
          timestamp: Date.now(),
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/clients/projects/');
      const data = response.data.results || response.data;
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      // #region agent log
      const first = list[0];
      fetch('http://127.0.0.1:7242/ingest/09dda989-d72c-43d8-8020-eb55e586cb02', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c877e1' },
        body: JSON.stringify({
          sessionId: 'c877e1',
          location: 'AdminTasks.js:fetchProjects',
          message: 'Projects loaded',
          data: {
            count: list.length,
            firstProjectKeys: first ? Object.keys(first) : [],
            firstId: first?.id,
            firstName: first?.name,
            firstClientName: first?.client_name,
            rawHasResults: !!response.data.results,
          },
          timestamp: Date.now(),
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
    } catch (error) {
      console.error('Error fetching projects for tasks:', error);
    }
  };

  const isOverdue = (task) => {
    if (!task.due_date) return false;
    const today = new Date().toISOString().slice(0, 10);
    return task.status !== 'done' && task.due_date < today;
  };

  const groupedByProject = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (statusFilter && task.status !== statusFilter) return;
      if (priorityFilter && task.priority !== priorityFilter) return;
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
  }, [tasks, statusFilter, priorityFilter]);

  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t)),
    [tasks]
  );

  // #region agent log
  useEffect(() => {
    if (tasks.length === 0 || loading) return;
    const t = tasks[0];
    const projectId = typeof t?.project === 'object' ? t?.project?.id : t?.project;
    const project = projects.find((p) => p.id === projectId);
    const projectLabel =
      project?.name || project?.quote_project_title || `Project #${projectId}`;
    const clientLabel = project?.client_name ? ` • Client: ${project.client_name}` : '';
    fetch('http://127.0.0.1:7242/ingest/09dda989-d72c-43d8-8020-eb55e586cb02', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c877e1' },
      body: JSON.stringify({
        sessionId: 'c877e1',
        location: 'AdminTasks.js:lookup',
        message: 'First task project lookup',
        data: {
          projectId,
          projectFound: !!project,
          projectLabel,
          clientLabel,
          projectsLength: projects.length,
        },
        timestamp: Date.now(),
        hypothesisId: 'C',
      }),
    }).catch(() => {});
  }, [tasks, projects, loading]);
  // #endregion

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

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => <span className={statusBadge(value)}>{value.replace('_', ' ')}</span>,
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (value) => <span className={priorityBadge(value)}>{value}</span>,
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      render: (value, row) =>
        value ? (
          <span className={isOverdue(row) ? 'text-red-600 font-semibold' : 'text-gray-800'}>
            {new Date(value).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400">No due date</span>
        ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout allowStaff={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading tasks...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout allowStaff={true}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Tasks</h1>
            <p className="text-gray-600 mt-1">
              Internal task board, grouped by project. Clients never see these tasks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTasks}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setFormError('');
                setFormData({
                  project: '',
                  title: '',
                  description: '',
                  status: 'todo',
                  priority: 'medium',
                  due_date: '',
                  internal_notes: '',
                });
                setShowForm(true);
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Overdue Tasks</h2>
            <span className="text-sm font-medium text-red-700">
              {overdueTasks.length} overdue
            </span>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-gray-500">Great! You have no overdue tasks.</p>
          ) : (
            <ul className="space-y-2">
              {overdueTasks.map((task) => (
                // Find project info so we can show a friendly label instead of just an ID
                // (tasks are always linked to a client project)
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
                        return `${projectLabel}${clientLabel} • due ${new Date(
                          task.due_date
                        ).toLocaleDateString()}`;
                      })()}
                    </span>
                  </div>
                  <span className={priorityBadge(task.priority)}>{task.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Grouped tasks by project */}
        <div className="space-y-6">
          {groupedByProject.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              No tasks match the current filters.
            </div>
          ) : (
            groupedByProject.map((group) => (
              <div key={group.projectId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
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
                <DataTable
                  columns={columns}
                  data={group.tasks}
                  emptyMessage="No tasks for this project"
                />
              </div>
            ))
          )}
        </div>

        {/* New Task Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.project || !formData.title.trim()) {
                    setFormError('Project and title are required.');
                    return;
                  }
                  setSaving(true);
                  setFormError('');
                  try {
                    await api.post('/clients/tasks/', formData);
                    await fetchTasks();
                    setShowForm(false);
                  } catch (error) {
                    console.error('Error creating task:', error);
                    const msg =
                      error.response?.data?.project?.[0] ||
                      error.response?.data?.title?.[0] ||
                      error.response?.data?.detail ||
                      'Failed to create task.';
                    setFormError(msg);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-5 py-4 space-y-4"
              >
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;

