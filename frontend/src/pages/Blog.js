import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import { formatDate } from '../utils/formatters';

const getExcerpt = (body, maxLen = 150) => {
  if (!body || typeof body !== 'string') return '';
  const text = body.replace(/<[^>]*>/g, '').trim();
  return text.length > maxLen ? text.substring(0, maxLen).trim() + '...' : text;
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page };
      if (selectedCategory) params.category = selectedCategory;
      const response = await api.get('/blog/', { params });
      const postsData = response.data.results || response.data || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
      setHasNext(!!response.data.next);
      setHasPrev(!!response.data.previous);
      if (page === 1 && !selectedCategory) {
        const unique = [...new Set((response.data.results || response.data || []).map((p) => p.category).filter(Boolean))];
        setCategories(unique);
      }
      setError('');
    } catch (err) {
      if (err?.isNetworkError) {
        setError('Cannot connect to server. Please try again later.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to fetch blog posts.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-6 py-2.5 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="inline-flex p-4 bg-white/20 rounded-2xl mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Blog & Insights</h1>
          <p className="text-slate-100 text-lg sm:text-xl max-w-2xl">Stay updated with our latest insights, tutorials, and industry news.</p>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === '' ? 'bg-slate-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat ? 'bg-slate-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {posts.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-slate-100 transition-all duration-300 flex flex-col"
              >
                {post.featured_image ? (
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
                    <img
                      src={getMediaUrl(post.featured_image)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 sm:h-52 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  <div className="flex items-center text-xs text-gray-500 mb-3 gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(post.created_at)}
                    </span>
                    {post.category && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-700 rounded-md font-medium">{post.category}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-slate-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base line-clamp-3 leading-relaxed mb-4 flex-1">
                    {getExcerpt(post.body)}
                  </p>
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg"
                        >
                          {typeof tag === 'object' ? tag.name || tag : tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  <span className="inline-flex items-center gap-2 text-slate-600 font-semibold text-sm group-hover:gap-3 transition-all">
                    Read More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {(hasNext || hasPrev) && posts.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev}
              className="px-5 py-2.5 rounded-xl font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="px-5 py-2.5 rounded-xl font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Blog;
