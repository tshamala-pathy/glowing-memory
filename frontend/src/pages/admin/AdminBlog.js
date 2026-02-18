import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const AdminBlog = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, post: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: '',
    tags: '',
    featured_image: null,
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
    fetchPosts();
  }, [isAuthenticated, user, navigate]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/blog/');
      const data = response.data.results || response.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({ title: '', body: '', category: '', tags: '', featured_image: null });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      body: post.body || '',
      category: post.category || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      featured_image: null,
    });
    setImagePreview(post.featured_image ? getMediaUrl(post.featured_image) : null);
    setShowForm(true);
  };

  const handleDelete = (post) => {
    setDeleteDialog({ open: true, post });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/blog/${deleteDialog.post.id}/`);
      fetchPosts();
      setDeleteDialog({ open: false, post: null });
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'featured_image' && formData[key] !== null && formData[key] !== '') {
          if (key === 'tags' && typeof formData[key] === 'string') {
            // Convert comma-separated tags to array for API
            submitData.append(key, formData[key]);
          } else {
            submitData.append(key, formData[key]);
          }
        }
      });
      if (formData.featured_image) {
        submitData.append('featured_image', formData.featured_image);
      }

      if (editingPost) {
        await api.put(`/blog/${editingPost.id}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/blog/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchPosts();
      setShowForm(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, featured_image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.body?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Image',
      accessor: 'featured_image',
      render: (value) => (
        value ? (
          <img
            src={getMediaUrl(value)}
            alt="Featured"
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )
      ),
    },
    { header: 'Title', accessor: 'title' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Body',
      accessor: 'body',
      render: (value) => <div className="max-w-md truncate">{value}</div>,
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
            <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-gray-600 mt-1">Manage your blog content</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Post
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredPosts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No blog posts found"
        />

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingPost ? 'Edit Blog Post' : 'Create Blog Post'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Body</label>
                      <textarea
                        required
                        rows={10}
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Featured Image</label>
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
                      {editingPost ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, post: null })}
          onConfirm={confirmDelete}
          title="Delete Blog Post"
          message={`Are you sure you want to delete "${deleteDialog.post?.title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;

