import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  ADMIN_INPUT_CLASS,
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=85';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'completed', label: 'Completed' },
];

const statusColors = {
  planning: 'bg-amber-100 text-amber-800',
  design: 'bg-sky-100 text-sky-800',
  development: 'bg-blue-100 text-blue-800',
  testing: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const statusLabels = {
  planning: 'Planning',
  design: 'Design',
  development: 'Development',
  testing: 'Testing',
  completed: 'Completed',
};

const AdminClientProjects = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clients, setClients] = useState([]);
  const [projectFilesForModal, setProjectFilesForModal] = useState([]);
  const [uploadingFileForProject, setUploadingFileForProject] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    status: 'planning',
    tech_stack: '',
    quote: '',
    invoice: '',
    repo_url: '',
    live_url: '',
    is_public: false,
    hero_image: null,
    screenshots: [],
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [projectsRes, quotesRes, invoicesRes, clientsRes] = await Promise.all([
        api.get('/clients/projects/'),
        api.get('/quotes/'),
        api.get('/invoices/'),
        api.get('/clients/clients/'),
      ]);
      const projectsData = projectsRes.data?.results ?? projectsRes.data;
      const quotesData = quotesRes.data?.results ?? quotesRes.data;
      const invoicesData = invoicesRes.data?.results ?? invoicesRes.data;
      const clientsData = clientsRes.data?.results ?? clientsRes.data;
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch {
      // keep existing data on refresh failure
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  const handleCreate = () => {
    setEditingProject(null);
    setGalleryFiles([]);
    setFormData({
      name: '',
      description: '',
      client: '',
      status: 'planning',
      tech_stack: '',
      quote: '',
      invoice: '',
      repo_url: '',
      live_url: '',
      is_public: false,
      hero_image: null,
      screenshots: [],
    });
    setShowForm(true);
  };

  const fetchProjectFilesForProject = async (projectId) => {
    try {
      const res = await api.get('/clients/project-files/', { params: { project: projectId } });
      const data = res.data?.results ?? res.data ?? [];
      setProjectFilesForModal(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjectFilesForModal([]);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setGalleryFiles([]);
    fetchProjectFilesForProject(project.id);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      client: project.client || project.client_id || '',
      status: project.status || 'planning',
      tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : project.tech_stack || '',
      quote: project.quote || '',
      invoice: project.invoice || '',
      repo_url: project.repo_url || '',
      live_url: project.live_url || '',
      is_public: project.is_public || false,
      hero_image: null,
      screenshots: project.screenshots || [],
    });
    setShowForm(true);
  };

  const handleDelete = (project) => {
    setDeleteDialog({ open: true, project });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/clients/projects/${deleteDialog.project.id}/`);
      fetchData();
      setDeleteDialog({ open: false, project: null });
    } catch {
      alert('Failed to delete project');
    }
  };

  const uploadGalleryImages = async (projectId, files) => {
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/clients/projects/${projectId}/upload_screenshot/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        client: formData.client || null,
        status: formData.status,
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map((t) => t.trim()).filter(t => t).join(',') : '',
        quote: formData.quote || null,
        invoice: formData.invoice || null,
        repo_url: formData.repo_url || '',
        live_url: formData.live_url || '',
        is_public: formData.is_public,
      };

      let projectId = editingProject?.id;

      if (formData.hero_image) {
        const fd = new FormData();
        fd.append('name', submitData.name);
        fd.append('description', submitData.description);
        if (submitData.client) fd.append('client', submitData.client);
        fd.append('status', submitData.status);
        fd.append('tech_stack', submitData.tech_stack);
        if (submitData.quote) fd.append('quote', submitData.quote);
        if (submitData.invoice) fd.append('invoice', submitData.invoice);
        fd.append('repo_url', submitData.repo_url);
        fd.append('live_url', submitData.live_url);
        fd.append('is_public', submitData.is_public);
        fd.append('hero_image', formData.hero_image);

        if (editingProject) {
          const { data } = await api.patch(`/clients/projects/${editingProject.id}/`, fd);
          projectId = data?.id ?? editingProject.id;
        } else {
          const { data } = await api.post('/clients/projects/', fd);
          projectId = data.id;
        }
      } else if (editingProject) {
        const { data } = await api.put(`/clients/projects/${editingProject.id}/`, submitData);
        projectId = data?.id ?? editingProject.id;
      } else {
        const { data } = await api.post('/clients/projects/', submitData);
        projectId = data.id;
      }

      if (galleryFiles.length > 0 && projectId) {
        await uploadGalleryImages(projectId, galleryFiles);
      }

      fetchData();
      setShowForm(false);
      setEditingProject(null);
      setGalleryFiles([]);
    } catch (err) {
      alert('Failed to save project: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
    }
  };

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const projectClientId = project.client ?? project.client_id;
      const matchesClient = !clientFilter || String(projectClientId) === String(clientFilter);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesSearch =
        !q ||
        project.name?.toLowerCase().includes(q) ||
        project.description?.toLowerCase().includes(q) ||
        project.client_name?.toLowerCase().includes(q);
      return matchesClient && matchesStatus && matchesSearch;
    });
  }, [projects, clientFilter, statusFilter, searchTerm]);

  const publicCount = projects.filter((p) => p.is_public).length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  const statCards = [
    {
      label: 'Total',
      value: projects.length,
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    {
      label: 'Public',
      value: publicCount,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Completed',
      value: completedCount,
      tone: 'bg-white border border-slate-100',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Filtered',
      value: filteredProjects.length,
      tone: 'bg-white border border-slate-100',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const statusFilters = [
    { id: 'all', label: 'All', count: projects.length },
    ...STATUS_OPTIONS.map((opt) => ({
      id: opt.value,
      label: opt.label,
      count: projects.filter((p) => p.status === opt.value).length,
    })),
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const clientFilteredProjects = clientFilter
    ? projects.filter((p) => String(p.client ?? p.client_id) === String(clientFilter))
    : projects;

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Clients & Users"
          title="Client Projects"
          description="Manage delivery projects and choose which appear on the public Projects page."
          primaryAction={
            <div className="flex flex-wrap gap-2">
              <AdminPrimaryBannerButton onClick={handleCreate}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add project
              </AdminPrimaryBannerButton>
              <Link
                to="/admin/clients"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Clients
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchData(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 sm:px-6 py-4">
          <label htmlFor="project-client-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Filter by client
          </label>
          <select
            id="project-client-filter"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className={`${ADMIN_INPUT_CLASS} !mt-0 max-w-md`}
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <AdminListSection
          title="All projects"
          subtitle="Track delivery status and portfolio visibility"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by project or client name…"
          filters={statusFilters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showingCount={filteredProjects.length}
          totalCount={clientFilteredProjects.length}
          hasActiveFilters={!!searchTerm.trim() || statusFilter !== 'all' || !!clientFilter}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setClientFilter('');
          }}
          onCreate={handleCreate}
          createLabel="Add project"
          emptyTitle="No projects found"
          emptyDescription={
            searchTerm.trim() || statusFilter !== 'all' || clientFilter
              ? 'Try adjusting your search or filters.'
              : 'Create your first project to get started.'
          }
          emptyActionLabel={
            searchTerm.trim() || statusFilter !== 'all' || clientFilter ? 'Clear filters' : 'Add project'
          }
          onEmptyAction={
            searchTerm.trim() || statusFilter !== 'all' || clientFilter
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setClientFilter('');
                }
              : handleCreate
          }
        >
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Name</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Client</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Public</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden xl:table-cell">Tech</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 sm:px-6 py-4 text-sm font-semibold text-slate-900">{project.name}</td>
                    <td className="px-5 sm:px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">{project.client_name || '—'}</td>
                    <td className="px-5 sm:px-6 py-4 hidden md:table-cell">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[project.status] || 'bg-slate-100 text-slate-800'}`}>
                        {statusLabels[project.status] || project.status || 'Planning'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden lg:table-cell">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${project.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {project.is_public ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 ? (
                          project.tech_stack.slice(0, 3).map((tech, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md font-medium">
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <AdminActionButtons onEdit={() => handleEdit(project)} onDelete={() => handleDelete(project)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        </AdminListSection>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm"
                onClick={() => {
                  setShowForm(false);
                  setGalleryFiles([]);
                }}
              />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-200">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    {editingProject ? 'Edit Project' : 'Create Project'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client *</label>
                      <select
                        required
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a client</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hero Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, hero_image: e.target.files?.[0] || null })}
                        className="mt-1 block w-full text-sm text-gray-600"
                      />
                      {editingProject?.hero_image && !formData.hero_image && (
                        <p className="mt-1 text-xs text-gray-500">Current: {editingProject.hero_image}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gallery images</label>
                      <p className="text-xs text-gray-500 mt-0.5 mb-1">
                        Optional. Add images for the client &quot;My Projects&quot; card and the public Projects page. Saves after you click Update.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                        className="mt-1 block w-full text-sm text-gray-600"
                      />
                      {galleryFiles.length > 0 && (
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                          {galleryFiles.length} new image(s) will upload after save.
                        </p>
                      )}
                      {editingProject && Array.isArray(formData.screenshots) && formData.screenshots.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">Current gallery</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.screenshots.map((src, i) => (
                              <img key={i} src={src} alt="" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status *</label>
                        <select
                          required
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="planning">Planning</option>
                          <option value="design">Design</option>
                          <option value="development">Development</option>
                          <option value="testing">Testing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Public Project</label>
                        <div className="mt-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.is_public}
                              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Show on Projects page</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Related Quote (Optional)</label>
                        <select
                          value={formData.quote}
                          onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">None</option>
                          {quotes.map((quote) => (
                            <option key={quote.id} value={quote.id}>
                              {quote.project_title} - {quote.client_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Related Invoice (Optional)</label>
                        <select
                          value={formData.invoice}
                          onChange={(e) => setFormData({ ...formData, invoice: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">None</option>
                          {invoices.map((invoice) => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.invoice_number} - {invoice.client_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tech Stack (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tech_stack}
                        onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                        placeholder="e.g., React, Django, PostgreSQL"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Repository URL</label>
                        <input
                          type="url"
                          value={formData.repo_url}
                          onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Live URL</label>
                        <input
                          type="url"
                          value={formData.live_url}
                          onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Project files (when editing) */}
                    {editingProject && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project files</label>
                        <ul className="mb-2 max-h-32 overflow-y-auto space-y-1 text-sm">
                          {projectFilesForModal.length === 0 ? (
                            <li className="text-gray-500">No files. Upload below.</li>
                          ) : (
                            projectFilesForModal.map((pf) => (
                              <li key={pf.id} className="flex items-center justify-between">
                                <span className="truncate">{pf.file_name || pf.description || `File ${pf.id}`}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await api.get(`/clients/project-files/${pf.id}/download/`, { responseType: 'blob' });
                                      const url = window.URL.createObjectURL(new Blob([res.data]));
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = pf.file_name || 'download';
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                    } catch {
                                      // Download failed silently; user can retry
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 ml-2"
                                >
                                  Download
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target;
                            const fileInput = form.querySelector('input[type="file"]');
                            const descInput = form.querySelector('input[name="fileDesc"]');
                            if (!fileInput?.files?.[0] || uploadingFileForProject) return;
                            setUploadingFileForProject(editingProject.id);
                            try {
                              const fd = new FormData();
                              fd.append('project', editingProject.id);
                              fd.append('file', fileInput.files[0]);
                              if (descInput?.value) fd.append('description', descInput.value);
                              await api.post('/clients/project-files/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                              await fetchProjectFilesForProject(editingProject.id);
                              form.reset();
                            } finally {
                              setUploadingFileForProject(null);
                            }
                          }}
                          className="flex flex-wrap gap-2 items-end"
                        >
                          <input type="file" className="text-sm" required />
                          <input type="text" name="fileDesc" placeholder="Description (optional)" className="flex-1 min-w-0 px-2 py-1 border rounded text-sm" />
                          <button type="submit" disabled={!!uploadingFileForProject} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
                            {uploadingFileForProject ? 'Uploading...' : 'Upload'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setGalleryFiles([]);
                      }}
                      className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
                    >
                      {editingProject ? 'Update' : 'Create'}
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
          message={`Are you sure you want to delete "${deleteDialog.project?.name}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminClientProjects;
