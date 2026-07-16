import React, { useState, useEffect, useCallback } from 'react';
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
import { formatDate } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1920&q=85';

const AdminBlog = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchPosts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/blog/');
      const data = response.data.results || response.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
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
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const categoryCount = new Set(posts.map((p) => p.category).filter(Boolean)).size;
  const withImageCount = posts.filter((p) => p.featured_image).length;

  const statCards = [
    {
      label: 'Total posts',
      value: posts.length,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Categories',
      value: categoryCount,
      tone: 'bg-white border border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    },
    {
      label: 'With image',
      value: withImageCount,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Showing',
      value: filteredPosts.length,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Content"
          title="Blog Posts"
          description="Write and manage articles published on your public blog."
          primaryAction={
            <AdminPrimaryBannerButton onClick={handleCreate}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add post
            </AdminPrimaryBannerButton>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchPosts(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <AdminListSection
          title="All posts"
          subtitle="Browse and manage blog articles"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search title, body, or category…"
          showingCount={filteredPosts.length}
          totalCount={posts.length}
          hasActiveFilters={!!searchTerm.trim()}
          onClearFilters={() => setSearchTerm('')}
          onCreate={handleCreate}
          createLabel="New post"
          emptyTitle="No blog posts found"
          emptyDescription={
            searchTerm.trim()
              ? 'Try a different search term.'
              : 'Create your first post to get started.'
          }
          emptyActionLabel={searchTerm.trim() ? 'Clear search' : 'Add first post'}
          onEmptyAction={searchTerm.trim() ? () => setSearchTerm('') : handleCreate}
        >
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Post</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Category</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Created</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
                          {post.featured_image ? (
                            <img src={getMediaUrl(post.featured_image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">—</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{post.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                            {post.body?.replace(/<[^>]*>/g, '').substring(0, 80)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{post.category || '—'}</td>
                    <td className="px-5 sm:px-6 py-4 text-sm text-slate-500 hidden lg:table-cell whitespace-nowrap">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <AdminActionButtons onEdit={() => handleEdit(post)} onDelete={() => handleDelete(post)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        </AdminListSection>

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
