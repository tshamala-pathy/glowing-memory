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
  const [projectFiles, setProjectFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadingForProject, setUploadingForProject] = useState(null);
  const [expandedFilesProjectId, setExpandedFilesProjectId] = useState(null);

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

      const response = await api.get('/clients/projects/my_projects/', { params });
      const projectsData = response.data?.results ?? response.data ?? [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setError('');
    } catch (err) {
      console.error('Error fetching client projects:', err);
      setError('Failed to load your projects. Please try again later.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFiles = async () => {
    try {
      const res = await api.get('/clients/project-files/');
      const data = res.data?.results ?? res.data ?? [];
      setProjectFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching project files:', err);
      setProjectFiles([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && projects.length > 0) fetchProjectFiles();
  }, [isAuthenticated, projects.length]);

  const getFilesForProject = (projectId) =>
    projectFiles.filter((f) => String(f.project) === String(projectId));

  const handleUploadFile = async (projectId, file, description) => {
    if (!file || uploadingForProject) return;
    setUploadingForProject(projectId);
    try {
      const formData = new FormData();
      formData.append('project', projectId);
      formData.append('file', file);
      if (description) formData.append('description', description);
      await api.post('/clients/project-files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setError('');
      await fetchProjectFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.file?.[0] || err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploadingForProject(null);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const res = await api.get(`/clients/project-files/${fileId}/download/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed.');
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
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white border border-[var(--aws-card-border)] p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Access denied</h1>
          <p className="text-[#545b64] mb-6">Please log in to view your projects.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)] transition-colors">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-[var(--aws-orange)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#545b64]">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#545b64] mb-2">
          <Link to="/" className="hover:text-[var(--aws-orange)]">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/profile" className="hover:text-[var(--aws-orange)]">Profile</Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--aws-dark)] font-medium">My Projects</span>
        </nav>
        <h1 className="text-2xl font-bold text-[var(--aws-dark)]">My Projects</h1>
        <p className="text-sm text-[#545b64] mt-1">View and track the status of all your projects.</p>
      </div>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {/* Filters */}
        <div className="mb-6 bg-white p-6 border border-[var(--aws-card-border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--aws-dark)] mb-2">Search Projects</label>
              <input
                type="text"
                placeholder="Search by name, description, or tech stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--aws-card-border)] focus:ring-2 focus:ring-[var(--aws-orange)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--aws-dark)] mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--aws-card-border)] focus:ring-2 focus:ring-[var(--aws-orange)] focus:border-transparent"
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

        {error && (
          <div className="mb-6 p-4 bg-[#fff4e5] border border-[#ffb366] text-[var(--aws-dark)] flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--aws-orange)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[var(--aws-card-border)]">
            <svg className="mx-auto h-12 w-12 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-base font-semibold text-[var(--aws-dark)]">No projects yet</h3>
            <p className="mt-1 text-sm text-[#545b64] max-w-md mx-auto">
              {searchTerm || statusFilter ? 'Try adjusting your search or filters.' : "You don't have any projects yet. Projects are created automatically when your invoice is paid. They'll appear here once you do."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-[var(--aws-card-border)] overflow-hidden hover:border-[var(--aws-orange)]/40 transition-colors"
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

                  {/* Project Files */}
                  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFilesProjectId((id) => (id === project.id ? null : project.id))
                      }
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Project files ({getFilesForProject(project.id).length})
                      </span>
                      <span>{expandedFilesProjectId === project.id ? '▼' : '▶'}</span>
                    </button>
                    {expandedFilesProjectId === project.id && (
                      <div className="p-3 bg-white border-t border-gray-200">
                        <ul className="space-y-2 mb-3">
                          {getFilesForProject(project.id).length === 0 ? (
                            <li className="text-sm text-gray-500">No files yet. Upload one below.</li>
                          ) : (
                            getFilesForProject(project.id).map((pf) => (
                              <li
                                key={pf.id}
                                className="flex items-center justify-between text-sm gap-2"
                              >
                                <span className="truncate text-gray-700" title={pf.description || pf.file_name}>
                                  {pf.file_name || pf.description || `File ${pf.id}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(pf.id, pf.file_name)}
                                  className="flex-shrink-0 text-[var(--aws-orange)] hover:underline font-medium"
                                >
                                  Download
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                        <form
                          className="flex flex-col gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target;
                            const fileInput = form.querySelector('input[type="file"]');
                            const descInput = form.querySelector('input[name="description"]');
                            if (fileInput?.files?.[0])
                              handleUploadFile(project.id, fileInput.files[0], descInput?.value || '');
                            form.reset();
                          }}
                        >
                          <input
                            type="file"
                            className="text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#fff4e5] file:text-[var(--aws-orange)]"
                            required
                          />
                          <input
                            type="text"
                            name="description"
                            placeholder="Description (optional)"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="submit"
                            disabled={uploadingForProject === project.id}
                            className="px-3 py-1.5 bg-[var(--aws-orange)] text-white text-sm font-medium rounded hover:bg-[var(--aws-orange-hover)] disabled:opacity-50"
                          >
                            {uploadingForProject === project.id ? 'Uploading...' : 'Upload'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--aws-orange)] hover:underline text-sm font-medium flex items-center gap-1"
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
                        className="text-[#545b64] hover:text-[var(--aws-orange)] text-sm font-medium flex items-center gap-1"
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
