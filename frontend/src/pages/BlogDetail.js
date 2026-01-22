import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/blog/${id}/`);
      setPost(response.data);
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError('Blog post not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-8 text-lg">{error || 'The blog post you are looking for does not exist.'}</p>
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-white">
      {/* Hero Section with Featured Image */}
      <div className="relative">
        {post.featured_image ? (
          <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
            <img
              src={getMediaUrl(post.featured_image)}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
                {post.category && (
                  <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-4">
                    {post.category}
                  </span>
                )}
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl">
                  {post.title}
                </h1>
                <div className="flex items-center text-white/90 text-sm gap-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {post.author && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {post.author.first_name} {post.author.last_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[50vh] min-h-[400px] bg-gradient-to-br from-green-600 via-blue-600 to-green-800 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=1920&q=80')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-4xl px-4">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4-4h-4m-4 0H9m0 0v4" />
                  </svg>
                </div>
                {post.category && (
                  <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
                    {post.category}
                  </span>
                )}
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-2xl">
                  {post.title}
                </h1>
                <div className="flex items-center justify-center text-white/90 text-sm gap-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {post.author && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {post.author.first_name} {post.author.last_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl font-medium hover:bg-white transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Content Section */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-gray-200">
              {Array.isArray(post.tags) ? (
                post.tags.map((tag, idx) => (
                  <span
                    key={tag.id || idx}
                    className="px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 text-green-700 rounded-full text-sm font-medium border border-green-200 hover:shadow-md transition-shadow"
                  >
                    #{tag.name || tag}
                  </span>
                ))
              ) : (
                <span className="px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                  #{post.tags}
                </span>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: post.body || post.content || '' }}
            />
          </div>

          {/* Author Card */}
          {post.author && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {post.author.first_name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {post.author.first_name} {post.author.last_name}
                  </h4>
                  <p className="text-gray-600 text-sm">Author</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Related Posts CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
          <h3 className="text-3xl font-bold mb-4">Read More Articles</h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Explore our other insightful blog posts and tutorials
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center px-8 py-4 bg-white text-green-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            View All Posts
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
