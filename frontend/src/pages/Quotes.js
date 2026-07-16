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

const inputClass =
  'w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3 text-stone-800 shadow-sm transition placeholder:text-stone-400 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15';

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

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        client_name:
          user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || '',
        client_email: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  const goToStep = (next) => {
    setError('');
    if (next === 4) {
      setFormData((prev) => ({ ...prev, requirements_accepted: true }));
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
    <div className="min-h-screen bg-[#f6f4f1]">
      <header className="relative overflow-hidden border-b border-stone-200/80 bg-gradient-to-b from-white via-[#faf9f6] to-[#f3f1ed] text-slate-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.85]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(14, 165, 233, 0.09) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 100% 0%, rgba(20, 184, 166, 0.08) 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(120, 113, 108, 0.06) 0%, transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10">
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
              <li>
                <Link to="/" className="font-medium text-sky-800 transition hover:text-sky-950">
                  Home
                </Link>
              </li>
              <li className="text-stone-300 select-none" aria-hidden>
                /
              </li>
              <li className="font-medium text-stone-800" aria-current="page">
                Estimate request
              </li>
            </ol>
          </nav>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-800/90">
            Scoping &amp; estimates
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl md:text-[2.5rem] md:leading-[1.12]">
            Tell us about your project
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
            {step < 4
              ? 'A short guided flow helps us understand scope, budget, and timing—so we can respond with a clear, tailored estimate.'
              : 'Review your details and submit. We typically respond within one to two business days.'}
          </p>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-4xl px-4 pb-16 pt-0 sm:px-6">
        <div className="-mt-8 rounded-3xl border border-stone-200/90 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] sm:p-8 md:p-10">
          {/* Step rail: vertical on md+, compact row on small screens */}
          <div className="mb-10 border-b border-stone-100 pb-10">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 md:text-left">
              Progress
            </p>
            <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-1 items-center gap-3 md:flex-col md:items-stretch md:gap-0">
                    <div className="flex items-center gap-3 md:block">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all md:mx-auto ${
                          step >= s.id
                            ? 'bg-gradient-to-br from-sky-600 to-teal-600 text-white shadow-md shadow-sky-900/20'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {step > s.id ? (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          s.id
                        )}
                      </div>
                      <div className="min-w-0 md:mt-3 md:text-center">
                        <p className={`text-sm font-semibold ${step >= s.id ? 'text-stone-900' : 'text-stone-400'}`}>
                          {s.label}
                        </p>
                        <p className="hidden text-xs text-stone-500 md:block">{s.short}</p>
                      </div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`hidden h-px flex-1 self-center md:mx-2 md:block md:h-0.5 md:min-w-[2rem] ${
                        step > s.id ? 'bg-sky-400' : 'bg-stone-200'
                      }`}
                      aria-hidden
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="mb-6 border-l-4 border-sky-500 pl-5">
                <h2 className="text-xl font-semibold text-stone-900">Service requirements</h2>
                <p className="mt-1 text-sm text-stone-600">Read what we offer and what we need from you.</p>
              </div>
              <div className="max-h-[50vh] space-y-8 overflow-y-auto rounded-2xl bg-stone-50/90 p-6 pr-3 text-stone-600 ring-1 ring-stone-100">
                <section>
                  <h3 className="mb-2 font-semibold text-stone-900">Services we offer</h3>
                  <p>
                    Web development, backend/API, mobile apps, e-commerce, maintenance/support, design, and consulting.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-stone-900">What we need from you</h3>
                  <p>
                    Accurate client and project details: title, description, service type, budget range, and timeline so we
                    can provide a fair estimate.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-stone-900">Our expectations</h3>
                  <p>
                    We respond within 24–48 hours. The more detail you provide, the more accurate the quote. All
                    communications are confidential.
                  </p>
                </section>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-8">
                <Link to="/requirements" className="text-sm font-semibold text-sky-800 underline-offset-4 hover:text-sky-950 hover:underline">
                  Full requirements page →
                </Link>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:to-teal-500"
                >
                  I have read the requirements
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="mb-6 border-l-4 border-sky-500 pl-5">
                <h2 className="text-xl font-semibold text-stone-900">Budget & timeline</h2>
                <p className="mt-1 text-sm text-stone-600">How estimates and dates work before we scope in detail.</p>
              </div>
              <div className="space-y-5 rounded-2xl bg-stone-50/90 p-6 text-stone-600 ring-1 ring-stone-100">
                <p>
                  <strong className="text-stone-900">Budget:</strong> The range you give guides our first estimate.
                  Final pricing depends on scope, complexity, and changes—we’ll give you a clear breakdown before work
                  begins.
                </p>
                <p>
                  <strong className="text-stone-900">Timeline:</strong> Dates are estimates and can shift with scope,
                  feedback, or dependencies. We’ll keep you updated and aim for agreed milestones.
                </p>
                <p className="text-sm text-stone-500">
                  By continuing, you confirm that budget and timeline are estimates and may be refined after we review
                  your full requirements.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 border-t border-stone-100 pt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:to-teal-500"
                >
                  I understand
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div className="mb-6 border-l-4 border-sky-500 pl-5">
                <h2 className="text-xl font-semibold text-stone-900">Terms & conditions</h2>
                <p className="mt-1 text-sm text-stone-600">Please read and confirm before the quote form.</p>
              </div>
              <div className="mb-6 space-y-3 text-stone-600">
                <p>By submitting a quote request, you agree that:</p>
                <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
                  <li>Quote estimates are valid for 30 days from the date of issue.</li>
                  <li>Final pricing may vary based on actual requirements and scope changes.</li>
                  <li>Project details and communications are kept confidential.</li>
                  <li>We may decline projects outside our expertise or capacity.</li>
                  <li>Payment terms and milestones will be agreed when the quote is accepted.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-sky-200/90 bg-sky-50/60 p-5 ring-1 ring-sky-100/80">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-stone-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-medium text-stone-900">
                    I agree to the terms above and am ready to submit my quote request.
                  </span>
                </label>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!termsAgreed}
                  onClick={() => goToStep(4)}
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Continue to quote form
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <>
              <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm">
                {error && (
                  <div className="mx-6 mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <svg className="h-5 w-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm font-medium text-red-900">{error}</p>
                  </div>
                )}

                <div className="border-b border-stone-100 px-6 pb-2 pt-6 sm:px-8">
                  <p className="flex items-start gap-3 text-sm font-medium text-teal-900">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Requirements and terms are complete. Your confirmation is recorded when you submit this form.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-8">
                  <div className="mb-10">
                    <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-stone-900">Your information</h2>
                        <p className="text-sm text-stone-500">We’ll use this to contact you about your project.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-stone-800">
                          Full name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          className={inputClass}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-stone-800">
                          Email address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                          className={inputClass}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-stone-800">Phone number</label>
                        <input
                          type="tel"
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          className={inputClass}
                          placeholder="+27 12 345 6789"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-stone-800">Company name</label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          className={inputClass}
                          placeholder="Your Company"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="my-10 border-t border-dashed border-stone-200" />

                  <div className="mb-10">
                    <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md shadow-teal-900/15">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-stone-900">Project details</h2>
                        <p className="text-sm text-stone-500">The more context, the better we can estimate.</p>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-stone-800">
                          Project title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.project_title}
                          onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                          placeholder="e.g., E-commerce Website Development"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-stone-800">
                          Project description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={formData.project_description}
                          onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                          placeholder="Describe your project: features, integrations, users, and constraints…"
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-stone-800">
                            Service type <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={formData.service_type}
                            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Select service type</option>
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
                          <label className="block text-sm font-medium text-stone-800">Budget range</label>
                          <select
                            value={formData.budget_range}
                            onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Select range</option>
                            <option value="R 5,000 - R 15,000">R 5,000 - R 15,000</option>
                            <option value="R 15,000 - R 50,000">R 15,000 - R 50,000</option>
                            <option value="R 50,000 - R 100,000">R 50,000 - R 100,000</option>
                            <option value="R 100,000+">R 100,000+</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-stone-800">Timeline</label>
                          <select
                            value={formData.timeline}
                            onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Select timeline</option>
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
                        <label className="block text-sm font-medium text-stone-800">Desired deadline (optional)</label>
                        <input
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-8">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex min-w-[220px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 px-6 py-4 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Submitting…</span>
                        </>
                      ) : (
                        <>
                          <span>Submit quote request</span>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-5 flex items-center gap-2 text-sm text-stone-500">
                    <svg className="h-4 w-4 shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Typical response within 24–48 hours.
                  </p>
                </form>
              </div>

              <div className="mt-8 rounded-3xl border border-stone-200/90 bg-gradient-to-br from-white to-stone-50/80 p-6 ring-1 ring-stone-100 sm:p-8">
                <h3 className="text-lg font-semibold text-stone-900">What happens next?</h3>
                <ul className="mt-5 space-y-4">
                  {[
                    'You’ll get a confirmation email right away.',
                    'We review your brief within 24–48 hours.',
                    'We follow up with an estimate and clear next steps.',
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-relaxed text-stone-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quotes;
