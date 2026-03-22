import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const AdminAbout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState(null);
  const [values, setValues] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showValueForm, setShowValueForm] = useState(false);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [editingSolution, setEditingSolution] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, item: null });
  const [formData, setFormData] = useState({
    title: '',
    hero_title: '',
    hero_subtitle: '',
    our_story_title: '',
    our_story_content: '',
    mission_title: '',
    mission_content: '',
    vision_title: '',
    vision_content: '',
    why_choose_us_title: '',
    why_choose_us_content: '',
    image: null,
  });
  const [valueFormData, setValueFormData] = useState({ title: '', description: '', icon: '', order: 0 });
  const [solutionFormData, setSolutionFormData] = useState({ title: '', description: '', icon: '', order: 0 });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchAboutData();
  }, [isAuthenticated, user, navigate]);

  const fetchAboutData = async () => {
    try {
      let data = null;
      try {
        const res = await api.get('/about/admin/');
        const raw = res.data.results || res.data;
        data = Array.isArray(raw) && raw.length > 0 ? raw[0] : (Array.isArray(raw) ? null : raw);
      } catch {
        const res = await api.get('/about/');
        data = res.data;
      }
      if (data) {
        setAboutData(data);
        setValues(data.values || []);
        setSolutions(data.solutions || []);
        setFormData({
          title: data.title || '',
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          our_story_title: data.our_story_title || '',
          our_story_content: data.our_story_content || '',
          mission_title: data.mission_title || '',
          mission_content: data.mission_content || '',
          vision_title: data.vision_title || '',
          vision_content: data.vision_content || '',
          why_choose_us_title: data.why_choose_us_title || '',
          why_choose_us_content: data.why_choose_us_content || '',
          image: null,
        });
        setImagePreview(data.image ? getMediaUrl(data.image) : null);
      }
    } catch {
      setAboutData(null);
    } finally {
      setLoading(false);
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

      if (aboutData?.id) {
        await api.put(`/about/admin/${aboutData.id}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/about/admin/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchAboutData();
      setShowForm(false);
    } catch {
      alert('Failed to save about data');
    } finally {
      setSaving(false);
    }
  };

  const handleValueSubmit = async (e) => {
    e.preventDefault();
    if (!aboutData?.id) return;
    setSaving(true);
    try {
      const payload = { ...valueFormData, about_us: aboutData.id };
      if (editingValue) {
        await api.put(`/about/values/${editingValue.id}/`, payload);
      } else {
        await api.post(`/about/values/`, payload);
      }
      fetchAboutData();
      setShowValueForm(false);
      setEditingValue(null);
      setValueFormData({ title: '', description: '', icon: '', order: 0 });
    } catch {
      alert('Failed to save value');
    } finally {
      setSaving(false);
    }
  };

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!aboutData?.id) return;
    setSaving(true);
    try {
      const payload = { ...solutionFormData, about_us: aboutData.id };
      if (editingSolution) {
        await api.put(`/about/solutions/${editingSolution.id}/`, payload);
      } else {
        await api.post(`/about/solutions/`, payload);
      }
      fetchAboutData();
      setShowSolutionForm(false);
      setEditingSolution(null);
      setSolutionFormData({ title: '', description: '', icon: '', order: 0 });
    } catch {
      alert('Failed to save solution');
    } finally {
      setSaving(false);
    }
  };

  const handleEditValue = (v) => {
    setEditingValue(v);
    setValueFormData({
      title: v.title || '',
      description: v.description || '',
      icon: v.icon || '',
      order: v.order ?? 0,
    });
    setShowValueForm(true);
  };

  const handleEditSolution = (s) => {
    setEditingSolution(s);
    setSolutionFormData({
      title: s.title || '',
      description: s.description || '',
      icon: s.icon || '',
      order: s.order ?? 0,
    });
    setShowSolutionForm(true);
  };

  const handleDeleteValue = (v) => setDeleteDialog({ open: true, type: 'value', item: v });
  const handleDeleteSolution = (s) => setDeleteDialog({ open: true, type: 'solution', item: s });

  const confirmDelete = async () => {
    const { type, item } = deleteDialog;
    if (!item) return;
    try {
      if (type === 'value') {
        await api.delete(`/about/values/${item.id}/`);
      } else if (type === 'solution') {
        await api.delete(`/about/solutions/${item.id}/`);
      }
      fetchAboutData();
      setDeleteDialog({ open: false, type: null, item: null });
    } catch {
      alert('Failed to delete');
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading...</p>
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
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">About Us</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-base">Manage About page content, values, and solutions.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {aboutData ? 'Edit About' : 'Create About'}
            </button>
          </div>
        </div>

        {/* Main Content Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
              <div className="fixed inset-0 bg-gray-900/50" onClick={() => !saving && setShowForm(false)} />
              <div className="relative inline-block bg-white rounded-2xl shadow-2xl sm:my-8 sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-slate-600 to-slate-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">Edit About Us</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Hero Section</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Hero Title</label>
                        <input
                          type="text"
                          value={formData.hero_title}
                          onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Hero Subtitle</label>
                        <textarea
                          rows={3}
                          value={formData.hero_subtitle}
                          onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Hero Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-50 file:text-slate-700"
                        />
                        {imagePreview && (
                          <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-lg" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Our Story</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Story Title</label>
                        <input
                          type="text"
                          value={formData.our_story_title}
                          onChange={(e) => setFormData({ ...formData, our_story_title: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Story Content</label>
                        <textarea
                          rows={4}
                          value={formData.our_story_content}
                          onChange={(e) => setFormData({ ...formData, our_story_content: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Mission & Vision</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mission Title</label>
                        <input
                          type="text"
                          value={formData.mission_title}
                          onChange={(e) => setFormData({ ...formData, mission_title: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Vision Title</label>
                        <input
                          type="text"
                          value={formData.vision_title}
                          onChange={(e) => setFormData({ ...formData, vision_title: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mission Content</label>
                        <textarea
                          rows={3}
                          value={formData.mission_content}
                          onChange={(e) => setFormData({ ...formData, mission_content: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Vision Content</label>
                        <textarea
                          rows={3}
                          value={formData.vision_content}
                          onChange={(e) => setFormData({ ...formData, vision_content: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Why Choose Us</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                        <input
                          type="text"
                          value={formData.why_choose_us_title}
                          onChange={(e) => setFormData({ ...formData, why_choose_us_title: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Content</label>
                        <textarea
                          rows={4}
                          value={formData.why_choose_us_content}
                          onChange={(e) => setFormData({ ...formData, why_choose_us_content: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => !saving && setShowForm(false)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Values Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Company Values</h2>
            <button
              onClick={() => {
                setEditingValue(null);
                setValueFormData({ title: '', description: '', icon: '', order: 0 });
                setShowValueForm(true);
              }}
              disabled={!aboutData?.id}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Value
            </button>
          </div>
          <div className="p-6">
            {values.length === 0 ? (
              <p className="text-gray-500 py-4">No values yet. Create About content first, then add values.</p>
            ) : (
              <div className="space-y-3">
                {values.map((v) => (
                  <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">#{v.order}</span>
                        <h3 className="font-medium text-gray-900">{v.title}</h3>
                        {v.icon && <span className="text-gray-400 text-sm">{v.icon}</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{v.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditValue(v)} className="px-3 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteValue(v)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Solutions Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Problems We Solve</h2>
            <button
              onClick={() => {
                setEditingSolution(null);
                setSolutionFormData({ title: '', description: '', icon: '', order: 0 });
                setShowSolutionForm(true);
              }}
              disabled={!aboutData?.id}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Solution
            </button>
          </div>
          <div className="p-6">
            {solutions.length === 0 ? (
              <p className="text-gray-500 py-4">No solutions yet. Add items to show on the About page.</p>
            ) : (
              <div className="space-y-3">
                {solutions.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">#{s.order}</span>
                        <h3 className="font-medium text-gray-900">{s.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditSolution(s)} className="px-3 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteSolution(s)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Value Modal */}
        {showValueForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-900/50" onClick={() => !saving && setShowValueForm(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-slate-600 to-slate-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">{editingValue ? 'Edit Value' : 'Add Value'}</h3>
                </div>
                <form onSubmit={handleValueSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={valueFormData.title}
                      onChange={(e) => setValueFormData({ ...valueFormData, title: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={valueFormData.description}
                      onChange={(e) => setValueFormData({ ...valueFormData, description: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon (e.g. fas fa-heart)</label>
                      <input
                        type="text"
                        value={valueFormData.icon}
                        onChange={(e) => setValueFormData({ ...valueFormData, icon: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                      <input
                        type="number"
                        value={valueFormData.order}
                        onChange={(e) => setValueFormData({ ...valueFormData, order: parseInt(e.target.value) || 0 })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => !saving && setShowValueForm(false)} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700">
                      {editingValue ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Solution Modal */}
        {showSolutionForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-900/50" onClick={() => !saving && setShowSolutionForm(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-slate-600 to-slate-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">{editingSolution ? 'Edit Solution' : 'Add Solution'}</h3>
                </div>
                <form onSubmit={handleSolutionSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (Problem)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Outdated Systems"
                      value={solutionFormData.title}
                      onChange={(e) => setSolutionFormData({ ...solutionFormData, title: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (How we solve it)</label>
                    <textarea
                      required
                      rows={3}
                      value={solutionFormData.description}
                      onChange={(e) => setSolutionFormData({ ...solutionFormData, description: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon (optional)</label>
                      <input
                        type="text"
                        placeholder="fas fa-lightbulb"
                        value={solutionFormData.icon}
                        onChange={(e) => setSolutionFormData({ ...solutionFormData, icon: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                      <input
                        type="number"
                        value={solutionFormData.order}
                        onChange={(e) => setSolutionFormData({ ...solutionFormData, order: parseInt(e.target.value) || 0 })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => !saving && setShowSolutionForm(false)} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700">
                      {editingSolution ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, type: null, item: null })}
          onConfirm={confirmDelete}
          title={`Delete ${deleteDialog.type === 'value' ? 'Value' : 'Solution'}`}
          message={`Are you sure you want to delete "${deleteDialog.item?.title}"?`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminAbout;
