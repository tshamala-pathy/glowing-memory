import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import api, { getMediaUrl } from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=85';

const AdminAbout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState(null);
  const [values, setValues] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchAboutData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
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
      if (isRefresh) setRefreshing(false);
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
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Page status',
      value: aboutData ? 'Live' : 'Draft',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Values',
      value: values.length,
      tone: 'bg-white border border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
    {
      label: 'Solutions',
      value: solutions.length,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    },
    {
      label: 'Hero image',
      value: aboutData?.image || imagePreview ? 'Yes' : 'No',
      tone: 'bg-white border border-emerald-100',
      valueClass: aboutData?.image || imagePreview ? 'text-emerald-600' : 'text-slate-400',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Content"
          title="About Us"
          description="Manage About page content, company values, and solutions."
          primaryAction={
            <AdminPrimaryBannerButton onClick={() => setShowForm(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {aboutData ? 'Edit about' : 'Create about'}
            </AdminPrimaryBannerButton>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchAboutData(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        {aboutData && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 sm:px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Current page preview</h2>
              <p className="text-sm text-slate-500 mt-0.5">{aboutData.hero_title || aboutData.title || 'Untitled about page'}</p>
            </div>
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hero</p>
                <p className="font-semibold text-slate-900">{aboutData.hero_title || '—'}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-3">{aboutData.hero_subtitle || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mission</p>
                <p className="font-semibold text-slate-900">{aboutData.mission_title || '—'}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{aboutData.mission_content || '—'}</p>
              </div>
            </div>
          </section>
        )}

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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-900 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Company Values</h2>
              <p className="text-sm text-slate-300">Core principles shown on the About page</p>
            </div>
            <button
              onClick={() => {
                setEditingValue(null);
                setValueFormData({ title: '', description: '', icon: '', order: 0 });
                setShowValueForm(true);
              }}
              disabled={!aboutData?.id}
              className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add value
            </button>
          </div>
          <div className="p-5 sm:p-6">
            {values.length === 0 ? (
              <p className="text-slate-500 py-8 text-center text-sm">No values yet. Create About content first, then add values.</p>
            ) : (
              <div className="space-y-3">
                {values.map((v) => (
                  <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{v.order}</span>
                        <h3 className="font-semibold text-slate-900">{v.title}</h3>
                        {v.icon && <span className="text-slate-400 text-sm">{v.icon}</span>}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{v.description}</p>
                    </div>
                    <AdminActionButtons onEdit={() => handleEditValue(v)} onDelete={() => handleDeleteValue(v)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Solutions Section */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-900 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Problems We Solve</h2>
              <p className="text-sm text-slate-300">Solutions highlighted on the About page</p>
            </div>
            <button
              onClick={() => {
                setEditingSolution(null);
                setSolutionFormData({ title: '', description: '', icon: '', order: 0 });
                setShowSolutionForm(true);
              }}
              disabled={!aboutData?.id}
              className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add solution
            </button>
          </div>
          <div className="p-5 sm:p-6">
            {solutions.length === 0 ? (
              <p className="text-slate-500 py-8 text-center text-sm">No solutions yet. Add items to show on the About page.</p>
            ) : (
              <div className="space-y-3">
                {solutions.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{s.order}</span>
                        <h3 className="font-semibold text-slate-900">{s.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{s.description}</p>
                    </div>
                    <AdminActionButtons onEdit={() => handleEditSolution(s)} onDelete={() => handleDeleteSolution(s)} />
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
