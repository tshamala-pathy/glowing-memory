import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await api.get('/about/');
      setAboutData(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching about data:', error);
      if (error.isNetworkError) {
        setError(
          'Cannot connect to server. Please make sure the backend is running on http://localhost:8000'
        );
      } else {
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          'Failed to load about information';
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aboutData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
            {aboutData.hero_title || 'About PathyCode'}
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {aboutData.hero_subtitle ||
              'We are passionate about creating innovative solutions and delivering exceptional results.'}
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              {aboutData.our_story_title || 'Our Story'}
            </h2>

            <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
              {aboutData.our_story_content ||
                'PathyCode was founded with a vision to empower businesses and individuals through cutting-edge technology solutions.'}
            </p>
          </div>

          {aboutData.image && (
            <img
              src={aboutData.image}
              alt="About"
              className="rounded-2xl shadow-lg"
            />
          )}
        </div>
      </section>
      {/* WHAT WE DO */}
<section className="py-24 bg-slate-50">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
        What We Do
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        We build reliable, scalable, and well-crafted digital solutions.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {[
        {
          title: 'Web Applications',
          desc: 'Secure and scalable web applications tailored to your business needs.',
        },
        {
          title: 'Backend & APIs',
          desc: 'Robust backend systems and APIs designed for performance and growth.',
        },
        {
          title: 'Cloud & Deployment',
          desc: 'Containerized and cloud-ready deployments using modern DevOps practices.',
        },
        {
          title: 'UI & Frontend',
          desc: 'Clean, responsive, and user-friendly interfaces.',
        },
        {
          title: 'Maintenance & Support',
          desc: 'Ongoing improvements, bug fixes, and long-term support.',
        },
        {
          title: 'Consulting',
          desc: 'Technical guidance, system design, and architecture planning.',
        },
      ].map((item, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition"
        >
          <h3 className="text-xl font-semibold text-slate-800 mb-3">
            {item.title}
          </h3>
          <p className="text-slate-600">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* MISSION & VISION */}
      <section className="py-28 bg-gradient-to-b from-slate-100 to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Our Purpose
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              What drives us and where we are going.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 mb-6 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xl font-semibold">
                M
              </div>

              <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                {aboutData.mission_title || 'Our Mission'}
              </h3>

              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {aboutData.mission_content ||
                  'To deliver innovative, high-quality solutions that drive long-term success for our clients through clarity, reliability, and technical excellence.'}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 mb-6 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xl font-semibold">
                V
              </div>

              <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                {aboutData.vision_title || 'Our Vision'}
              </h3>

              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {aboutData.vision_content ||
                  'To become a trusted technology partner, known for thoughtful solutions, sustainable growth, and meaningful impact.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      {aboutData.values && aboutData.values.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aboutData.values.map((value, index) => (
                <div
                  key={value.id}
                  className="bg-gray-50 rounded-2xl p-6 fade-in hover:shadow-lg transition-shadow"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {value.icon && (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                      <i className={value.icon}></i>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

{/* HOW WE WORK */}
<section className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
        How We Work
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        A clear and structured approach from idea to delivery.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {[
        'Discover & Plan',
        'Design & Architecture',
        'Build & Test',
        'Deploy & Support',
      ].map((step, index) => (
        <div
          key={index}
          className="text-center bg-slate-50 rounded-2xl p-8 border border-slate-200"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {index + 1}
          </div>
          <h3 className="font-semibold text-slate-800">{step}</h3>
        </div>
      ))}
    </div>
  </div>
</section>

{/* WHY CHOOSE US SECTION */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {aboutData.why_choose_us_title || 'Why Choose Us'}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
              {aboutData.why_choose_us_content ||
                'We combine expertise, innovation, and dedication to deliver exceptional results.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                title: 'Quality Assurance',
                description:
                  'We maintain the highest standards in every project we undertake.',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
                title: 'Fast Delivery',
                description:
                  'We deliver results quickly without compromising on quality.',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
                title: 'Expert Team',
                description:
                  'Our team consists of experienced professionals dedicated to your success.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGIES */}
<section className="py-24 bg-slate-50">
  <div className="max-w-7xl mx-auto px-6 text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
      Technologies We Use
    </h2>
    <p className="text-lg text-slate-600 mb-12">
      Modern, proven, and scalable technologies.
    </p>

    <div className="flex flex-wrap justify-center gap-6">
      {[
        'Python',
        'Django',
        'React',
        'Docker',
        'PostgreSQL',
        'AWS',
        'Git',
      ].map((tech, index) => (
        <span
          key={index}
          className="px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-700 font-medium shadow-sm"
        >
          {tech}
        </span>
      ))}
    </div>
  </div>
</section>

{/* STATS */}
<section className="py-20 bg-slate-900 text-white">
  <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    {[
      { label: 'Projects Delivered', value: '10+' },
      { label: 'Client Commitment', value: '100%' },
      { label: 'Clean Code Focus', value: 'Always' },
      { label: 'Support & Growth', value: 'Ongoing' },
    ].map((stat, index) => (
      <div key={index}>
        <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
        <p className="text-slate-300">{stat.label}</p>
      </div>
    ))}
  </div>
</section>

{/* CTA SECTION */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Work Together?
          </h2>

          <p className="text-lg sm:text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Let’s discuss how we can help bring your vision to life with reliable,
            scalable, and well-crafted solutions.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            {/* Primary CTA */}
            <Link
              to="/contact"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition shadow-md"
            >
              Get In Touch
            </Link>

            {/* Secondary CTA */}
            <Link
              to="/projects"
              className="px-8 py-4 border border-slate-300 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl font-semibold text-lg transition"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
<section className="py-24 bg-white">
  <div className="max-w-5xl mx-auto px-6 text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
      Meet the Founder
    </h2>

    <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
      <strong>Tshamala Pathy</strong> is a software engineer specializing in
      backend development, APIs, and scalable web applications.  
      He focuses on building clean, maintainable, and reliable solutions that
      help businesses grow with confidence.
    </p>
  </div>
</section>

    </div>
  );
};
export default About;
