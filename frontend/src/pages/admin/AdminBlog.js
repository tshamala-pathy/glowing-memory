import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';
import { formatDate } from '../../utils/formatters';

const AdminBlog = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: '',
    tags: '',
    featured_image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await api.get('/blog/');
      const data = response.data.results || response.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [isAuthenticated, user, navigate, fetchPosts]);

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
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
      featured_image: null,
    });
    setImagePreview(post.featured_image ? getMediaUrl(post.featured_image) : null);
    setShowForm(true);
  };

  const handleDelete = (post) => setDeletePost(post);

  const confirmDelete = async () => {
    try {
      await api.delete(`/blog/${deletePost.id}/`);
      fetchPosts();
      setDeletePost(null);
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      ['title', 'body', 'category', 'tags'].forEach((key) => {
        if (formData[key] != null && formData[key] !== '') submitData.append(key, formData[key]);
      });
      if (formData.featured_image) submitData.append('featured_image', formData.featured_image);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingPost) {
        await api.patch(`/blog/${editingPost.id}/`, submitData, config);
      } else {
        await api.post('/blog/', submitData, config);
      }
      fetchPosts();
      setShowForm(false);
      setEditingPost(null);
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.title?.[0] || 'Failed to save post');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, featured_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading blog posts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Blog Posts</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage your blog content</p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2.5 sm:px-5 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-all shadow-lg flex-shrink-0"
            >
              + Add Post
            </button>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, body, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="py-12 sm:py-20 text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No blog posts found</h3>
              <p className="text-gray-500 text-sm mb-6">Create your first post to get started.</p>
              <button onClick={handleCreate} className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium">
                Add Post
              </button>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-gray-100">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-4 flex flex-col sm:flex-row gap-4 bg-white">
                    <div className="flex-shrink-0">
                      {post.featured_image ? (
                        <img src={getMediaUrl(post.featured_image)} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 truncate">{post.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{post.category || '—'}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(post.created_at)}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleEdit(post)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(post)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Post</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50/80">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-3">
                            {post.featured_image ? (
                              <img src={getMediaUrl(post.featured_image)} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-400 text-xs">—</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[200px] lg:max-w-xs">{post.title}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px] lg:max-w-xs">
                                {post.body?.replace(/<[^>]*>/g, '').substring(0, 60)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">{post.category || '—'}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(post.created_at)}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(post)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg" title="Edit">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(post)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4">
            <div className="flex min-h-full sm:min-h-screen items-center justify-center">
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">{editingPost ? 'Edit Blog Post' : 'Create Blog Post'}</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Body *</label>
                      <textarea
                        required
                        rows={8}
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-h-[160px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="e.g. tech, tutorial, news"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Featured Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                      />
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg border border-gray-200" />
                      )}
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold">
                        {editingPost ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deletePost}
          onClose={() => setDeletePost(null)}
          onConfirm={confirmDelete}
          title="Delete Blog Post"
          message={`Are you sure you want to delete "${deletePost?.title}"? This cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
