import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/search/', {
        params: { q: searchQuery }
      });
      setResults(response.data);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      handleSearch(value);
    } else {
      setResults(null);
      setIsOpen(false);
    }
  };

  const handleResultClick = (url) => {
    navigate(url);
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search projects, blog, services..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          className="w-full md:w-64 lg:w-80 px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-full mt-2 w-full md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {results.total === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {results.projects.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Projects</div>
                  {results.projects.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick(item.url)}
                      className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {results.blog_posts.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Blog Posts</div>
                  {results.blog_posts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick(item.url)}
                      className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {results.services.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Services</div>
                  {results.services.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick(item.url)}
                      className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

