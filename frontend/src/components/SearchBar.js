import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

  // Flatten all results for keyboard navigation
  const allResults = results ? [
    ...(results.projects || []).map(item => ({ ...item, category: 'project' })),
    ...(results.blog_posts || []).map(item => ({ ...item, category: 'blog' })),
    ...(results.services || []).map(item => ({ ...item, category: 'service' }))
  ] : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setError(null);
      setIsOpen(false);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set loading state immediately for better UX
    setLoading(true);
    setError(null);

    // Debounce the API call
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await api.get('/search/', {
          params: { q: searchQuery.trim() }
        });
        console.log('Search response:', response.data); // Debug log
        setResults(response.data);
        setIsOpen(true);
        setSelectedIndex(-1);
        setError(null);
      } catch (err) {
        console.error('Search error:', err);
        if (err.response) {
          console.error('Error response:', err.response.data);
        }
        setError(err.response?.data?.detail || 'Failed to search. Please try again.');
        setResults(null);
        setIsOpen(true); // Still show error state
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    if (value.trim()) {
      handleSearch(value);
    } else {
      setResults(null);
      setIsOpen(false);
      setError(null);
    }
  };

  const handleResultClick = (url) => {
    navigate(url);
    setIsOpen(false);
    setQuery('');
    setResults(null);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      if (isOpen && allResults.length > 0) {
        // If dropdown is open with results, navigate to first result
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex].url);
        } else if (allResults.length > 0) {
          handleResultClick(allResults[0].url);
        }
      } else {
        // Otherwise navigate to search results page
        e.preventDefault();
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
      return;
    }

    if (!isOpen || allResults.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        // Handled above
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'project':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'blog':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4-4h-4m-4 0H9m0 0v4" />
          </svg>
        );
      case 'service':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        return 'bg-blue-100 text-blue-700';
      case 'blog':
        return 'bg-green-100 text-green-700';
      case 'service':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search projects, blog posts, services..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query && results) {
              setIsOpen(true);
            }
          }}
          className="w-full md:w-72 lg:w-96 px-4 py-2.5 pl-11 pr-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-shadow duration-200 placeholder:text-gray-400"
        />
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              setIsOpen(false);
              setError(null);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:text-gray-700 text-gray-400 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (results !== null || error) && (
        <div className="absolute top-full mt-2 w-full md:w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden">
          {error ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : !results || results.total === 0 ? (
            <div className="p-6 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-700 mb-1">No results found</p>
              <p className="text-xs text-gray-500">Try searching for something else</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[32rem]">
              {/* Results Summary */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600">
                  {results.total} {results.total === 1 ? 'result' : 'results'} found
                </p>
              </div>

              <div className="p-2">
                {results && results.projects && results.projects.length > 0 && (
                  <div className="mb-3">
                    <div className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Projects ({results.projects.length})
                    </div>
                    {results.projects.map((item, index) => {
                      const flatIndex = results.projects.slice(0, index).length;
                      const isSelected = selectedIndex === flatIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick(item.url)}
                          className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-md ${getCategoryColor('project')} flex-shrink-0`}>
                              {getCategoryIcon('project')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {results && results.blog_posts && results.blog_posts.length > 0 && (
                  <div className="mb-3">
                    <div className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4-4h-4m-4 0H9m0 0v4" />
                      </svg>
                      Blog Posts ({results.blog_posts.length})
                    </div>
                    {results.blog_posts.map((item, index) => {
                      const flatIndex = (results.projects?.length || 0) + index;
                      const isSelected = selectedIndex === flatIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick(item.url)}
                          className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-md ${getCategoryColor('blog')} flex-shrink-0`}>
                              {getCategoryIcon('blog')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {results && results.services && results.services.length > 0 && (
                  <div className="mb-3">
                    <div className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Services ({results.services.length})
                    </div>
                    {results.services.map((item, index) => {
                      const flatIndex = (results.projects?.length || 0) + (results.blog_posts?.length || 0) + index;
                      const isSelected = selectedIndex === flatIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick(item.url)}
                          className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-purple-50 border border-purple-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-md ${getCategoryColor('service')} flex-shrink-0`}>
                              {getCategoryIcon('service')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
