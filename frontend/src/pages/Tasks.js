import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/formatters';
import ClientWorkspaceLayout from '../components/client/ClientWorkspaceLayout';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  active: 'bg-blue-50 text-blue-800 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-800 border-red-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-slate-50 text-slate-700 border-slate-200',
};

const Tasks = () => {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tasks/');
      setTasks(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
      setError('We couldn\'t load your tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const activeCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <ClientWorkspaceLayout
      title="Tasks"
      description="Track progress, due dates, and assignments across your projects."
      actions={
        !loading && tasks.length > 0 ? (
          <div className="hidden sm:flex gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {activeCount} active
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {completedCount} done
            </span>
          </div>
        ) : null
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
          Loading tasks…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-slate-600">{error}</p>
          <button type="button" onClick={load} className="mt-4 text-sm font-semibold text-slate-900 hover:underline">
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="font-semibold text-slate-900">No tasks yet</p>
          <p className="text-sm text-slate-500 mt-1">Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:shadow-md transition-shadow shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  {t.project_name && <p className="text-xs text-slate-500 mt-0.5">{t.project_name}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                      STATUS_STYLES[t.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t.status}
                  </span>
                  {t.priority && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                        PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
                      }`}
                    >
                      {t.priority}
                    </span>
                  )}
                </div>
              </div>
              {t.description && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{t.description}</p>}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                {t.due_date && <span>Due {formatDate(t.due_date)}</span>}
                {t.completed_at && <span>Completed {formatDate(t.completed_at)}</span>}
                {(t.assignee_names || []).length > 0 && <span>Team: {t.assignee_names.join(', ')}</span>}
                <span>{t.progress}% complete</span>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ClientWorkspaceLayout>
  );
};

export default Tasks;
