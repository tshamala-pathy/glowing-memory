import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const QuoteSuccess = () => {
  const location = useLocation();
  const { projectTitle, clientEmail } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h2>
        
        {projectTitle && (
          <p className="text-gray-600 mb-2">
            <strong>Project:</strong> {projectTitle}
          </p>
        )}
        
        <p className="text-gray-600 mb-6">
          Thank you for your interest in our services! We have received your quote request and sent a confirmation email to{' '}
          {clientEmail ? (
            <span className="font-semibold">{clientEmail}</span>
          ) : (
            'your email address'
          )}.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• We'll review your project requirements within 24-48 hours</li>
            <li>• You'll receive a detailed estimate via email</li>
            <li>• We may contact you if we need additional information</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/request-quote"
            className="block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Request
          </Link>
          <Link
            to="/"
            className="block w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuoteSuccess;
