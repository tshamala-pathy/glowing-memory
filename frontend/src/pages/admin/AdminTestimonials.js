import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const AdminTestimonials = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, testimonial: null });
  const [searchTerm, setSearchTerm] = useState('');
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
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name || '',
      position: testimonial.position || '',
      company: testimonial.company || '',
      testimonial: testimonial.testimonial || '',
      rating: testimonial.rating || 5,
      is_featured: testimonial.is_featured || false,
      is_approved: testimonial.is_approved || false,
      image: null,
    });
    setImagePreview(testimonial.image ? getMediaUrl(testimonial.image) : null);
    setShowForm(true);
  };

  const handleDelete = (testimonial) => {
    setDeleteDialog({ open: true, testimonial });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/testimonials/${deleteDialog.testimonial.id}/`);
      fetchTestimonials();
      setDeleteDialog({ open: false, testimonial: null });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    }
  };

  const handleToggleApproval = async (testimonial) => {
    try {
      await api.patch(`/testimonials/${testimonial.id}/`, {
        is_approved: !testimonial.is_approved,
      });
      fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      alert('Failed to update testimonial');
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
    } catch (error) {
      console.error('Error saving testimonial:', error);
      alert('Failed to save testimonial');
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

  const filteredTestimonials = testimonials.filter((testimonial) =>
    testimonial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.testimonial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Image',
      accessor: 'image',
      render: (value) => (
        <img
          src={value ? `http://localhost:8000${value}` : '/logo192.png'}
          alt="Testimonial"
          className="w-12 h-12 object-cover rounded-full"
        />
      ),
    },
    { header: 'Name', accessor: 'name' },
    { header: 'Position', accessor: 'position' },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (value) => (
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${i < value ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_approved',
      render: (value, row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? 'Approved' : 'Pending'}
        </span>
      ),
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
            <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
            <p className="text-gray-600 mt-1">Manage client testimonials and approvals</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Testimonial
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTestimonials.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                    No testimonials found
                  </td>
                </tr>
              ) : (
                filteredTestimonials.map((testimonial) => (
                  <tr key={testimonial.id} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render
                          ? column.render(testimonial[column.accessor], testimonial)
                          : testimonial[column.accessor]}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <button
                          onClick={() => handleToggleApproval(testimonial)}
                          className={`px-3 py-1 rounded text-xs ${
                            testimonial.is_approved
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {testimonial.is_approved ? 'Unapprove' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleEdit(testimonial)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(testimonial)}
                          className="text-red-600 hover:text-red-900"
                        >
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

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingTestimonial ? 'Edit Testimonial' : 'Create Testimonial'}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rating</label>
                        <select
                          value={formData.rating}
                          onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Position</label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Testimonial</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.testimonial}
                        onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-full" />
                      )}
                    </div>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_approved}
                          onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Approved</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured</span>
                      </label>
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
                      {editingTestimonial ? 'Update' : 'Create'}
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
          message={`Are you sure you want to delete the testimonial from "${deleteDialog.testimonial?.name}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTestimonials;

