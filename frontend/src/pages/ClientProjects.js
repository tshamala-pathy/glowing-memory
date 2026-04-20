import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import { getProjectStatusClass } from '../utils/formatters';

const STAGES = [
  { key: 'planning', label: 'Planning' },
  { key: 'design', label: 'Design' },
  { key: 'development', label: 'Development' },
  { key: 'testing', label: 'Testing' },
  { key: 'completed', label: 'Completed' },
];

const STAGE_ORDER = ['planning', 'design', 'development', 'testing', 'completed'];

const getStageState = (currentStatus, stageKey) => {
  const curIdx = STAGE_ORDER.indexOf(currentStatus);
  const stageIdx = STAGE_ORDER.indexOf(stageKey);
  if (curIdx === -1 || stageIdx === -1) return 'todo';
  if (stageIdx < curIdx) return 'done';
  return stageIdx === curIdx ? 'current' : 'todo';
};

/** Prefer hero image, then first gallery screenshot */
const getProjectCoverUrl = (project) => {
  if (!project) return null;
  if (project.hero_image) return getMediaUrl(project.hero_image);
  if (project.screenshots?.length) return getMediaUrl(project.screenshots[0]);
  return null;
};

const ProjectPlaceholder = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-teal-light)]/50 to-[var(--accent-sky-light)]/50">
    <svg className="w-14 h-14 text-[var(--accent-teal)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

const SEARCH_DEBOUNCE_MS = 400;

const ClientProjects = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadingForProject, setUploadingForProject] = useState(null);
  const [expandedFilesProjectId, setExpandedFilesProjectId] = useState(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchProjects = useCallback(async () => {
    const isFirst = !initialLoadDone.current;
    try {
      if (isFirst) setLoading(true);
      else setListRefreshing(true);
      setError('');
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/clients/projects/my_projects/', { params });
      const list = data?.results ?? data ?? [];
      setProjects(Array.isArray(list) ? list : []);
    } catch {
      setError('Failed to load your projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      initialLoadDone.current = true;
    }
  }, [debouncedSearch, statusFilter]);

  const fetchProjectFiles = useCallback(async () => {
    try {
      const { data } = await api.get('/clients/project-files/');
      const list = data?.results ?? data ?? [];
      setProjectFiles(Array.isArray(list) ? list : []);
    } catch {
      setProjectFiles([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to view your projects.');
      return;
    }
    fetchProjects();
  }, [isAuthenticated, fetchProjects]);

  useEffect(() => {
    if (isAuthenticated && projects.length > 0) fetchProjectFiles();
  }, [isAuthenticated, projects.length, fetchProjectFiles]);

  const getFilesForProject = (projectId) =>
    projectFiles.filter((f) => String(f.project) === String(projectId));

  const handleUploadFile = async (projectId, file, description) => {
    if (!file || uploadingForProject) return;
    setUploadingForProject(projectId);
    setError('');
    try {
      const formData = new FormData();
      formData.append('project', projectId);
      formData.append('file', file);
      if (description) formData.append('description', description);
      await api.post('/clients/project-files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProjectFiles();
    } catch (err) {
      setError(err.response?.data?.file?.[0] || err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploadingForProject(null);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const { data } = await api.get(`/clients/project-files/${fileId}/download/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Download failed.');
    }
  };

  const clampProgress = (n) => Math.max(0, Math.min(100, Number(n ?? 0)));
  const toggleFiles = (id) =>
    setExpandedFilesProjectId((prev) => (prev === id ? null : id));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-xl border border-[var(--aws-card-border)] p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--accent-teal-light)] flex items-center justify-center">
            <svg className="w-7 h-7 text-[var(--accent-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Sign in required</h1>
          <p className="text-[#545b64] text-sm mb-6">Log in to view and manage your projects.</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-[var(--accent-teal)] text-white font-semibold rounded-lg hover:bg-[var(--accent-teal-dark)] transition-colors"
          >
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
          <div className="inline-block w-10 h-10 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#545b64] font-medium">Loading your projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      <header className="relative overflow-hidden border-b border-[var(--aws-card-border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-teal)] via-[#0d9488] to-[#0e7490]" />
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.15%22%3E%3Cpath%20d%3D%22M20%2020h20v20H20zM0%200h20v20H0z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 text-white">
          <nav className="flex items-center gap-2 text-sm text-white/85 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span aria-hidden>/</span>
            <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-white">My Projects</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Projects</h1>
              <p className="mt-2 text-base text-white/90 max-w-xl">
                Track delivery stages, share files, and follow progress on every project we&apos;re building for you.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 border border-white/20">
                <p className="text-xs uppercase tracking-wide text-white/80">Active</p>
                <p className="text-2xl font-bold tabular-nums">{projects.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8 -mt-2">
        <div className="relative mb-6 rounded-xl border border-[var(--aws-card-border)] bg-white p-4 shadow-sm">
          {listRefreshing && (
            <div className="absolute top-3 right-3 flex items-center gap-2 text-xs font-medium text-[var(--accent-teal)]">
              <span className="inline-block w-3.5 h-3.5 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin" />
              Updating
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <label htmlFor="search" className="sr-only">Search projects</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                id="search"
                type="search"
                autoComplete="off"
                placeholder="Search by name, description, or tech stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-[var(--aws-card-border)] bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-[var(--accent-teal)] focus:border-transparent text-[var(--aws-dark)] placeholder-[#94a3b8]"
              />
            </div>
            <div className="sm:w-52">
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--aws-card-border)] bg-white focus:ring-2 focus:ring-[var(--accent-teal)] focus:border-transparent text-[var(--aws-dark)]"
              >
                <option value="">All statuses</option>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--accent-amber-light)] border border-amber-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--accent-amber)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800 font-medium">{error}</p>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--aws-card-border)] p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent-teal-light)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--aws-dark)] mb-2">No projects yet</h3>
            <p className="text-[#545b64] text-sm max-w-md mx-auto">
              {debouncedSearch || statusFilter
                ? 'Try adjusting your search or filter.'
                : "Projects appear here after your invoice is paid. We'll get started once payment is complete."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = clampProgress(project.progress_percentage);
              const files = getFilesForProject(project.id);
              const isFilesOpen = expandedFilesProjectId === project.id;
              const coverUrl = getProjectCoverUrl(project);
              const hasImage = Boolean(coverUrl);

              return (
                <article
                  key={project.id}
                  className="bg-white rounded-xl border border-[var(--aws-card-border)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--accent-teal)]/40 transition-all duration-200"
                >
                  <div className="relative h-44 overflow-hidden">
                    {hasImage ? (
                      <img
                        src={coverUrl}
                        alt={project.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 ${hasImage ? 'hidden' : ''}`}>
                      <ProjectPlaceholder />
                    </div>
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${getProjectStatusClass(project.status)}`}>
                      {project.status_label || project.status?.replace(/_/g, ' ') || '—'}
                    </span>
                    {project.is_public && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                        Public
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[var(--aws-dark)] mb-1 line-clamp-2">
                      {project.name}
                    </h3>
                    <p className="text-[#64748b] text-sm mb-4 line-clamp-2">
                      {project.description || 'No description'}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-medium text-[#64748b] mb-1.5">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-teal)] to-[var(--accent-sky)] transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {STAGES.map((s) => {
                        const state = getStageState(project.status, s.key);
                        const isDone = state === 'done';
                        const isCurrent = state === 'current';
                        return (
                          <div
                            key={s.key}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm ${
                              isDone ? 'bg-[var(--accent-teal-light)] text-[var(--accent-teal-dark)]' : isCurrent ? 'bg-[var(--accent-sky-light)] text-[var(--accent-sky)]' : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            <span className="font-medium">{isDone ? '✓' : isCurrent ? '●' : '○'} {s.label}</span>
                            {isCurrent && <span className="text-xs font-semibold">Active</span>}
                          </div>
                        );
                      })}
                    </div>

                    {(project.quote_project_title || project.invoice_number) && (
                      <div className="mb-4 text-xs text-[#64748b] space-y-0.5">
                        {project.quote_project_title && <div>Quote: {project.quote_project_title}</div>}
                        {project.invoice_number && <div>Invoice: {project.invoice_number}</div>}
                      </div>
                    )}

                    {project.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.tech_stack.slice(0, 4).map((tech, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-[var(--accent-teal-light)] text-[var(--accent-teal-dark)] rounded font-medium">
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="px-2 py-0.5 text-xs bg-slate-200 text-slate-600 rounded">+{project.tech_stack.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleFiles(project.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm font-medium text-[var(--aws-dark)] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Files ({files.length})
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${isFilesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isFilesOpen && (
                        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-3">
                          {files.length === 0 ? (
                            <p className="text-sm text-[#64748b]">No files yet. Upload below.</p>
                          ) : (
                            <ul className="space-y-2">
                              {files.map((pf) => (
                                <li key={pf.id} className="flex items-center justify-between gap-2 text-sm">
                                  <span className="truncate text-[var(--aws-dark)]" title={pf.description || pf.file_name}>
                                    {pf.file_name || pf.description || `File ${pf.id}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(pf.id, pf.file_name)}
                                    className="text-[var(--accent-teal)] font-medium hover:underline flex-shrink-0"
                                  >
                                    Download
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const fd = new FormData(e.target);
                              const file = fd.get('file');
                              if (file?.size) handleUploadFile(project.id, file, fd.get('description') || '');
                              e.target.reset();
                            }}
                            className="flex flex-col gap-2"
                          >
                            <input type="file" name="file" required className="text-sm text-[#64748b] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-white file:border file:border-slate-200 file:text-[var(--accent-teal)] file:font-medium" />
                            <input type="text" name="description" placeholder="Description (optional)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[var(--accent-teal)] focus:border-transparent" />
                            <button
                              type="submit"
                              disabled={uploadingForProject === project.id}
                              className="px-3 py-2 bg-[var(--accent-teal)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent-teal-dark)] disabled:opacity-50 transition-colors"
                            >
                              {uploadingForProject === project.id ? 'Uploading...' : 'Upload'}
                            </button>
                          </form>
                        </div>
                      )}

                      <div className="flex gap-3 pt-1">
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-teal)] hover:text-[var(--accent-teal-dark)] hover:underline">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Live
                          </a>
                        )}
                        {project.repo_url && (
                          <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[var(--accent-teal)]">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            Code
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientProjects;
