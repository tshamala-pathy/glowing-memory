import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/');
      setServices(response.data.results || response.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching services:', error);
      if (error.isNetworkError) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message ||
                            error.message || 
                            'Failed to fetch services';
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
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
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
          <div className="text-center fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Our Services
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional services tailored to your business needs
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {services.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-600 mb-6">Check back soon for our service offerings!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="card-professional group fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {service.price && (
                      <div className="text-right">
                        <span className="text-3xl font-bold text-gray-900">${service.price}</span>
                        <span className="text-sm text-gray-500 block">per month</span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                    {service.name}
                  </h2>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                  
                  {service.features && service.features.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {service.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                      {service.features.length > 4 && (
                        <li className="text-sm text-gray-500 pl-8">
                          +{service.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  )}
                  
                  {service.categories && service.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {service.categories.map((category) => (
                        <span
                          key={category.id}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {services.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-center text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              We can create a tailored service package just for your business needs
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Contact Us
            </a>
          </div>
        )}
      </section>
    </div>
  );
};

export default Services;
