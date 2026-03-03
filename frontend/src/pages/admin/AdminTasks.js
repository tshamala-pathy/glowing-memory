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
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/clients/tasks/');
      const data = response.data.results || response.data;
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
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
      const key = task.project;
      if (!map[key]) {
        map[key] = {
          projectId: task.project,
          // These fields are not on the Task payload by default; keep minimal grouping
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
          <button
            onClick={fetchTasks}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
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
                <li
                  key={task.id}
                  className="flex items-center justify-between text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-red-700">{task.title}</span>
                    <span className="text-gray-500">
                      Project #{task.project} • due {new Date(task.due_date).toLocaleDateString()}
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
                    <h2 className="text-lg font-bold text-gray-900">
                      Project #{group.projectId}
                    </h2>
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
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;

