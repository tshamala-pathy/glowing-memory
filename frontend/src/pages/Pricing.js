import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/');
      const data = response.data.results || response.data;
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const pricingPlans = [
    {
      name: 'Basic',
      price: 'R 5,000',
      period: 'one-time',
      description: 'Perfect for small projects and simple websites',
      features: [
        'Up to 5 pages',
        'Responsive design',
        'Basic SEO',
        'Contact form',
        '1 month support',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: 'R 15,000',
      period: 'one-time',
      description: 'Ideal for growing businesses',
      features: [
        'Up to 15 pages',
        'Custom design',
        'Advanced SEO',
        'CMS integration',
        'E-commerce ready',
        '3 months support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'quote',
      description: 'Tailored solutions for large projects',
      features: [
        'Unlimited pages',
        'Fully custom design',
        'Advanced features',
        'API integration',
        'Priority support',
        'Dedicated project manager',
      ],
      popular: false,
    },
  ];

  const subscriptionPlans = [
    {
      name: 'Monthly Maintenance',
      price: 'R 2,500',
      period: 'per month',
      description: 'Keep your site running smoothly',
      features: [
        'Monthly updates',
        'Security monitoring',
        'Backup & restore',
        'Performance optimization',
        'Email support',
      ],
    },
    {
      name: 'Premium Support',
      price: 'R 5,000',
      period: 'per month',
      description: 'Comprehensive support package',
      features: [
        'Weekly updates',
        '24/7 monitoring',
        'Priority support',
        'Feature additions',
        'Phone & email support',
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Transparent Pricing</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All prices include VAT (15%).
          </p>
        </div>
      </section>

      {/* One-Time Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">One-Time Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Perfect for projects with a clear scope and timeline
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-8 relative ${
                  plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== 'quote' && (
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.period === 'quote' ? (
                  <Link
                    to="/quotes"
                    className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Request Custom Quote
                  </Link>
                ) : (
                  <Link
                    to="/contact"
                    className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ongoing support and maintenance for your digital presence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {subscriptionPlans.map((plan, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="block w-full text-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Services */}
      {services.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Additional Services</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We offer a wide range of specialized services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  {service.price && (
                    <div className="text-2xl font-bold text-blue-600 mb-4">
                      R {parseFloat(service.price).toFixed(2)}
                    </div>
                  )}
                  <Link
                    to="/quotes"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Request Quote →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-xl text-blue-100 mb-8">
            We'll work with you to create a tailored package that fits your exact needs and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quotes"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Request a Quote
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;

