import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1593724000-34c976c8646b?auto=format&fit=crop&w=1920&q=85';

const INPUT_CLASS =
  'mt-1.5 block w-full border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors bg-white';

const getStatusBadgeClass = (status) => {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  if (status === 'In Progress') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
  return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
};

const AdminProjects = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    tags: '',
    status: 'Completed',
    category: 'Web',
    github_url: '',
    live_url: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchProjects();
  }, [isAuthenticated, user, navigate]);

  const fetchProjects = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/projects/');
      const data = response.data?.results ?? response.data;
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      technologies: '',
      tags: '',
      status: 'Completed',
      category: 'Web',
      github_url: '',
      live_url: '',
      image: null,
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    const techStr = Array.isArray(project.technologies)
      ? project.technologies.join(', ')
      : (project.technologies || '');
    const tagsStr = Array.isArray(project.tags) ? project.tags.join(', ') : (project.tags || '');
    setFormData({
      title: project.title || '',
      description: project.description || '',
      technologies: techStr,
      tags: tagsStr,
      status: project.status || 'Completed',
      category: project.category || 'Web',
      github_url: project.github_url || '',
      live_url: project.live_url || '',
      image: null,
    });
    setImagePreview(project.image ? getMediaUrl(project.image) : null);
    setShowForm(true);
  };

  const handleDelete = (project) => {
    setDeleteDialog({ open: true, project });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/projects/${deleteDialog.project.id}/`);
      fetchProjects();
      setDeleteDialog({ open: false, project: null });
    } catch {
      alert('Failed to delete project');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('technologies', formData.technologies || '');
      fd.append('tags', formData.tags || '');
      fd.append('status', formData.status);
      fd.append('category', formData.category);
      fd.append('github_url', formData.github_url || '');
      fd.append('live_url', formData.live_url || '');
      if (formData.image) fd.append('image', formData.image);

      if (editingProject) {
        await api.put(`/projects/${editingProject.id}/`, fd);
      } else {
        await api.post('/projects/', fd);
      }
      fetchProjects();
      setShowForm(false);
      setEditingProject(null);
    } catch {
      alert('Failed to save project');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-48 rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="h-96 rounded-2xl bg-slate-200" />
        </div>
      </AdminLayout>
    );
  }

  const completedCount = projects.filter((p) => p.status === 'Completed').length;
  const inProgressCount = projects.filter((p) => p.status === 'In Progress').length;
  const plannedCount = projects.filter((p) => p.status === 'Planned').length;

  const statCards = [
    {
      label: 'Total projects',
      value: projects.length,
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'In progress',
      value: inProgressCount,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Planned',
      value: plannedCount,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      tone: 'bg-white border border-amber-100',
      valueClass: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-600',
    },
  ];

  const statusFilters = [
    { id: 'all', label: 'All', count: projects.length },
    { id: 'Completed', label: 'Completed', count: completedCount },
    { id: 'In Progress', label: 'In progress', count: inProgressCount },
    { id: 'Planned', label: 'Planned', count: plannedCount },
  ];

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        {/* Page banner */}
        <section className="relative overflow-hidden rounded-3xl shadow-lg min-h-[200px] sm:min-h-[220px]">
          <img src={HERO_IMAGE} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/30" />
          <div className="relative px-6 sm:px-8 py-8 sm:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 mb-2">Admin · Portfolio</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Projects</h1>
              <p className="mt-2 text-slate-200 text-sm sm:text-base max-w-lg">
                Create and manage the projects shown on your public portfolio.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm shadow-md hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add project
              </button>
              <button
                type="button"
                onClick={() => fetchProjects(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[110px]"
              >
                {refreshing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className={`rounded-2xl p-5 shadow-sm ${stat.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${stat.tone.includes('text-white') ? 'text-slate-300' : 'text-slate-500'}`}>
                    {stat.label}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${stat.valueClass || (stat.tone.includes('text-white') ? 'text-white' : 'text-slate-900')}`}>
                    {stat.value}
                  </p>
                </div>
                <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* All projects */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-900 px-5 sm:px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">All projects</h2>
                  <p className="text-sm text-slate-300">
                    Browse, filter, and manage your portfolio entries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 self-start lg:self-center px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New project
              </button>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5 bg-slate-50 border-b border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by title or description…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === filter.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {filter.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      statusFilter === filter.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs font-medium text-slate-500">
              Showing <span className="text-slate-800 font-semibold">{filteredProjects.length}</span> of{' '}
              <span className="text-slate-800 font-semibold">{projects.length}</span> projects
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">No projects found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try changing your search or filters.'
                  : 'Get started by adding your first portfolio project.'}
              </p>
              <button
                type="button"
                onClick={hasActiveFilters ? clearFilters : handleCreate}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                {hasActiveFilters ? 'Clear filters' : 'Add first project'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-white">
                    <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Project</th>
                    <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Category</th>
                    <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Created</th>
                    <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => {
                    const imageUrl = project.image ? getMediaUrl(project.image) : null;
                    return (
                      <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 sm:px-6 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
                              {imageUrl ? (
                                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{project.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xs sm:max-w-md">
                                {project.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                          {project.category}
                        </td>
                        <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(project)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(project)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end sm:items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} aria-hidden="true" />
              <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {editingProject ? 'Edit project' : 'New project'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {editingProject ? 'Update portfolio entry details' : 'Add a project to your public portfolio'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Basic info</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Title *</label>
                          <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Description *</label>
                          <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Status</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className={INPUT_CLASS}
                            >
                              <option value="Completed">Completed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Planned">Planned</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Category</label>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className={INPUT_CLASS}
                            >
                              <option value="Web">Web Development</option>
                              <option value="Mobile">Mobile Development</option>
                              <option value="Desktop">Desktop Application</option>
                              <option value="API">API Development</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tech & tags</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Technologies</label>
                          <input
                            type="text"
                            value={formData.technologies}
                            onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                            placeholder="React, Django, PostgreSQL"
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Tags</label>
                          <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="web, fullstack"
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Links</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">GitHub URL</label>
                          <input
                            type="url"
                            value={formData.github_url}
                            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Live URL</label>
                          <input
                            type="url"
                            value={formData.live_url}
                            onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Cover image</p>
                      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-slate-600 font-medium">Click to upload image</span>
                        <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-3 h-36 w-full max-w-xs object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                    >
                      {editingProject ? 'Save changes' : 'Create project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, project: null })}
          onConfirm={confirmDelete}
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteDialog.project?.title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
