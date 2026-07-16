import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import api, { getMediaUrl } from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1920&q=85';

const StarIcon = ({ filled, className = 'w-4 h-4' }) => (
  <svg className={`${className} ${filled ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const AdminTestimonials = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, testimonial: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    company: '',
    testimonial: '',
    rating: 5,
    is_featured: false,
    is_approved: false,
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
    fetchTestimonials();
  }, [isAuthenticated, user, navigate]);

  const fetchTestimonials = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/testimonials/');
      const data = response.data.results || response.data;
      setTestimonials(Array.isArray(data) ? data : []);
    } catch {
      setTestimonials([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.testimonial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'approved' && t.is_approved) ||
        (statusFilter === 'pending' && !t.is_approved) ||
        (statusFilter === 'featured' && t.is_featured);
      return matchesSearch && matchesFilter;
    });
  }, [testimonials, searchTerm, statusFilter]);

  const approvedCount = testimonials.filter((t) => t.is_approved).length;
  const featuredCount = testimonials.filter((t) => t.is_featured).length;
  const pendingCount = testimonials.filter((t) => !t.is_approved).length;

  const handleCreate = () => {
    setEditingTestimonial(null);
    setFormData({
      name: '',
      position: '',
      company: '',
      testimonial: '',
      rating: 5,
      is_featured: false,
      is_approved: false,
      image: null,
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEdit = (t) => {
    setEditingTestimonial(t);
    setFormData({
      name: t.name || '',
      position: t.position || '',
      company: t.company || '',
      testimonial: t.testimonial || '',
      rating: t.rating || 5,
      is_featured: t.is_featured || false,
      is_approved: t.is_approved || false,
      image: null,
    });
    setImagePreview(t.image ? getMediaUrl(t.image) : null);
    setShowForm(true);
  };

  const handleDelete = (t) => setDeleteDialog({ open: true, testimonial: t });

  const confirmDelete = async () => {
    try {
      await api.delete(`/testimonials/${deleteDialog.testimonial.id}/`);
      fetchTestimonials();
      setDeleteDialog({ open: false, testimonial: null });
    } catch {
      alert('Failed to delete testimonial');
    }
  };

  const handleToggleApproval = async (t) => {
    try {
      await api.patch(`/testimonials/${t.id}/`, { is_approved: !t.is_approved });
      fetchTestimonials();
    } catch {
      alert('Failed to update testimonial');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'image' && formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      if (formData.image) submitData.append('image', formData.image);

      if (editingTestimonial) {
        await api.put(`/testimonials/${editingTestimonial.id}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/testimonials/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchTestimonials();
      setShowForm(false);
      setEditingTestimonial(null);
    } catch {
      alert('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const inputCls = ADMIN_INPUT_CLASS;

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Total',
      value: testimonials.length,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Approved',
      value: approvedCount,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Featured',
      value: featuredCount,
      tone: 'bg-white border border-amber-100',
      valueClass: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
    {
      label: 'Pending',
      value: pendingCount,
      tone: 'bg-white border border-orange-100',
      valueClass: 'text-orange-600',
      iconBg: 'bg-orange-100 text-orange-600',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const statusFilters = [
    { id: 'all', label: 'All', count: testimonials.length },
    { id: 'approved', label: 'Approved', count: approvedCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'featured', label: 'Featured', count: featuredCount },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Social proof"
          title="Testimonials"
          description="Manage client testimonials and approval status."
          primaryAction={
            <AdminPrimaryBannerButton onClick={handleCreate}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add testimonial
            </AdminPrimaryBannerButton>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchTestimonials(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <AdminListSection
          title="All testimonials"
          subtitle="Review, approve, and manage client feedback"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name, company, or quote…"
          filters={statusFilters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showingCount={filteredTestimonials.length}
          totalCount={testimonials.length}
          hasActiveFilters={!!searchTerm.trim() || statusFilter !== 'all'}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          onCreate={handleCreate}
          createLabel="New testimonial"
          emptyTitle="No testimonials found"
          emptyDescription={
            searchTerm.trim() || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first testimonial to build trust.'
          }
          emptyActionLabel={searchTerm.trim() || statusFilter !== 'all' ? 'Clear filters' : 'Add first testimonial'}
          onEmptyAction={
            searchTerm.trim() || statusFilter !== 'all'
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }
              : handleCreate
          }
        >
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Author</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Rating</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Preview</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTestimonials.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={t.image ? getMediaUrl(t.image) : '/logo192.png'}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{t.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {[t.position, t.company].filter(Boolean).join(' at ') || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden md:table-cell">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <StarIcon key={i} filled={i <= (t.rating || 0)} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden lg:table-cell max-w-xs">
                      <p className="text-sm text-slate-600 line-clamp-2">&ldquo;{t.testimonial}&rdquo;</p>
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.is_approved ? 'Approved' : 'Pending'}
                        </span>
                        {t.is_featured && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <AdminActionButtons
                        onEdit={() => handleEdit(t)}
                        onDelete={() => handleDelete(t)}
                        extra={
                          <button
                            type="button"
                            onClick={() => handleToggleApproval(t)}
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              t.is_approved
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {t.is_approved ? 'Unapprove' : 'Approve'}
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        </AdminListSection>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-900/50" onClick={() => !saving && setShowForm(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    {editingTestimonial ? 'Edit Testimonial' : 'Create Testimonial'}
                  </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <select value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })} className={inputCls}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial *</label>
                    <textarea required rows={5} value={formData.testimonial} onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-full" />}
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.is_approved} onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })} className="h-4 w-4 text-slate-600 focus:ring-slate-500 rounded" />
                      <span className="text-sm text-gray-700">Approved</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="h-4 w-4 text-slate-600 focus:ring-slate-500 rounded" />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => !saving && setShowForm(false)} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50">
                      {saving ? 'Saving…' : editingTestimonial ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, testimonial: null })}
          onConfirm={confirmDelete}
          title="Delete Testimonial"
          message={`Are you sure you want to delete the testimonial from "${deleteDialog.testimonial?.name}"?`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTestimonials;
