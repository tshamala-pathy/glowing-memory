import React from 'react';
import { Link } from 'react-router-dom';

const Requirements = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Quote Request Requirements</h1>
            <p className="text-gray-600 text-lg">
              Please read the following information before submitting your quote request
            </p>
          </div>

          {/* Services Offered */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Services Offered
            </h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                We offer a comprehensive range of web development and technology services:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Web Development:</strong> Custom websites, web applications, and responsive design</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Backend/API Development:</strong> RESTful APIs, database design, server-side logic</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Mobile App Development:</strong> iOS and Android applications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>E-commerce Development:</strong> Online stores, payment integration, inventory management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Maintenance/Support:</strong> Ongoing support, updates, and bug fixes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Design:</strong> UI/UX design, branding, graphics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Consulting:</strong> Technical consultation and project planning</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Required Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
              Required Information
            </h2>
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                To provide you with an accurate quote, we need the following information:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Client Information:</strong> Full name, email address, phone number (optional), company name (optional)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Project Details:</strong> Project title, detailed description, service type, budget range, timeline</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Requirements:</strong> Specific features, functionality, and any special requirements</span>
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Note:</strong> The more detailed information you provide, the more accurate our quote will be.
              </p>
            </div>
          </section>

          {/* Pricing Approach */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
              Pricing Approach
            </h2>
            <div className="bg-purple-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                Our pricing is based on several factors:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span><strong>Project Complexity:</strong> Simple projects cost less than complex, feature-rich applications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span><strong>Timeline:</strong> Rush projects may incur additional costs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span><strong>Technology Stack:</strong> Different technologies have different development costs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span><strong>Ongoing Support:</strong> Maintenance and support packages are priced separately</span>
                </li>
              </ul>
              <p className="text-gray-700 mt-4 font-semibold">
                We provide transparent, competitive pricing with no hidden fees.
              </p>
            </div>
          </section>

          {/* Expected Timelines */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Expected Timelines
            </h2>
            <div className="bg-orange-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                Project timelines vary based on scope and complexity:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span><strong>Simple Websites:</strong> 1-2 weeks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span><strong>Standard Web Applications:</strong> 2-4 weeks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span><strong>Complex Applications:</strong> 1-3 months</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span><strong>Enterprise Solutions:</strong> 3-6 months or more</span>
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Response Time:</strong> We review all quote requests within 24-48 hours and provide detailed estimates.
              </p>
            </div>
          </section>

          {/* Terms & Conditions */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
              Terms & Conditions
            </h2>
            <div className="bg-red-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                By submitting a quote request, you agree to the following:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Quote estimates are valid for 30 days from the date of issue</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Final pricing may vary based on actual project requirements and scope changes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>All project details and communications are confidential</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>We reserve the right to decline projects that are outside our expertise or capacity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Payment terms and project milestones will be discussed upon quote acceptance</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Request a Quote?</h3>
            <p className="text-gray-600 mb-6">
              Now that you've read the requirements, you can proceed to submit your quote request.
            </p>
            <Link
              to="/request-quote"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requirements;
