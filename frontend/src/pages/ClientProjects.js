import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

/**
 * My Projects — Client Portal
 *
 * Shows only the logged-in client's projects (backend: my_projects endpoint filters by client profile).
 * If none exist, shows a friendly empty-state message.
 */
const ClientProjects = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Please log in to view your projects.');
      setLoading(false);
      return;
    }
    fetchClientProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, searchTerm, statusFilter]);

  const fetchClientProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      // Logged-in client's projects only (my_projects endpoint)
      const response = await api.get('/clients/projects/my_projects/', { params });
      const projectsData = response.data?.results ?? response.data ?? [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setError('');
    } catch (error) {
      console.error('Error fetching client projects:', error);
      setError('Failed to load your projects. Please try again later.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-slate-100 text-slate-800';
      case 'design':
        return 'bg-fuchsia-100 text-fuchsia-800';
      case 'development':
        return 'bg-blue-100 text-blue-800';
      case 'testing':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const STAGES = [
    { key: 'planning', label: 'Planning', icon: '✔' },
    { key: 'design', label: 'Design', icon: '✔' },
    { key: 'development', label: 'Development', icon: '⚙' },
    { key: 'testing', label: 'Testing', icon: '⬜' },
    { key: 'completed', label: 'Completed', icon: '⬜' },
  ];

  const getStageState = (currentStatus, stageKey) => {
    const order = ['planning', 'design', 'development', 'testing', 'completed'];
    const curIdx = order.indexOf(currentStatus);
    const stageIdx = order.indexOf(stageKey);
    if (curIdx === -1 || stageIdx === -1) return 'todo';
    if (stageIdx < curIdx) return 'done';
    if (stageIdx === curIdx) return 'current';
    return 'todo';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-xl text-gray-600 mb-8">Please log in to view your projects.</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 text-lg">Loading your projects...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            My Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View and track the status of all your projects with PathyCode.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Projects
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or tech stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="planning">Planning</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-base font-semibold text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              {searchTerm || statusFilter
                ? 'Try adjusting your search or filters.'
                : "You don't have any projects yet. Projects are created automatically when your invoice is paid. They'll appear here once you do."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
              >
                {/* Screenshots/Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {project.screenshots && project.screenshots.length > 0 ? (
                    <img
                      src={getMediaUrl(project.screenshots[0])}
                      alt={project.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center text-gray-400"
                    style={{
                      display: !project.screenshots || project.screenshots.length === 0 ? 'flex' : 'none',
                    }}
                  >
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        project.status
                      )}`}
                    >
                      {project.status_label || (project.status ? project.status.replace(/_/g, ' ') : '—')}
                    </span>
                  </div>
                  {/* Public/Private Badge */}
                  {project.is_public && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        Public
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Progress tracker */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">Progress</p>
                      <p className="text-sm font-semibold text-gray-700">{Math.max(0, Math.min(100, Number(project.progress_percentage ?? 0)))}%</p>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"
                        style={{ width: `${Math.max(0, Math.min(100, Number(project.progress_percentage ?? 0)))}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {STAGES.map((s, idx) => {
                        const state = getStageState(project.status, s.key);
                        const isDone = state === 'done';
                        const isCurrent = state === 'current';
                        const base = 'flex items-center justify-between px-3 py-2 rounded-lg border';
                        const style = isDone
                          ? 'bg-emerald-50 border-emerald-200'
                          : isCurrent
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200';
                        const icon = isDone ? '✔' : isCurrent ? '⚙' : '⬜';
                        const text = isDone ? 'text-emerald-800' : isCurrent ? 'text-blue-800' : 'text-gray-700';
                        return (
                          <div key={s.key} className={`${base} ${style}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${text}`}>{icon}</span>
                              <span className={`text-sm font-medium ${text}`}>{s.label}</span>
                            </div>
                            {isCurrent && <span className="text-xs font-semibold text-blue-700">In progress</span>}
                            {s.key === 'completed' && project.status === 'completed' && <span className="text-xs font-semibold text-emerald-700">Done</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tech Stack */}
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.slice(0, 4).map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                            +{project.tech_stack.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quote/Invoice Info */}
                  {(project.quote_project_title || project.invoice_number) && (
                    <div className="mb-4 text-xs text-gray-500 space-y-1">
                      {project.quote_project_title && (
                        <div>Quote: {project.quote_project_title}</div>
                      )}
                      {project.invoice_number && (
                        <div>Invoice: {project.invoice_number}</div>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Live Demo
                      </a>
                    )}
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProjects;
