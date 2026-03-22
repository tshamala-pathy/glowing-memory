import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

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
      const data = response.data?.results ?? response.data ?? [];
      const list = Array.isArray(data) ? data : [];
      setServices(list);
      setError('');
    } catch (err) {
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      } else {
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message ||
                            err.message || 
                            'Failed to fetch services';
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get service image/illustration based on name/description
  const getServiceImage = (service) => {
    const name = (service.name || '').toLowerCase();
    const desc = (service.description || '').toLowerCase();
    
    // Web Development / Frontend - Browser/Website illustration
    if (name.includes('web') || name.includes('frontend') || name.includes('website') || 
        desc.includes('web') || desc.includes('frontend')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2"/>
          <rect x="60" y="60" width="280" height="30" rx="4" fill="#C7D2FE"/>
          <circle cx="75" cy="75" r="5" fill="#6366F1"/>
          <circle cx="95" cy="75" r="5" fill="#A5B4FC"/>
          <circle cx="115" cy="75" r="5" fill="#C7D2FE"/>
          <rect x="60" y="100" width="120" height="8" rx="4" fill="#818CF8"/>
          <rect x="60" y="115" width="200" height="8" rx="4" fill="#C7D2FE"/>
          <rect x="60" y="130" width="180" height="8" rx="4" fill="#C7D2FE"/>
          <rect x="60" y="150" width="100" height="60" rx="4" fill="#818CF8" opacity="0.3"/>
          <rect x="170" y="150" width="100" height="60" rx="4" fill="#818CF8" opacity="0.3"/>
          <rect x="280" y="150" width="60" height="60" rx="4" fill="#818CF8" opacity="0.3"/>
        </svg>
      );
    }
    
    // Backend / API - Server/Database illustration
    if (name.includes('backend') || name.includes('api') || name.includes('server') ||
        desc.includes('backend') || desc.includes('api') || desc.includes('server')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="100" y="80" width="200" height="140" rx="8" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2"/>
          <rect x="120" y="100" width="160" height="20" rx="4" fill="#93C5FD"/>
          <rect x="120" y="130" width="160" height="20" rx="4" fill="#BFDBFE"/>
          <rect x="120" y="160" width="160" height="20" rx="4" fill="#BFDBFE"/>
          <rect x="120" y="190" width="100" height="20" rx="4" fill="#BFDBFE"/>
          <circle cx="150" cy="200" r="8" fill="#3B82F6"/>
          <circle cx="180" cy="200" r="8" fill="#60A5FA"/>
          <circle cx="210" cy="200" r="8" fill="#93C5FD"/>
          <rect x="50" y="240" width="300" height="40" rx="4" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2"/>
          <rect x="70" y="250" width="60" height="20" rx="2" fill="#818CF8"/>
          <rect x="140" y="250" width="60" height="20" rx="2" fill="#A5B4FC"/>
          <rect x="210" y="250" width="60" height="20" rx="2" fill="#C7D2FE"/>
        </svg>
      );
    }
    
    // Maintenance / Support - Tools/Settings illustration
    if (name.includes('maintenance') || name.includes('support') || name.includes('consulting') ||
        desc.includes('maintenance') || desc.includes('support') || desc.includes('consulting')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="150" r="80" fill="#D1FAE5" stroke="#10B981" strokeWidth="3"/>
          <circle cx="200" cy="150" r="60" fill="#A7F3D0" stroke="#10B981" strokeWidth="2"/>
          <path d="M200 90 L200 110 M200 190 L200 210 M110 150 L130 150 M270 150 L290 150 M155 105 L170 120 M230 120 L245 105 M155 195 L170 180 M230 180 L245 195" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="200" cy="150" r="8" fill="#10B981"/>
          <rect x="160" y="220" width="80" height="40" rx="4" fill="#6EE7B7" stroke="#10B981" strokeWidth="2"/>
          <rect x="170" y="230" width="60" height="20" rx="2" fill="#10B981"/>
        </svg>
      );
    }
    
    // Default: Code/Development illustration
    return (
      <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="80" y="60" width="240" height="180" rx="8" fill="#F3F4F6" stroke="#6B7280" strokeWidth="2"/>
        <path d="M120 120 L150 150 L120 180 M280 120 L250 150 L280 180" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="160" y="140" width="80" height="20" rx="4" fill="#818CF8"/>
        <circle cx="200" cy="100" r="15" fill="#A5B4FC"/>
        <rect x="100" y="200" width="200" height="20" rx="4" fill="#C7D2FE"/>
      </svg>
    );
  };

  // Helper function to get service icon based on name/description (for small icon)
  const getServiceIcon = (service) => {
    const name = (service.name || '').toLowerCase();
    const desc = (service.description || '').toLowerCase();
    
    // Web Development / Frontend
    if (name.includes('web') || name.includes('frontend') || name.includes('website') || 
        desc.includes('web') || desc.includes('frontend')) {
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    
    // Backend / API
    if (name.includes('backend') || name.includes('api') || name.includes('server') ||
        desc.includes('backend') || desc.includes('api') || desc.includes('server')) {
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    }
    
    // Maintenance / Support
    if (name.includes('maintenance') || name.includes('support') || name.includes('consulting') ||
        desc.includes('maintenance') || desc.includes('support') || desc.includes('consulting')) {
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    
    // Default: Code/Development icon
    return (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  };

  // Parse features from string/JSON
  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof features === 'string' ? features.split(',').map(f => f.trim()).filter(f => f) : [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Services</h2>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
              Our Services
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10">
              Professional technology solutions tailored to elevate your business. 
              From web development to backend services, we deliver excellence.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-50/50 max-w-5xl mx-auto">
            <img
              src="/backend-hero.png"
              alt="Backend development, APIs, and server solutions"
              className="w-full h-auto object-cover object-center"
              style={{ maxHeight: '320px' }}
            />
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {services.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Services Available</h3>
              <p className="text-slate-600">Check back soon for our service offerings!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[...services]
              .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
              .map((service) => {
              const features = parseFeatures(service.features);
              return (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-slate-300 hover:-translate-y-1">
                    {/* Service Image/Illustration */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                      {service.image ? (
                        <img
                          src={getMediaUrl(service.image)}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full opacity-90">
                          {getServiceImage(service)}
                        </div>
                      )}
                      {service.is_featured && (
                        <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/90 text-amber-900">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-6 sm:p-8 flex flex-col flex-grow">
                      {/* Icon and Price Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-slate-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow -mt-8 relative z-10">
                          <div className="w-7 h-7">
                            {getServiceIcon(service)}
                          </div>
                        </div>
                        {service.price != null && parseFloat(service.price) > 0 && (
                          <div className="text-right">
                            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                              R {parseFloat(service.price).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 block">ZAR</span>
                          </div>
                        )}
                      </div>
                    
                    {/* Service Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </h2>
                    
                    {/* Service Description */}
                    <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed text-sm sm:text-base flex-grow">
                      {service.short_description || service.description}
                    </p>
                    
                    {/* Features List */}
                    {features.length > 0 && (
                      <ul className="space-y-2.5 mb-6">
                        {features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm text-slate-600">
                            <svg className="w-5 h-5 text-emerald-500 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                        {features.length > 4 && (
                          <li className="text-sm text-slate-500 pl-7">
                            +{features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    )}
                    
                    {/* Categories Tags */}
                    {service.categories && Array.isArray(service.categories) && service.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {service.categories.slice(0, 3).map((category, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full"
                          >
                            {typeof category === 'object' ? category.name : category}
                          </span>
                        ))}
                      </div>
                    )}
                    
                      {/* CTA Button */}
                      <div className="mt-auto pt-4 border-t border-slate-100">
                        <span className="inline-flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                          Learn More
                          <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Professional CTA Section */}
        {services.length > 0 && (
          <div className="mt-16 lg:mt-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 lg:p-12 text-center text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Need a Custom Solution?</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              We can create a tailored service package designed specifically for your business needs and goals.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-semibold text-base transition-all shadow-lg hover:shadow-xl"
            >
              Contact Us
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Services;
