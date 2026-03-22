import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import { formatDate } from '../utils/formatters';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=1920&q=80';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/blog/${id}/`);
        setPost(response.data);
      } catch (err) {
        setError('Blog post not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The blog post you are looking for does not exist.'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = post.featured_image ? getMediaUrl(post.featured_image) : FALLBACK_IMAGE;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <div className="relative h-[50vh] min-h-[320px] sm:min-h-[400px] md:min-h-[500px] overflow-hidden bg-gray-200">
          <img
            src={heroImage}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              if (!e.target.src.includes('photo-1486312338219')) e.target.src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto w-full">
              {post.category && (
                <span className="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium mb-3">
                  {post.category}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-2 sm:mb-4">
                {post.title}
              </h1>
              <div className="flex items-center text-white/90 text-sm gap-3 sm:gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(post.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-xl font-medium hover:bg-white transition-all shadow-lg text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-12">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-gray-200">
              {(Array.isArray(post.tags) ? post.tags : [post.tags]).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium border border-slate-100"
                >
                  #{typeof tag === 'object' ? tag.name || tag : tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed
              prose-headings:text-gray-900 prose-a:text-slate-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.body || '' }}
          />
        </div>
      </article>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 text-center">
          <img
            src={FALLBACK_IMAGE}
            alt="Blog"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-600/90 to-slate-600/90" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Read More Articles</h3>
            <p className="text-white/90 text-base sm:text-lg mb-6 max-w-xl mx-auto">
              Explore our other insightful blog posts and tutorials
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-lg"
            >
              View All Posts
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
