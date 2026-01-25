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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showValueForm, setShowValueForm] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, value: null });
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
  const [valueFormData, setValueFormData] = useState({
    title: '',
    description: '',
    icon: '',
    order: 0,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/dashboard');
      return;
    }
    fetchAboutData();
  }, [isAuthenticated, user, navigate]);

  const fetchAboutData = async () => {
    try {
      // Try admin endpoint first, fallback to public endpoint
      let response;
      let data = null;
      try {
        response = await api.get('/about/admin/');
        const responseData = response.data.results || response.data;
        const aboutData = Array.isArray(responseData) && responseData.length > 0 ? responseData[0] : (Array.isArray(responseData) ? null : responseData);
        if (aboutData && aboutData.id) {
          data = aboutData;
          setAboutData(aboutData);
          setValues(aboutData.values || []);
        } else {
          // Fallback to public endpoint
          response = await api.get('/about/');
          data = response.data;
          setAboutData(data);
          setValues(data.values || []);
        }
      } catch (err) {
        // Fallback to public endpoint if admin endpoint fails
        response = await api.get('/about/');
        data = response.data;
        setAboutData(data);
        setValues(data.values || []);
      }
      if (data) {
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
    } catch (error) {
      console.error('Error fetching about data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'image' && formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (aboutData && aboutData.id) {
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
    } catch (error) {
      console.error('Error saving about data:', error);
      alert('Failed to save about data');
    }
  };

  const handleValueSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...valueFormData, about_us: aboutData.id };
      if (editingValue) {
        await api.put(`/about/values/${editingValue.id}/`, submitData);
      } else {
        await api.post('/about/values/', submitData);
      }
      fetchAboutData();
      setShowValueForm(false);
      setEditingValue(null);
      setValueFormData({ title: '', description: '', icon: '', order: 0 });
    } catch (error) {
      console.error('Error saving value:', error);
      alert('Failed to save value');
    }
  };

  const handleEditValue = (value) => {
    setEditingValue(value);
    setValueFormData({
      title: value.title || '',
      description: value.description || '',
      icon: value.icon || '',
      order: value.order || 0,
    });
    setShowValueForm(true);
  };

  const handleDeleteValue = (value) => {
    setDeleteDialog({ open: true, value });
  };

  const confirmDeleteValue = async () => {
    try {
      await api.delete(`/about/values/${deleteDialog.value.id}/`);
      fetchAboutData();
      setDeleteDialog({ open: false, value: null });
    } catch (error) {
      console.error('Error deleting value:', error);
      alert('Failed to delete value');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">About Us</h1>
            <p className="text-gray-600 mt-1">Manage About Us page content</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {aboutData ? 'Edit About Us' : 'Create About Us'}
          </button>
        </div>

        {/* About Us Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit About Us</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Hero Section</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hero Title</label>
                          <input
                            type="text"
                            value={formData.hero_title}
                            onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hero Subtitle</label>
                          <textarea
                            rows={3}
                            value={formData.hero_subtitle}
                            onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hero Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Our Story</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Story Title</label>
                          <input
                            type="text"
                            value={formData.our_story_title}
                            onChange={(e) => setFormData({ ...formData, our_story_title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Story Content</label>
                          <textarea
                            rows={4}
                            value={formData.our_story_content}
                            onChange={(e) => setFormData({ ...formData, our_story_content: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Mission & Vision</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Mission Title</label>
                          <input
                            type="text"
                            value={formData.mission_title}
                            onChange={(e) => setFormData({ ...formData, mission_title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vision Title</label>
                          <input
                            type="text"
                            value={formData.vision_title}
                            onChange={(e) => setFormData({ ...formData, vision_title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Mission Content</label>
                        <textarea
                          rows={3}
                          value={formData.mission_content}
                          onChange={(e) => setFormData({ ...formData, mission_content: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Vision Content</label>
                        <textarea
                          rows={3}
                          value={formData.vision_content}
                          onChange={(e) => setFormData({ ...formData, vision_content: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Why Choose Us</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            value={formData.why_choose_us_title}
                            onChange={(e) => setFormData({ ...formData, why_choose_us_title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Content</label>
                          <textarea
                            rows={4}
                            value={formData.why_choose_us_content}
                            onChange={(e) => setFormData({ ...formData, why_choose_us_content: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Values Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Company Values</h2>
            <button
              onClick={() => {
                setEditingValue(null);
                setValueFormData({ title: '', description: '', icon: '', order: 0 });
                setShowValueForm(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Value
            </button>
          </div>

          <div className="space-y-3">
            {values.length === 0 ? (
              <p className="text-gray-500">No values added yet.</p>
            ) : (
              values.map((value) => (
                <div key={value.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{value.order}</span>
                      <h3 className="font-medium text-gray-900">{value.title}</h3>
                      {value.icon && <span className="text-gray-500">{value.icon}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{value.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditValue(value)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteValue(value)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Value Form Modal */}
        {showValueForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowValueForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleValueSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingValue ? 'Edit Value' : 'Add Value'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={valueFormData.title}
                        onChange={(e) => setValueFormData({ ...valueFormData, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        required
                        rows={3}
                        value={valueFormData.description}
                        onChange={(e) => setValueFormData({ ...valueFormData, description: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Icon (FontAwesome class)</label>
                        <input
                          type="text"
                          placeholder="e.g., fas fa-heart"
                          value={valueFormData.icon}
                          onChange={(e) => setValueFormData({ ...valueFormData, icon: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Order</label>
                        <input
                          type="number"
                          value={valueFormData.order}
                          onChange={(e) => setValueFormData({ ...valueFormData, order: parseInt(e.target.value) || 0 })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowValueForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                    >
                      {editingValue ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, value: null })}
          onConfirm={confirmDeleteValue}
          title="Delete Value"
          message={`Are you sure you want to delete "${deleteDialog.value?.title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminAbout;
