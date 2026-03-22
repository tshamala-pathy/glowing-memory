import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const STEPS = [
  { id: 1, label: 'Requirements', short: 'Requirements' },
  { id: 2, label: 'Budget & Timeline', short: 'Budget' },
  { id: 3, label: 'Terms', short: 'Terms' },
  { id: 4, label: 'Your Quote', short: 'Quote' },
];

const Quotes = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    company_name: '',
    project_title: '',
    project_description: '',
    project_type: '',
    service_type: '',
    budget_range: '',
    deadline: '',
    timeline: '',
    requirements_accepted: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        client_name: user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.username || '',
        client_email: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  const goToStep = (next) => {
    setError('');
    if (next === 4) {
      setFormData(prev => ({ ...prev, requirements_accepted: true }));
    }
    setStep(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.requirements_accepted) {
      setError('You must complete the requirements and agreement steps before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const submitData = {
        ...formData,
        client_phone: formData.client_phone || null,
        company_name: formData.company_name || null,
        project_type: formData.project_type || null,
        service_type: formData.service_type || null,
        budget_range: formData.budget_range || null,
        deadline: formData.deadline || null,
        timeline: formData.timeline || null,
        requirements_accepted: true,
      };
      await api.post('/quotes/', submitData);
      navigate('/quote-success', {
        state: {
          projectTitle: formData.project_title,
          clientEmail: formData.client_email,
        },
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.requirements_accepted?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to submit quote request. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      {/* Header bar — matches client profile */}
      <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#545b64] mb-2">
          <Link to="/" className="hover:text-[var(--brand-primary)]">Home</Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--aws-dark)] font-medium">Request a quote</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--aws-dark)]">Request a quote</h1>
            <p className="text-sm text-[#545b64] mt-0.5">
              {step < 4 ? 'Complete the steps below, then submit your project details' : 'Submit your project details'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      step >= s.id
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[#e2e8f0] text-[#64748b]'
                    }`}
                  >
                    {step > s.id ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${step >= s.id ? 'text-[var(--aws-dark)]' : 'text-[#94a3b8]'}`}>
                    {s.short}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.id ? 'bg-[var(--brand-primary)]' : 'bg-[#e2e8f0]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Requirements */}
        {step === 1 && (
          <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa]">
              <h2 className="text-lg font-semibold text-[var(--aws-dark)]">Service requirements and expectations</h2>
              <p className="text-sm text-[#545b64] mt-0.5">Please read the following before requesting a quote.</p>
            </div>
            <div className="p-6 md:p-8">
              <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2 text-[#475569]">
                <section>
                  <h3 className="font-semibold text-[var(--aws-dark)] mb-2">Services we offer</h3>
                  <p className="mb-2">Web development, backend/API, mobile apps, e-commerce, maintenance/support, design, and consulting.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-[var(--aws-dark)] mb-2">What we need from you</h3>
                  <p>Accurate client and project details: title, description, service type, budget range, and timeline so we can provide a fair estimate.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-[var(--aws-dark)] mb-2">Our expectations</h3>
                  <p>We respond within 24–48 hours. The more detail you provide, the more accurate the quote. All communications are confidential.</p>
                </section>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--aws-card-border)] flex flex-wrap items-center gap-3">
                <Link to="/requirements" className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
                  View full requirements page →
                </Link>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-6 py-3 bg-[var(--brand-primary)] text-white font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors"
                >
                  I have read the requirements
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Budget & Timeline */}
        {step === 2 && (
          <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa]">
              <h2 className="text-lg font-semibold text-[var(--aws-dark)]">Budget and timeline</h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="space-y-4 text-[#475569]">
                <p>
                  <strong className="text-[var(--aws-dark)]">Budget:</strong> The amount you indicate is a range for our initial estimate. Final pricing depends on scope, complexity, and any changes during the project. We will give you a clear breakdown before work begins.
                </p>
                <p>
                  <strong className="text-[var(--aws-dark)]">Timeline:</strong> Delivery times are estimates. They can be affected by scope changes, feedback cycles, and dependencies. We will keep you updated and aim to meet agreed milestones.
                </p>
                <p className="text-[#64748b] text-sm">
                  By continuing, you confirm that you understand that budget and timeline are estimates and may be refined after we review your full requirements.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--aws-card-border)] flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-[var(--aws-card-border)] text-[var(--aws-dark)] font-semibold hover:bg-[#f8fafc] transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-6 py-3 bg-[var(--brand-primary)] text-white font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors"
                >
                  I understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Terms agreement */}
        {step === 3 && (
          <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa]">
              <h2 className="text-lg font-semibold text-[var(--aws-dark)]">Terms and conditions</h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="space-y-3 text-[#475569] mb-6">
                <p>By submitting a quote request, you agree that:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Quote estimates are valid for 30 days from the date of issue.</li>
                  <li>Final pricing may vary based on actual requirements and scope changes.</li>
                  <li>Project details and communications are kept confidential.</li>
                  <li>We may decline projects outside our expertise or capacity.</li>
                  <li>Payment terms and milestones will be agreed when the quote is accepted.</li>
                </ul>
              </div>
              <div className="bg-[#ccfbf1] rounded-lg p-4 border border-[var(--brand-primary)]/20 mb-6">
                <label className="flex items-start cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-[var(--aws-card-border)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <span className="text-[var(--aws-dark)] font-medium">I agree to the terms and conditions above and am ready to submit my quote request.</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-[var(--aws-card-border)] text-[var(--aws-dark)] font-semibold hover:bg-[#f8fafc] transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!termsAgreed}
                  onClick={() => goToStep(4)}
                  className="px-6 py-3 bg-[var(--brand-primary)] text-white font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to quote form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Quote form */}
        {step === 4 && (
          <>
            <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
          {error && (
            <div className="mx-6 mt-6 p-4 bg-[#fef2f2] border border-red-200 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="px-6 pt-6 pb-2">
            <p className="text-sm text-[var(--brand-primary)] font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You have completed the requirements and agreement steps. Your confirmation will be recorded when you submit.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Client Information Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--aws-card-border)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--aws-dark)]">Your information</h2>
                  <p className="text-sm text-[#545b64] mt-0.5">We'll use this to contact you about your project</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">Phone number</label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors"
                    placeholder="+27 12 345 6789"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">Company name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors"
                    placeholder="Your Company"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--aws-card-border)] my-8" />

            {/* Project Details Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--aws-card-border)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--aws-dark)]">Project details</h2>
                  <p className="text-sm text-[#545b64] mt-0.5">Help us understand your project requirements</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">
                    Project title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.project_title}
                    onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                    placeholder="e.g., E-commerce Website Development"
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">
                    Project description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.project_description}
                    onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                    placeholder="Describe your project in detail: features, functionality, and any specific requirements..."
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--aws-dark)]">
                      Service type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white appearance-none cursor-pointer"
                    >
                        <option value="" className="text-gray-400">Select service type</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Backend/API Development">Backend/API Development</option>
                        <option value="Mobile App Development">Mobile App Development</option>
                        <option value="E-commerce Development">E-commerce Development</option>
                        <option value="Maintenance/Support">Maintenance/Support</option>
                        <option value="Design">Design</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--aws-dark)]">Budget range</label>
                    <select
                      value={formData.budget_range}
                      onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                      className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white appearance-none cursor-pointer"
                    >
                        <option value="" className="text-gray-400">Select range</option>
                        <option value="R 5,000 - R 15,000">R 5,000 - R 15,000</option>
                        <option value="R 15,000 - R 50,000">R 15,000 - R 50,000</option>
                        <option value="R 50,000 - R 100,000">R 50,000 - R 100,000</option>
                        <option value="R 100,000+">R 100,000+</option>
                      </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--aws-dark)]">Timeline</label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white appearance-none cursor-pointer"
                    >
                        <option value="" className="text-gray-400">Select timeline</option>
                        <option value="1-2 weeks">1-2 weeks</option>
                        <option value="2-4 weeks">2-4 weeks</option>
                        <option value="1-2 months">1-2 months</option>
                        <option value="2-3 months">2-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6+ months">6+ months</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--aws-dark)]">Desired deadline (optional)</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--aws-card-border)] my-8" />

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 border border-[var(--aws-card-border)] text-[var(--aws-dark)] font-semibold hover:bg-[#f8fafc] transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-w-[200px] px-6 py-4 bg-[var(--brand-primary)] text-white font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit quote request</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-[#64748b] mt-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              We'll review your request and get back to you within 24–48 hours.
            </p>
          </form>
        </div>

        {/* What happens next */}
        <div className="mt-8 bg-white border border-[var(--aws-card-border)] p-6">
          <h3 className="text-base font-semibold text-[var(--aws-dark)] mb-4">What happens next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-[#475569]">
              <span className="w-5 h-5 rounded-full bg-[#ccfbf1] text-[var(--brand-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </span>
              You'll receive a confirmation email immediately.
            </li>
            <li className="flex items-start gap-3 text-sm text-[#475569]">
              <span className="w-5 h-5 rounded-full bg-[#ccfbf1] text-[var(--brand-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </span>
              Our team will review your requirements within 24–48 hours.
            </li>
            <li className="flex items-start gap-3 text-sm text-[#475569]">
              <span className="w-5 h-5 rounded-full bg-[#ccfbf1] text-[var(--brand-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </span>
              We'll send you a detailed estimate and next steps.
            </li>
          </ul>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Quotes;
