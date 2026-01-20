import React from "react";
import { Link } from "react-router-dom";
import Newsletter from "../components/Newsletter";
import Testimonials from "../components/Testimonials";
import AboutSection from "../components/AboutSection";
import StatsSection from "../components/StatsSection"; // new component

const Home = () => {
  const features = [
    {
      title: "Project Portfolio",
      description:
        "Showcase your best projects with clean layouts, tech stacks, and live demos.",
      color: "from-blue-500 to-blue-600",
      link: "/projects",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      title: "Professional Services",
      description:
        "Web development, systems, APIs, and business solutions tailored to your needs.",
      color: "from-purple-500 to-purple-600",
      link: "/services",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6M9 16h6M9 8h6" />
        </svg>
      ),
    },
    {
      title: "Blog & Insights",
      description:
        "Share your ideas, tech knowledge, and industry insights with the world.",
      color: "from-green-500 to-green-600",
      link: "/blog",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6v12m6-6H6" />
        </svg>
      ),
    },
    {
      title: "Contact & Support",
      description:
        "Easy communication and fast response for clients and collaborators.",
      color: "from-orange-500 to-orange-600",
      link: "/contact",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 8V7a2 2 0 00-2-2H5a2 2 0 00-2 2v1m18 0v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8m18 0l-9 6-9-6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white text-gray-800">

      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1498050108023-c5249f4df085')",
          }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>

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
            No credit card required • Trusted by professionals
          </p>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What I Offer</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to build a strong and professional online presence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-lg p-8 rounded-3xl border shadow-xl hover:-translate-y-2 hover:shadow-2xl transition"
              >
                <div
                  className={`w-16 h-16 flex items-center justify-center rounded-2xl text-white mb-6 bg-gradient-to-br ${feature.color}`}
                >
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>

                <Link
                  to={feature.link}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <AboutSection />

      {/* ================= STATS ================= */}
      <StatsSection />

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Testimonials />
        </div>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 bg-white rounded-3xl shadow-xl p-12">
          <Newsletter />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-28 bg-gradient-to-r from-blue-600 to-purple-600 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
          Ready to Work Together?
        </h2>
        <p className="text-blue-100 mb-10 max-w-xl mx-auto">
          Let’s build something amazing for your business or personal brand.
        </p>

        <Link
          to="/contact"
          className="inline-block px-12 py-5 bg-white text-blue-600 rounded-full font-semibold shadow-2xl hover:scale-110 transition"
        >
          Contact Me 🚀
        </Link>
      </section>
    </div>
  );
};

export default Home;
