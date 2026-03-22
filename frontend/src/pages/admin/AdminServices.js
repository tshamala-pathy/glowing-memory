import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const AdminServices = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    features: '',
    categories: '',
    icon: '',
    is_featured: false,
    sort_order: 0,
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
    fetchServices();
  }, [isAuthenticated, user, navigate]);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/');
      const data = response.data?.results ?? response.data;
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      short_description: '',
      price: '',
      features: '',
      categories: '',
      icon: '',
      is_featured: false,
      sort_order: 0,
      image: null,
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const parseCategories = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) return val.map((c) => (typeof c === 'object' ? c?.name : c)).filter(Boolean).join(', ');
    return String(val);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      short_description: service.short_description || '',
      price: service.price ?? '',
      features: Array.isArray(service.features) ? service.features.join(', ') : (service.features || ''),
      categories: parseCategories(service.categories),
      icon: service.icon || '',
      is_featured: service.is_featured || false,
      sort_order: service.sort_order ?? 0,
      image: null,
    });
    setImagePreview(service.image ? getMediaUrl(service.image) : null);
    setShowForm(true);
  };

  const handleDelete = (service) => {
    setDeleteDialog({ open: true, service });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/services/${deleteDialog.service.id}/`);
      fetchServices();
      setDeleteDialog({ open: false, service: null });
    } catch {
      alert('Failed to delete service');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description || '',
        price: formData.price ? parseFloat(formData.price) : null,
        features: formData.features || '',
        categories: formData.categories || '',
        icon: formData.icon || '',
        is_featured: formData.is_featured,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };

      if (formData.image) {
        const fd = new FormData();
        Object.entries(submitData).forEach(([k, v]) => {
          if (v != null && v !== '') fd.append(k, v);
        });
        fd.append('image', formData.image);

        if (editingService) {
          await api.patch(`/services/${editingService.id}/`, fd);
        } else {
          await api.post('/services/', fd);
        }
      } else {
        if (editingService) {
          await api.put(`/services/${editingService.id}/`, submitData);
        } else {
          await api.post('/services/', submitData);
        }
      }
      fetchServices();
      setShowForm(false);
      setEditingService(null);
    } catch (err) {
      alert('Failed to save service: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
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

  const filteredServices = services.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (value, row) => (
        <div className="font-medium text-slate-900">
          {value}
          {row.is_featured && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Short',
      accessor: 'short_description',
      render: (value) => (
        <div className="max-w-xs truncate text-slate-600 text-sm">{value || '-'}</div>
      ),
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (value) =>
        value != null ? (
          <span className="font-medium text-slate-700">R {parseFloat(value).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: 'Order',
      accessor: 'sort_order',
      render: (value) => <span className="text-slate-600">{value ?? 0}</span>,
    },
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
            <p className="text-slate-600 font-medium">Loading services...</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Services</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage service offerings displayed on the public site.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleCreate}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </button>
              <button
                onClick={fetchServices}
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
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{services.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Featured</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-amber-600">
              {services.filter((s) => s.is_featured).length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">With Price</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              {services.filter((s) => s.price != null && s.price > 0).length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Filtered</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{filteredServices.length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Search by name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredServices}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No services found"
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
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-200 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    {editingService ? 'Edit Service' : 'Create Service'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Web Development"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Short description</label>
                      <input
                        type="text"
                        maxLength={300}
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        placeholder="Brief teaser for cards (max 300 chars)"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                      <p className="mt-1 text-xs text-slate-500">{formData.short_description.length}/300</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed explanation of the service"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Price (ZAR)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="Optional"
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Sort order</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                      />
                      <label htmlFor="is_featured" className="text-sm font-medium text-slate-700">
                        Featured service (show prominently)
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Icon (e.g. fas fa-code)</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="FontAwesome class or icon name"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Features (comma-separated)</label>
                      <textarea
                        rows={3}
                        value={formData.features}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                        placeholder="e.g. Responsive design, SEO optimization, Support"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Categories (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.categories}
                        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        placeholder="e.g. Web, Development, Consulting"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
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
                          className="mt-2 h-24 w-24 object-cover rounded-xl border border-slate-200"
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
                      {editingService ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, service: null })}
          onConfirm={confirmDelete}
          title="Delete Service"
          message={`Are you sure you want to delete "${deleteDialog.service?.name}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
