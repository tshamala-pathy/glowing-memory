import React from "react";
import { Link } from "react-router-dom";
import Newsletter from "../components/Newsletter";
import Testimonials from "../components/Testimonials";
import AboutSection from "../components/AboutSection";
import StatsSection from "../components/StatsSection";

// Shared container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
const CONTAINER = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
const CONTAINER_NARROW = "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8";
const SECTION_HEADING = "text-3xl sm:text-4xl font-bold text-gray-900 mb-4";
const SECTION_SUB = "text-gray-600 max-w-2xl mx-auto";

// High-quality Unsplash images for a polished, professional UI
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80",
  heroFloating: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  strip: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  ],
  cta: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80",
  newsletter: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
};

const features = [
  {
    title: "Projects",
    description: "Explore our portfolio: web apps, APIs, and digital solutions built for real clients.",
    color: "from-blue-500 to-blue-600",
    link: "/projects",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: "Services",
    description: "Web development, systems, APIs, and business solutions tailored to your needs.",
    color: "from-purple-500 to-purple-600",
    link: "/services",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Blog",
    description: "Insights, tutorials, and updates on tech, design, and building digital products.",
    color: "from-green-500 to-green-600",
    link: "/blog",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4-4h-4m-4 0H9m0 0v4" />
      </svg>
    ),
  },
  {
    title: "About",
    description: "Our story, mission, values, and the people behind PathyCode.",
    color: "from-teal-500 to-teal-600",
    link: "/about",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: "Pricing",
    description: "Transparent plans and packages. Find the right fit for your project.",
    color: "from-amber-500 to-amber-600",
    link: "/pricing",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Contact",
    description: "Get in touch for quotes, support, or to start your next project.",
    color: "from-orange-500 to-orange-600",
    link: "/contact",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const Home = () => {
  return (
    <div className="bg-white text-gray-800">

      {/* ——— Hero ——— */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${IMAGES.hero}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />

        {/* Floating dashboard preview (desktop) */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden xl:block w-[320px] z-10">
          <div className="rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20">
            <img
              src={IMAGES.heroFloating}
              alt="Dashboard preview"
              className="w-full h-52 object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6">
            Build Your Digital
            <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Presence
            </span>
          </h1>
          <p className="text-xl text-gray-200 mb-10">
            I design and build modern websites, applications, and digital
            solutions that help businesses grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg shadow-2xl hover:scale-105 transition"
            >
              Get Started Free
            </Link>
            <Link
              to="/projects"
              className="px-10 py-4 rounded-full border border-white/40 text-white hover:bg-white/10 transition"
            >
              View Projects
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-300">
            No credit card required · Trusted by professionals
          </p>
        </div>
      </section>

      {/* ——— What I Offer (Features) ——— */}
      <section className="py-24 bg-gray-50">
        <div className={CONTAINER}>
          <header className="text-center mb-16">
            <h2 className={SECTION_HEADING}>What I Offer</h2>
            <p className={SECTION_SUB}>
              Everything you need to build a strong and professional online presence.
            </p>
          </header>

          {/* Image strip: coding, teamwork, design, delivery */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {IMAGES.strip.map((src, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-lg group h-44 md:h-52"
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Link
                key={i}
                to={feature.link}
                className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >
                <div
                  className={`w-14 h-14 flex items-center justify-center rounded-xl text-white mb-5 bg-gradient-to-br ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                <span className="inline-flex items-center mt-4 text-blue-600 font-medium text-sm">
                  Learn more
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ——— About ——— */}
      <AboutSection />

      {/* ——— Stats ——— */}
      <StatsSection />

      {/* ——— Testimonials ——— */}
      <Testimonials />

      {/* ——— Newsletter ——— */}
      <section className="py-24 bg-gray-50">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={IMAGES.newsletter}
                  alt="Stay in the loop"
                  loading="lazy"
                  className="w-full h-64 lg:h-80 object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2">
              <Newsletter />
            </div>
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="relative py-24 overflow-hidden text-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${IMAGES.cta}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/92 via-purple-600/90 to-blue-700/92" />
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
            Ready to Work Together?
          </h2>
          <p className="text-white mb-10 text-xl font-semibold [text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_0_24px_rgba(0,0,0,0.5)]">
            Let’s build something amazing for your business or personal brand.
          </p>
          <Link
            to="/contact"
            className="inline-block px-12 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg shadow-xl hover:scale-105 transition"
          >
            Contact Me →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
