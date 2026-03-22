import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';
import { formatDate } from '../../utils/formatters';

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

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/testimonials/');
      const data = response.data.results || response.data;
      setTestimonials(Array.isArray(data) ? data : []);
    } catch {
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(
      (t) =>
        !searchTerm ||
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.testimonial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [testimonials, searchTerm]);

  const stats = useMemo(
    () => [
      { label: 'Total', value: testimonials.length },
      { label: 'Approved', value: testimonials.filter((t) => t.is_approved).length },
      { label: 'Featured', value: testimonials.filter((t) => t.is_featured).length },
      { label: 'Pending', value: testimonials.filter((t) => !t.is_approved).length },
    ],
    [testimonials]
  );

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

  const inputCls = 'block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-600 focus:border-slate-600';

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading testimonials...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Testimonials</h1>
              </div>
              <p className="text-slate-200 text-sm sm:text-base">Manage client testimonials and approvals.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchTestimonials}
                className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Testimonial
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{s.label}</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name, company, or testimonial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
        />

        {/* Table - Desktop */}
        <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Preview</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No testimonials found
                    </td>
                  </tr>
                ) : (
                  filteredTestimonials.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.image ? getMediaUrl(t.image) : '/logo192.png'}
                            alt={t.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{t.name}</div>
                            <div className="text-sm text-gray-500">
                              {[t.position, t.company].filter(Boolean).join(' at ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <StarIcon key={i} filled={i <= (t.rating || 0)} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">&ldquo;{t.testimonial}&rdquo;</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${t.is_approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {t.is_approved ? 'Approved' : 'Pending'}
                          </span>
                          {t.is_featured && (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleApproval(t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${t.is_approved ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            {t.is_approved ? 'Unapprove' : 'Approve'}
                          </button>
                          <button onClick={() => handleEdit(t)} className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg" title="Edit">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(t)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {filteredTestimonials.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              No testimonials found
            </div>
          ) : (
            filteredTestimonials.map((t) => (
              <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <img src={t.image ? getMediaUrl(t.image) : '/logo192.png'} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{[t.position, t.company].filter(Boolean).join(' at ')}</div>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIcon key={i} filled={i <= (t.rating || 0)} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">&ldquo;{t.testimonial}&rdquo;</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${t.is_approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {t.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      <button onClick={() => handleToggleApproval(t)} className="text-xs text-slate-600 hover:text-slate-900">
                        {t.is_approved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => handleEdit(t)} className="text-xs text-slate-600 hover:text-slate-900">Edit</button>
                      <button onClick={() => handleDelete(t)} className="text-xs text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
