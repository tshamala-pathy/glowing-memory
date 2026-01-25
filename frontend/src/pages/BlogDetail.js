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
      console.log('Blog post data:', response.data);
      console.log('Featured image:', response.data.featured_image);
      if (response.data.featured_image) {
        console.log('Media URL:', getMediaUrl(response.data.featured_image));
      }
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError('Blog post not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white py-12">
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
    <div className="min-h-screen bg-white">
      {/* Hero Section with Featured Image */}
      <div className="relative">
        <div className="relative h-[60vh] min-h-[500px] overflow-hidden bg-gray-300">
          <img
            src={
              post.featured_image 
                ? getMediaUrl(post.featured_image) 
                : "https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=1920&q=80"
            }
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 1 }}
            onError={(e) => {
              const fallback = "https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=1920&q=80";
              if (!e.target.src.includes('photo-1486312338219-ce68e2c6f44d')) {
                e.target.src = fallback;
                e.target.onerror = null;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 flex items-end z-20">
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
                    className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200 hover:shadow-md transition-shadow"
                  >
                    #{tag.name || tag}
                  </span>
                ))
              ) : (
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
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
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
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
        <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center text-white shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=1920&q=80"
            alt="Blog Posts"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10">
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
    </div>
  );
};

export default BlogDetail;
