import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import api, { getMediaUrl } from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1573164574572-475f2930c136?auto=format&fit=crop&w=1920&q=85';

const AdminServices = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchServices = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/services/');
      const data = response.data?.results ?? response.data;
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
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

  const filteredServices = useMemo(
    () =>
      services.filter(
        (s) =>
          !searchTerm ||
          s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [services, searchTerm]
  );

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Total services',
      value: services.length,
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Featured',
      value: services.filter((s) => s.is_featured).length,
      tone: 'bg-white border border-amber-100',
      valueClass: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
    {
      label: 'With price',
      value: services.filter((s) => s.price != null && s.price > 0).length,
      tone: 'bg-white border border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Showing',
      value: filteredServices.length,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Business"
          title="Services"
          description="Manage service offerings displayed on the public site."
          primaryAction={
            <AdminPrimaryBannerButton onClick={handleCreate}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add service
            </AdminPrimaryBannerButton>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchServices(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <AdminListSection
          title="All services"
          subtitle="Browse and manage your service catalog"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name or description…"
          showingCount={filteredServices.length}
          totalCount={services.length}
          hasActiveFilters={!!searchTerm.trim()}
          onClearFilters={() => setSearchTerm('')}
          onCreate={handleCreate}
          createLabel="New service"
          emptyTitle="No services found"
          emptyDescription={
            searchTerm.trim() ? 'Try a different search term.' : 'Add your first service to get started.'
          }
          emptyActionLabel={searchTerm.trim() ? 'Clear search' : 'Add first service'}
          onEmptyAction={searchTerm.trim() ? () => setSearchTerm('') : handleCreate}
        >
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Service</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Price</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Order</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
                          {service.image ? (
                            <img src={getMediaUrl(service.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">—</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 truncate">{service.name}</p>
                            {service.is_featured && (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                            {service.short_description || service.description?.substring(0, 80) || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-sm hidden md:table-cell">
                      {service.price != null ? (
                        <span className="font-medium text-slate-700">
                          R {parseFloat(service.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">{service.sort_order ?? 0}</td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <AdminActionButtons onEdit={() => handleEdit(service)} onDelete={() => handleDelete(service)} />
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
