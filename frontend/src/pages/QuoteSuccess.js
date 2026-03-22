import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const QuoteSuccess = () => {
  const location = useLocation();
  const { projectTitle, clientEmail } = location.state || {};

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#545b64] mb-2">
          <Link to="/" className="hover:text-[var(--brand-primary)]">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/request-quote" className="hover:text-[var(--brand-primary)]">Request a quote</Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--aws-dark)] font-medium">Success</span>
        </nav>
        <h1 className="text-xl font-bold text-[var(--aws-dark)]">Quote received</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#ccfbf1] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Quote request submitted</h2>
            {projectTitle && (
              <p className="text-[#475569] mb-2">
                <strong className="text-[var(--aws-dark)]">Project:</strong> {projectTitle}
              </p>
            )}
            <p className="text-[#475569] text-sm mb-6">
              Thank you for your interest. We've received your quote request and sent a confirmation to{' '}
              {clientEmail ? <span className="font-semibold text-[var(--aws-dark)]">{clientEmail}</span> : 'your email address'}.
            </p>
            <div className="bg-[#f8fafc] border border-[var(--aws-card-border)] rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-[var(--aws-dark)] mb-2">What happens next?</h3>
              <ul className="text-sm text-[#475569] space-y-1.5">
                <li>• We'll review your project requirements within 24–48 hours</li>
                <li>• You'll receive a detailed estimate via email</li>
                <li>• We may contact you if we need additional information</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/request-quote"
                className="flex-1 px-6 py-3 bg-[var(--brand-primary)] text-white font-medium text-center hover:bg-[var(--brand-primary-hover)] transition-colors"
              >
                Submit another request
              </Link>
              <Link
                to="/"
                className="flex-1 px-6 py-3 border border-[var(--aws-card-border)] text-[var(--aws-dark)] font-medium text-center hover:bg-[#f8fafc] transition-colors"
              >
                Return to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSuccess;
