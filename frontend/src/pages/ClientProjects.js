import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-cyan-50">
    <svg className="w-14 h-14 text-teal-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

const StageStepper = ({ status }) => (
  <div className="flex items-center gap-1">
    {STAGES.map((stage, index) => {
      const state = getStageState(status, stage.key);
      const isDone = state === 'done';
      const isCurrent = state === 'current';
      return (
        <React.Fragment key={stage.key}>
          <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                isDone || isCurrent ? 'bg-teal-500' : 'bg-slate-200'
              } ${isCurrent ? 'ring-4 ring-teal-100' : ''}`}
              title={stage.label}
            />
            <span
              className={`text-[10px] font-medium truncate w-full text-center ${
                isCurrent ? 'text-teal-700' : isDone ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {stage.label}
            </span>
          </div>
          {index < STAGES.length - 1 && (
            <div className={`h-0.5 flex-1 min-w-[8px] mb-4 rounded-full ${isDone ? 'bg-teal-300' : 'bg-slate-100'}`} />
          )}
        </React.Fragment>
      );
    })}
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

  const { activeCount, completedCount } = useMemo(() => ({
    activeCount: projects.filter((p) => p.status !== 'completed').length,
    completedCount: projects.filter((p) => p.status === 'completed').length,
  }), [projects]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-lg ring-1 ring-slate-900/5">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-teal-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in required</h1>
          <p className="text-slate-600 text-sm mb-6">Log in to view and manage your projects.</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading your projects…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/90">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.02)_45%,transparent_100%)]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <span aria-hidden className="text-slate-300">/</span>
            <Link to="/profile" className="hover:text-slate-800 transition-colors">Profile</Link>
            <span aria-hidden className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">My Projects</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Delivery hub</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Projects</h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Track delivery stages, share files, and follow progress on every project we&apos;re building for you.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 min-w-[5.5rem] text-center shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Active</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">{activeCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 min-w-[5.5rem] text-center shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Completed</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">{completedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="relative mb-8 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-900/[0.03]">
          {listRefreshing && (
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-medium text-teal-700">
              <span className="inline-block w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              Updating
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <label htmlFor="search" className="sr-only">Search projects</label>
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                id="search"
                type="search"
                autoComplete="off"
                placeholder="Search by name, description, or tech stack…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="sm:w-52">
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 text-slate-900"
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
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-900 font-medium text-sm">{error}</p>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-teal-900/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              {debouncedSearch || statusFilter
                ? 'Try adjusting your search or filter.'
                : 'Projects appear here after your invoice is paid. Track quotes and billing from your profile in the meantime.'}
            </p>
            {!debouncedSearch && !statusFilter && (
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link to="/profile" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-sm hover:bg-teal-500 transition-colors">
                  Go to profile
                </Link>
                <Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Request a quote
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = clampProgress(project.progress_percentage);
              const files = getFilesForProject(project.id);
              const isFilesOpen = expandedFilesProjectId === project.id;
              const coverUrl = getProjectCoverUrl(project);
              const hasImage = Boolean(coverUrl);

              return (
                <article
                  key={project.id}
                  className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm ring-1 ring-slate-900/[0.03] hover:shadow-lg hover:border-teal-200/80 transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    {hasImage ? (
                      <img
                        src={coverUrl}
                        alt={project.name}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 ${hasImage ? 'hidden' : ''}`}>
                      <ProjectPlaceholder />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide shadow-sm ${getProjectStatusClass(project.status)}`}>
                      {project.status_label || project.status?.replace(/_/g, ' ') || '—'}
                    </span>
                    {project.is_public && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100/95 text-violet-800 shadow-sm">
                        Public
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 shadow-sm">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Progress</span>
                          <span className="text-teal-700 tabular-nums">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-teal-800 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="mb-4 px-1">
                      <StageStepper status={project.status} />
                    </div>

                    {(project.quote_project_title || project.invoice_number) && (
                      <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        {project.quote_project_title && (
                          <span className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-slate-600">
                            Quote: <span className="font-medium text-slate-800">{project.quote_project_title}</span>
                          </span>
                        )}
                        {project.invoice_number && (
                          <span className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-slate-600">
                            Invoice: <span className="font-medium text-slate-800">{project.invoice_number}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {project.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.tech_stack.slice(0, 4).map((tech, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-teal-50 text-teal-800 rounded-md font-medium border border-teal-100">
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-md">+{project.tech_stack.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleFiles(project.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-100 hover:border-teal-100 text-sm font-semibold text-slate-800 transition-colors"
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
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-3">
                          {files.length === 0 ? (
                            <p className="text-sm text-slate-600">No files yet. Upload below.</p>
                          ) : (
                            <ul className="space-y-2">
                              {files.map((pf) => (
                                <li key={pf.id} className="flex items-center justify-between gap-2 text-sm">
                                  <span className="truncate text-slate-800" title={pf.description || pf.file_name}>
                                    {pf.file_name || pf.description || `File ${pf.id}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(pf.id, pf.file_name)}
                                    className="text-teal-700 font-semibold hover:text-teal-900 flex-shrink-0"
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
                            <input type="file" name="file" required className="text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white file:border file:border-slate-200 file:text-teal-700 file:font-semibold" />
                            <input type="text" name="description" placeholder="Description (optional)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300" />
                            <button
                              type="submit"
                              disabled={uploadingForProject === project.id}
                              className="px-3 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-500 disabled:opacity-50 transition-colors"
                            >
                              {uploadingForProject === project.id ? 'Uploading…' : 'Upload file'}
                            </button>
                          </form>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-1">
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Live site
                          </a>
                        )}
                        {project.repo_url && (
                          <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700">
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
