import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Hero + section imagery (Unsplash) — transparent pricing, planning, value.
 */
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2400&q=85',
  included: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=85',
  cta: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2400&q=85',
};

/**
 * Pricing plans — service-based project quotes (not subscriptions).
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
    highlight: true,
    ctaText: 'Choose Plan',
    ctaLink: '/contact',
  },
  {
    title: 'Custom / Enterprise',
    price: 'Custom',
    billingDescription: "Let's talk",
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

const includedItems = [
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
];

const faqs = [
  {
    question: 'Are these prices fixed?',
    answer:
      "The prices shown are starting points. Final pricing depends on your specific requirements, project scope, and timeline. We'll provide a detailed quote after discussing your needs.",
  },
  {
    question: 'What payment terms do you offer?',
    answer:
      'We typically work with milestone-based payments. A deposit is required to start, with payments at key project milestones and final payment upon completion.',
  },
  {
    question: 'Can I upgrade or customize a plan?',
    answer:
      'Absolutely! All plans can be customized. We can add features, extend support periods, or combine elements from different plans to create the perfect solution for your project.',
  },
  {
    question: 'What happens after the project is complete?',
    answer:
      'All plans include post-launch support. We can also arrange ongoing maintenance, updates, and additional features as your business grows.',
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero — full-bleed image + headline */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.hero}
            alt=""
            className="h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/93 via-teal-950/88 to-slate-950/92" />
          <div
            className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
            aria-hidden
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-20 pb-28 text-center sm:px-6 sm:pt-24 sm:pb-32 lg:px-8">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-teal-100 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden />
            No hidden fees · Clear estimates
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            Transparent Pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl">
            Choose the right package for your project. All prices are starting points and can be customized based on your
            specific requirements.
          </p>
        </div>
      </header>

      {/* Plans — overlap hero */}
      <section className="relative z-20 -mt-12 sm:-mt-16 pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 lg:items-stretch">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-lg transition duration-300 sm:p-10 ${
                  plan.highlight
                    ? 'border-teal-500 ring-2 ring-teal-500/30 lg:scale-[1.02] lg:shadow-2xl'
                    : 'border-slate-200/90 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-1.5 text-sm font-semibold text-white shadow-lg">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{plan.title}</h2>
                  <div className="mt-4">
                    {plan.price === 'Custom' ? (
                      <span className="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">Custom</span>
                    ) : (
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
                          {plan.price.split(' ')[0]}
                        </span>
                        <span className="text-2xl font-semibold text-slate-600">{plan.price.split(' ').slice(1).join(' ')}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-500">{plan.billingDescription}</p>
                </div>

                <ul className="mb-10 flex-1 space-y-3.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-slate-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  className={`mt-auto block w-full rounded-xl py-4 text-center text-lg font-semibold transition ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg'
                      : plan.price === 'Custom'
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included — image + grid */}
      <section className="border-t border-slate-200/80 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="relative order-2 overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-200/80 lg:order-1">
              <img
                src={IMAGES.included}
                alt="Collaboration and clear project planning"
                className="aspect-[4/3] w-full object-cover sm:aspect-auto sm:min-h-[320px] lg:min-h-[380px]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/20 to-transparent" aria-hidden />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                What&apos;s Included in Every Plan
              </h2>
              <p className="mt-3 text-lg text-slate-600">All packages include these essential services</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {includedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition hover:border-teal-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-600">Straight answers about how we price and deliver work.</p>
            <div className="mt-10 space-y-8">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA — background image */}
      <section className="relative overflow-hidden py-20 md:py-24">
        <div className="absolute inset-0">
          <img
            src={IMAGES.cta}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/94 via-slate-900/92 to-teal-950/93" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Need a Custom Solution?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200">
            Every project is unique. Let&apos;s discuss your requirements and create a tailored package that fits your budget
            and timeline.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/quotes"
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              Request Custom Quote
            </Link>
            <Link
              to="/contact"
              className="rounded-xl border-2 border-white/80 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
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
