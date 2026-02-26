import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service and Privacy Policy page.
 * Linked from Register and Login: "By creating an account, you agree to our Terms of Service and Privacy Policy."
 */
const TermsAndPrivacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 sm:px-10 py-8 sm:py-10 border-b border-gray-100">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Terms of Service & Privacy Policy</h1>
            <p className="text-gray-600 text-base">
              By creating an account, you agree to our{' '}
              <a href="#terms-of-service" className="font-medium text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy-policy" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="px-6 sm:px-10 py-8 sm:py-10 space-y-12">
            {/* Terms of Service */}
            <section id="terms-of-service" className="scroll-mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Terms of Service</h2>
              <div className="prose prose-gray max-w-none space-y-4 text-gray-700 text-sm sm:text-base">
                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using this service, you agree to be bound by these Terms of Service. If you do not agree, do not use the service or create an account.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">2. Account and Registration</h3>
                <p>
                  You must provide accurate and complete information when registering. You are responsible for keeping your password secure and for all activity under your account. Notify us immediately of any unauthorized use.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">3. Use of the Service</h3>
                <p>
                  You may use the service only for lawful purposes and in accordance with these terms. You agree not to misuse the service, attempt to gain unauthorized access, or interfere with other users or the operation of the system.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">4. Quotes, Invoices, and Projects</h3>
                <p>
                  Quotes and invoices are binding in accordance with their terms. Project work is subject to separate agreements as communicated. You are responsible for reviewing and complying with any project-specific instructions provided to you.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">5. Intellectual Property</h3>
                <p>
                  Content and materials provided through the service remain the property of the service provider or their licensors. You may not copy, modify, or distribute such content without permission.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">6. Limitation of Liability</h3>
                <p>
                  The service is provided "as is." We are not liable for indirect, incidental, or consequential damages arising from your use of the service or inability to use it.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">7. Changes</h3>
                <p>
                  We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. We encourage you to review this page periodically.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">8. Contact</h3>
                <p>
                  For questions about these Terms of Service, please use the <Link to="/contact" className="text-blue-600 hover:text-blue-500 font-medium">Contact</Link> page.
                </p>
              </div>
            </section>

            {/* Privacy Policy */}
            <section id="privacy-policy" className="scroll-mt-6 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
              <div className="prose prose-gray max-w-none space-y-4 text-gray-700 text-sm sm:text-base">
                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">1. Information We Collect</h3>
                <p>
                  We collect information you provide when registering (e.g. name, email, password) and when using the service (e.g. quote requests, messages, project-related data). We may also collect usage data and technical information (e.g. IP address, browser type) to operate and improve the service.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">2. How We Use Your Information</h3>
                <p>
                  We use your information to provide, maintain, and improve the service; to communicate with you about your account, quotes, and projects; to send important notices; and to comply with legal obligations. We do not sell your personal information to third parties.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">3. Data Sharing and Disclosure</h3>
                <p>
                  We may share data with service providers that help us operate the platform (e.g. hosting), under strict confidentiality. We may disclose information when required by law or to protect our rights and safety.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">4. Data Security</h3>
                <p>
                  We use appropriate technical and organizational measures to protect your data. You are responsible for keeping your login credentials secure.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">5. Your Rights</h3>
                <p>
                  You may access, correct, or request deletion of your personal data through your account settings or by contacting us. Applicable law may provide additional rights (e.g. data portability, objection, restriction).
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">6. Cookies and Similar Technologies</h3>
                <p>
                  We use cookies and similar technologies for authentication, preferences, and analytics to improve the service. You can adjust your browser settings to limit cookies, though some features may not work fully.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">7. Updates to This Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time. We will post the updated version on this page and indicate the effective date. Your continued use of the service after changes constitutes acceptance of the updated policy.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">8. Contact</h3>
                <p>
                  For privacy-related questions or requests, please use the <Link to="/contact" className="text-blue-600 hover:text-blue-500 font-medium">Contact</Link> page.
                </p>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default TermsAndPrivacy;
