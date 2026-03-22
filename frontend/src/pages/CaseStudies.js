import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

const CaseStudies = () => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients/case-studies/');
      const caseStudiesData = response.data.results || response.data || [];
      // Filter to only show public case studies
      const publicCaseStudies = caseStudiesData.filter(cs => cs.is_public === true);
      setCaseStudies(publicCaseStudies);
      setError('');
    } catch (error) {
      if (error.isNetworkError) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message ||
                            error.message || 
                            'Failed to fetch case studies';
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading case studies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Case Studies
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real-world solutions and measurable results
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {caseStudies.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 text-lg">No case studies available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {caseStudies.map((caseStudy) => (
              <div
                key={caseStudy.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-8 md:p-12">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {caseStudy.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {caseStudy.client_logo && (
                          <img
                            src={getMediaUrl(caseStudy.client_logo)}
                            alt={caseStudy.client_name}
                            className="h-8 object-contain"
                          />
                        )}
                        <span className="font-medium">{caseStudy.client_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Problem */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-8 bg-red-600 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">The Problem</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed pl-4">
                      {caseStudy.problem}
                    </p>
                  </div>

                  {/* Solution */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">The Solution</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed pl-4">
                      {caseStudy.solution}
                    </p>
                  </div>

                  {/* Result */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-8 bg-green-600 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">The Result</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed pl-4 mb-4">
                      {caseStudy.result}
                    </p>
                    
                    {/* Metrics */}
                    {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pl-4">
                        {Object.entries(caseStudy.metrics).map(([key, value]) => (
                          <div key={key} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-900 mb-1">{value}</div>
                            <div className="text-sm text-blue-700 capitalize">{key.replace(/_/g, ' ')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Testimonial */}
                  {caseStudy.testimonial && (
                    <div className="mb-6 pl-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg p-6">
                      <svg className="w-8 h-8 text-purple-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.984z"/>
                      </svg>
                      <p className="text-gray-800 italic leading-relaxed">
                        "{caseStudy.testimonial}"
                      </p>
                    </div>
                  )}

                  {/* Related Projects & Blog Link */}
                  <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
                    {caseStudy.related_projects && caseStudy.related_projects.length > 0 && (
                      <div className="flex-1 min-w-[200px]">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Related Projects:</h4>
                        <div className="flex flex-wrap gap-2">
                          {caseStudy.related_projects.slice(0, 3).map((project) => (
                            <span
                              key={project.id}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {project.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Blog Link - Check if there's a related blog post */}
                    <Link
                      to="/blog"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CaseStudies;
