import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

const AdminClientProjects = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clients, setClients] = useState([]);
  const [projectFilesForModal, setProjectFilesForModal] = useState([]);
  const [uploadingFileForProject, setUploadingFileForProject] = useState(null);
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
  }, [isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        client: formData.client || null,
        status: formData.status,
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(t => t.trim()).filter(t => t).join(',') : '',
        quote: formData.quote || null,
        invoice: formData.invoice || null,
        repo_url: formData.repo_url || '',
        live_url: formData.live_url || '',
        is_public: formData.is_public,
        screenshots: formData.screenshots || [],
      };

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
        fd.append('screenshots', JSON.stringify(submitData.screenshots));
        fd.append('hero_image', formData.hero_image);

        if (editingProject) {
          await api.patch(`/clients/projects/${editingProject.id}/`, fd);
        } else {
          await api.post('/clients/projects/', fd);
        }
      } else {
        if (editingProject) {
          await api.put(`/clients/projects/${editingProject.id}/`, submitData);
        } else {
          await api.post('/clients/projects/', submitData);
        }
      }
      fetchData();
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      alert('Failed to save project: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
    }
  };

  const filteredProjects = projects.filter((project) => {
    const projectClientId = project.client ?? project.client_id;
    const matchesClient = !clientFilter || String(projectClientId) === String(clientFilter);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClient && matchesStatus && matchesSearch;
  });

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Client', accessor: 'client_name' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => {
        const statusColors = {
          planning: 'bg-amber-100 text-amber-800',
          design: 'bg-sky-100 text-sky-800',
          development: 'bg-blue-100 text-blue-800',
          testing: 'bg-purple-100 text-purple-800',
          completed: 'bg-emerald-100 text-emerald-800',
        };
        const labels = { planning: 'Planning', design: 'Design', development: 'Development', testing: 'Testing', completed: 'Completed' };
        return (
          <span className={`px-2 py-1 text-xs rounded ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {labels[value] || value || 'Planning'}
          </span>
        );
      },
    },
    {
      header: 'Public',
      accessor: 'is_public',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded ${value ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Tech Stack',
      accessor: 'tech_stack',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(value) && value.length > 0 ? value.slice(0, 3).map((tech, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
              {tech}
            </span>
          )) : '-'}
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const publicCount = projects.filter((p) => p.is_public).length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">Loading projects...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Client Projects</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage projects and set which appear on the public portfolio.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleCreate}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-lg sm:rounded-xl font-semibold transition-colors text-sm sm:text-base"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Total</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{projects.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Public</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">{publicCount}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Completed</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{completedCount}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Filtered</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{filteredProjects.length}</div>
          </div>
        </div>

        {/* Search & filters */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by project or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
            />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredProjects}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No projects found"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
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
                            <span className="ml-2 text-sm text-gray-700">Visible to public</span>
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
                      onClick={() => setShowForm(false)}
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
