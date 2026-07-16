import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/formatters';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-slate-600 text-sm mt-1 mb-8">Track progress, due dates, and assignments.</p>
        {loading ? (
          <p className="text-center py-16 text-slate-500">Loading tasks…</p>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600">{error}</p>
            <button type="button" onClick={load} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">Try again</button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500">No tasks yet</div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{t.title}</p>
                    {t.project_name && <p className="text-xs text-slate-500 mt-0.5">{t.project_name}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-700'}`}>
                    {t.status}
                  </span>
                </div>
                {t.description && <p className="text-sm text-slate-600 mt-2">{t.description}</p>}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  {t.due_date && <span>Due {formatDate(t.due_date)}</span>}
                  {t.assigned_to_name && <span>Assigned to {t.assigned_to_name}</span>}
                  <span>{t.progress}% complete</span>
                </div>
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-slate-700 rounded-full transition-all" style={{ width: `${t.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Tasks;
