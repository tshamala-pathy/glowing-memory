import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/services/${id}/`);
      setService(response.data);
    } catch {
      setError('Service not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Service Not Found</h1>
            <p className="text-gray-600 mb-8 text-lg">{error || 'The service you are looking for does not exist.'}</p>
            <Link
              to="/services"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80"
          alt="Service"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl px-4 relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-2xl">
              {service.name}
            </h1>
            {service.price && (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="text-4xl font-bold text-white">${service.price}</span>
                <span className="text-white/80 text-lg">per month</span>
              </div>
            )}
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Description */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
              <h2 className="text-3xl font-bold text-gray-900">Service Overview</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
              {service.description}
            </p>
          </div>

          {/* Features Section */}
          {service.features && service.features.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(service.features) ? (
                  service.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start p-4 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow"
                    >
                      <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">{service.features}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories */}
          {service.categories && service.categories.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {service.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-5 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Highlight */}
          {service.price && (
            <div className="mb-10 p-8 relative rounded-2xl overflow-hidden text-white">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80"
                alt="Pricing"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-purple-600/80"></div>
              <div className="relative z-10 text-center">
                <p className="text-lg opacity-90 mb-2">Starting at</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-extrabold">${service.price}</span>
                  <span className="text-2xl opacity-80">/month</span>
                </div>
                <p className="text-lg opacity-90 mt-4">Flexible pricing available for custom solutions</p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-8 border-t border-gray-200">
            <Link
              to="/contact"
              className="block w-full text-center px-8 py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Get Started with This Service
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Related Services CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center text-white shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80"
            alt="Services"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10">
          <h3 className="text-3xl font-bold mb-4">Explore More Services</h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Discover our full range of professional services tailored to your needs
          </p>
            <Link
              to="/services"
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              View All Services
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

export default ServiceDetail;
