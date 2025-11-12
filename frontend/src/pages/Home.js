import React from 'react';
import { Link } from 'react-router-dom';
import Newsletter from '../components/Newsletter';
import Testimonials from '../components/Testimonials';

const Home = () => {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: 'Project Portfolio',
      description: 'Showcase your innovative projects and solutions with detailed descriptions, technologies, and live demonstrations.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      title: 'Professional Services',
      description: 'Offer comprehensive services tailored to your clients\' business needs with detailed pricing and feature lists.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Blog & Insights',
      description: 'Share your knowledge, insights, and industry updates through beautifully designed blog posts and articles.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Contact Management',
      description: 'Efficiently manage client inquiries and communication through an intuitive contact system.',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Build Your Digital
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Presence
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              A comprehensive platform for showcasing projects, services, and insights.
              Professional, powerful, and designed for success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <Link
                to="/projects"
                className="px-8 py-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                View Projects
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you showcase your work and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group card-professional p-8 fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 transform group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
                  <span>Learn more</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="fade-in">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">100+</div>
              <div className="text-gray-600 font-medium">Projects</div>
            </div>
            <div className="fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-gray-600 font-medium">Services</div>
            </div>
            <div className="fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">200+</div>
              <div className="text-gray-600 font-medium">Blog Posts</div>
            </div>
            <div className="fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600 font-medium">Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Newsletter />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who are already building their digital presence with PathyCode
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-xl"
            >
              Create Free Account
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
