import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const AdminMessagingThreads = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!user || user.is_superuser !== true) {
      navigate('/profile');
      return;
    }
    fetchThreads();
    fetchProjects();
  }, [isAuthenticated, user, navigate]);

  const fetchThreads = async () => {
    try {
      const res = await api.get('/messaging/threads/');
      const data = res.data?.results ?? res.data ?? [];
      setThreads(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching message threads:', err);
      setError('Failed to load message threads.');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/clients/projects/');
      const data = res.data?.results ?? res.data ?? [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching projects for messaging threads:', err);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || creating) return;
    setCreating(true);
    try {
      const res = await api.post('/messaging/threads/', { project: selectedProjectId });
      const newThread = res.data;
      if (newThread) {
        // If thread already existed, avoid duplicates by replacing/merging
        setThreads((prev) => {
          const without = prev.filter((t) => t.id !== newThread.id);
          return [newThread, ...without];
        });
      }
      setSelectedProjectId('');
      setError('');
    } catch (err) {
      console.error('Error creating message thread:', err);
      const msg =
        err.response?.data?.project?.[0] ||
        err.response?.data?.detail ||
        'Failed to create message thread.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.project_name?.toLowerCase().includes(term) ||
      t.client_name?.toLowerCase().includes(term) ||
      String(t.id).includes(term)
    );
  });

  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const projectOptionsWithoutThread = projects.filter((p) => {
    const projectId = p.id;
    return !threads.some((t) => (t.project_id ?? t.project) === projectId);
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading message threads...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 p-4 rounded-3 shadow-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">Message Threads</h1>
            <p className="text-sm text-blue-100 mb-0">
              One place for all client–admin conversations, organized per project.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/90 text-blue-700 text-xs px-3 py-1.5 rounded-full font-semibold">
              {threads.length} thread{threads.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filters + create thread */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
            <input
              type="text"
              placeholder="Search by project, client, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:max-w-sm"
            />
            <p className="text-sm text-gray-500 mt-2 md:mt-0">
              Total threads: <span className="font-semibold text-gray-800">{threads.length}</span>
            </p>
          </div>
          <form
            onSubmit={handleCreateThread}
            className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
          >
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[180px]"
            >
              <option value="">Select project (no thread)</option>
              {projectOptionsWithoutThread.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.quote_project_title || `Project #${p.id}`}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedProjectId || creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Add Thread'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Threads table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last message
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredThreads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      No message threads found.
                    </td>
                  </tr>
                ) : (
                  filteredThreads.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{t.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {t.project_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
                        {t.client_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 max-w-md truncate">
                        {t.last_message_preview || '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {t.message_count ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {formatDateTime(t.last_message_at || t.updated_at)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        <Link
                          to={`/messages/${t.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Open chat
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessagingThreads;

