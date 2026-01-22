import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/search/', {
        params: { q: searchQuery.trim() }
      });
      setResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'project':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'blog':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4-4h-4m-4 0H9m0 0v4" />
          </svg>
        );
      case 'service':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'project':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'blog':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'service':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryGradient = (category) => {
    switch (category) {
      case 'project':
        return 'from-blue-50 to-blue-100';
      case 'blog':
        return 'from-green-50 to-green-100';
      case 'service':
        return 'from-purple-50 to-purple-100';
      default:
        return 'from-gray-50 to-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Searching...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 text-lg font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
            <p className="text-gray-600 text-lg">Please enter a search query to find projects, blog posts, or services.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalResults = results?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Search Results</h1>
            <p className="text-xl opacity-90">
              Found <span className="font-bold">{totalResults}</span> {totalResults === 1 ? 'result' : 'results'} for <span className="font-semibold">"{query}"</span>
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        {totalResults === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No results found</h2>
            <p className="text-gray-600 mb-8 text-lg">Try searching with different keywords or browse our categories</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/projects"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
              >
                Browse Projects
              </Link>
              <Link
                to="/blog"
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg"
              >
                Browse Blog
              </Link>
              <Link
                to="/services"
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-lg"
              >
                Browse Services
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {results.projects && results.projects.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${getCategoryColor('project')} border-2`}>
                    {getCategoryIcon('project')}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Projects <span className="text-blue-600">({results.projects.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.projects.map((item) => (
                    <Link
                      key={item.id}
                      to={item.url}
                      className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                    >
                      <div className={`h-48 bg-gradient-to-br ${getCategoryGradient('project')} flex items-center justify-center`}>
                        <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center">
                          {getCategoryIcon('project')}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
                          <span>View Project</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.blog_posts && results.blog_posts.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${getCategoryColor('blog')} border-2`}>
                    {getCategoryIcon('blog')}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Blog Posts <span className="text-green-600">({results.blog_posts.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.blog_posts.map((item) => (
                    <Link
                      key={item.id}
                      to={item.url}
                      className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                    >
                      <div className={`h-48 bg-gradient-to-br ${getCategoryGradient('blog')} flex items-center justify-center`}>
                        <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center">
                          {getCategoryIcon('blog')}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-center text-green-600 font-semibold text-sm">
                          <span>Read Article</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.services && results.services.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${getCategoryColor('service')} border-2`}>
                    {getCategoryIcon('service')}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Services <span className="text-purple-600">({results.services.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.services.map((item) => (
                    <Link
                      key={item.id}
                      to={item.url}
                      className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                    >
                      <div className={`h-48 bg-gradient-to-br ${getCategoryGradient('service')} flex items-center justify-center`}>
                        <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center">
                          {getCategoryIcon('service')}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-center text-purple-600 font-semibold text-sm">
                          <span>View Service</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
