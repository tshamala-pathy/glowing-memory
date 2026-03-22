import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const AdminProjects = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/');
      const data = response.data?.results ?? response.data;
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
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

  const filteredProjects = projects.filter(
    (project) =>
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Image',
      accessor: 'image',
      render: (value, row) => {
        const url = value ? getMediaUrl(value) : null;
        return (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            {url ? (
              <img src={url} alt={row.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        );
      },
    },
    { header: 'Title', accessor: 'title' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            value === 'Completed'
              ? 'bg-emerald-100 text-emerald-800'
              : value === 'In Progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

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
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Projects</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage your portfolio projects displayed on the public site.</p>
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
                onClick={fetchProjects}
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
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Completed</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">
              {projects.filter((p) => p.status === 'Completed').length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">In Progress</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-blue-600">
              {projects.filter((p) => p.status === 'In Progress').length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Filtered</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{filteredProjects.length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
          />
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
              <div
                className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
              />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-200">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    {editingProject ? 'Edit Project' : 'Create Project'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
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
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        >
                          <option value="Web">Web Development</option>
                          <option value="Mobile">Mobile Development</option>
                          <option value="Desktop">Desktop Application</option>
                          <option value="API">API Development</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Technologies (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.technologies}
                        onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                        placeholder="e.g. React, Django, PostgreSQL"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="e.g. web, fullstack"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">GitHub URL</label>
                        <input
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Live URL</label>
                        <input
                          type="url"
                          value={formData.live_url}
                          onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-slate-600"
                      />
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-2 h-32 w-32 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>
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
          message={`Are you sure you want to delete "${deleteDialog.project?.title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
