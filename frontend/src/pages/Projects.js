import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

/**
 * Curated Unsplash images — used when a project has no image or the file fails to load.
 * (Stable order per card index keeps the grid visually varied.)
 */
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
];

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=85';

const placeholderForIndex = (index) => PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category, filters.search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const response = await api.get('/projects/', { params });
      const projectsData = response.data?.results ?? response.data ?? [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (err) {
      if (err?.isNetworkError) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err?.response?.data?.detail || err?.message || 'Failed to fetch projects');
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', category: '', search: '' });
  };

  const getTechList = (project) => {
    const t = project.technologies;
    if (Array.isArray(t)) return t;
    if (typeof t === 'string' && t.trim()) return t.split(',').map((x) => x.trim()).filter(Boolean);
    return [];
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25';
      case 'In Progress':
        return 'bg-sky-500/15 text-sky-900 ring-1 ring-sky-500/25';
      case 'Planned':
        return 'bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/25';
      default:
        return 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20';
    }
  };

  const hasActiveFilters = Boolean(filters.status || filters.category || filters.search);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="relative h-[min(42vh,380px)] overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-20">
          <div className="rounded-2xl bg-white shadow-lg border border-slate-200/80 p-6 mb-10 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-xl max-w-md mb-4" />
            <div className="h-12 bg-slate-100 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div key={k} className="rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-sm">
                <div className="aspect-[16/10] bg-slate-200 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
                  <div className="h-6 bg-slate-100 rounded w-4/5 animate-pulse" />
                  <div className="h-16 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load projects</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={fetchProjects}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-900/88 to-teal-950/90" />
          <div
            className="absolute inset-0 opacity-[0.08] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-teal-100 ring-1 ring-white/15 backdrop-blur-sm mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden />
            Portfolio
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Our Projects
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Explore our portfolio of innovative projects and cutting-edge solutions
          </p>
          {projects.length > 0 && (
            <p className="mt-6 text-sm font-medium text-slate-300">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              {hasActiveFilters ? ' match your filters' : ' to explore'}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-20 pb-16 sm:pb-20">
        {/* Filters */}
        <div className="mb-10 rounded-2xl bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/80">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 w-full">
              <div className="sm:col-span-1 lg:col-span-3">
                <label htmlFor="filter-status" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">All statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
              <div className="sm:col-span-1 lg:col-span-3">
                <label htmlFor="filter-category" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Category
                </label>
                <select
                  id="filter-category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">All categories</option>
                  <option value="Web">Web Development</option>
                  <option value="Mobile">Mobile Development</option>
                  <option value="Desktop">Desktop Application</option>
                  <option value="API">API Development</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-6">
                <label htmlFor="filter-search" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Search
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    id="filter-search"
                    type="search"
                    placeholder="Search by title, tech, or keywords…"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 ring-1 ring-slate-200/90 shadow-lg">
            <div className="grid md:grid-cols-2">
              <div className="relative min-h-[220px] md:min-h-[280px]">
                <img
                  src={PLACEHOLDER_IMAGES[2]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 to-slate-900/50" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900">No projects found</h2>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  {hasActiveFilters
                    ? 'Nothing matches those filters. Try clearing them or searching with different words.'
                    : 'New work will appear here soon. Check back later or get in touch to start a project.'}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition-colors md:self-start"
                  >
                    Reset filters
                  </button>
                ) : (
                  <Link
                    to="/contact"
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition-colors md:self-start"
                  >
                    Contact us
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const fallback = placeholderForIndex(index);
              const primarySrc = project.image ? getMediaUrl(project.image) : fallback;
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-teal-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                    <img
                      src={primarySrc}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallback;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-80 transition group-hover:opacity-90" />
                    <div className="absolute left-4 right-4 top-4 flex flex-wrap items-start justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${getStatusStyle(project.status)}`}>
                        {project.status}
                      </span>
                      {project.category && (
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-xs font-medium text-white/90">
                        {new Date(project.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <h2 className="mt-1 text-lg font-bold leading-snug text-white drop-shadow line-clamp-2 sm:text-xl">
                        {project.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">{project.description}</p>

                    {getTechList(project).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {getTechList(project).slice(0, 4).map((tech, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {tech}
                          </span>
                        ))}
                        {getTechList(project).length > 4 && (
                          <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                            +{getTechList(project).length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
                      <span className="text-sm font-semibold text-teal-700 group-hover:text-teal-800">
                        {project.live_url ? (
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Live demo
                          </span>
                        ) : project.github_url ? (
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Source
                          </span>
                        ) : (
                          'View details'
                        )}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-teal-600 group-hover:text-white">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
