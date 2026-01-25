import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Pricing Plans Data
 * 
 * This array contains all pricing plans for PathyCode services.
 * Each plan includes title, price, billing description, features, highlight status, and CTA text.
 * 
 * IMPORTANT: Only includes services that PathyCode currently offers.
 * Pricing is service-based (project quotes), not SaaS subscriptions.
 */
const pricingPlans = [
  {
    title: 'Starter',
    price: 'R 8,000',
    billingDescription: 'Starting from',
    features: [
      'Small business website',
      'Basic backend setup',
      'Responsive design',
      'Deployment support',
      'Basic documentation',
      '1 month post-launch support',
    ],
    highlight: false,
    ctaText: 'Request Quote',
    ctaLink: '/contact',
  },
  {
    title: 'Professional',
    price: 'R 25,000',
    billingDescription: 'Starting from',
    features: [
      'Custom web application',
      'Django REST API',
      'Database design & setup',
      'User authentication system',
      'Admin dashboard',
      'Maintenance support (3 months)',
      'Performance optimization',
      'API documentation',
    ],
    highlight: true, // Recommended plan
    ctaText: 'Choose Plan',
    ctaLink: '/contact',
  },
  {
    title: 'Custom / Enterprise',
    price: 'Custom',
    billingDescription: 'Let\'s talk',
    features: [
      'Complex or long-term projects',
      'API integrations',
      'Performance optimization',
      'Ongoing consulting',
      'Dedicated support',
      'Custom architecture',
      'Scalability planning',
      'Priority development',
    ],
    highlight: false,
    ctaText: 'Get Custom Quote',
    ctaLink: '/quotes',
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Choose the right package for your project. All prices are starting points and can be customized based on your specific requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl border ${
                  plan.highlight
                    ? 'border-blue-500 shadow-xl scale-105'
                    : 'border-slate-200 shadow-md'
                } p-8 md:p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                {/* Recommended Badge */}
                {plan.highlight && (
                  <div className="absolute -top-4 right-6">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                    {plan.title}
                  </h3>
                  
                  {/* Price */}
                  <div className="mb-2">
                    {plan.price === 'Custom' ? (
                      <div className="flex items-baseline">
                        <span className="text-5xl md:text-6xl font-bold text-slate-900">
                          Custom
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-5xl md:text-6xl font-bold text-slate-900">
                          {plan.price.split(' ')[0]}
                        </span>
                        <span className="text-2xl text-slate-600 ml-2">
                          {plan.price.split(' ')[1]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Billing Description */}
                  <p className="text-sm text-slate-500 font-medium">
                    {plan.billingDescription}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-slate-700 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to={plan.ctaLink}
                  className={`block w-full text-center px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : plan.price === 'Custom'
                      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Information Section */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              What's Included in Every Plan
            </h2>
            <p className="text-lg text-slate-600">
              All packages include these essential services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Quality Assurance',
                description: 'Thorough testing and quality checks before delivery',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Secure & Reliable',
                description: 'Best practices for security and performance',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Documentation',
                description: 'Clear documentation for maintenance and updates',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: 'Ongoing Support',
                description: 'Post-launch support and maintenance options',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start p-6 bg-slate-50 rounded-2xl border border-slate-200"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mr-4">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Additional Info */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  question: 'Are these prices fixed?',
                  answer: 'The prices shown are starting points. Final pricing depends on your specific requirements, project scope, and timeline. We\'ll provide a detailed quote after discussing your needs.',
                },
                {
                  question: 'What payment terms do you offer?',
                  answer: 'We typically work with milestone-based payments. A deposit is required to start, with payments at key project milestones and final payment upon completion.',
                },
                {
                  question: 'Can I upgrade or customize a plan?',
                  answer: 'Absolutely! All plans can be customized. We can add features, extend support periods, or combine elements from different plans to create the perfect solution for your project.',
                },
                {
                  question: 'What happens after the project is complete?',
                  answer: 'All plans include post-launch support. We can also arrange ongoing maintenance, updates, and additional features as your business grows.',
                },
              ].map((faq, idx) => (
                <div key={idx} className="border-b border-slate-200 last:border-0 pb-6 last:pb-0">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Every project is unique. Let's discuss your requirements and create a tailored package that fits your budget and timeline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quotes"
              className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Request Custom Quote
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-slate-900 transition-all"
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
