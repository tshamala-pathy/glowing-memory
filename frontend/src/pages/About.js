import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

/**
 * Stock photos (Unsplash) paired with each section theme. Replace URLs if you host your own assets.
 */
const SECTION_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80',
  story: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80',
  problems: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2000&q=80',
  services: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80',
  mission: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80',
  vision: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
  values: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2000&q=80',
  howWeWork: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=2000&q=80',
  whyUs: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=80',
  tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80',
  stats: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80',
  founder: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
  cta: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=2400&q=80',
};

const defaultHeroTitle = 'About PathyCode';
const defaultHeroSubtitle =
  'We are passionate about creating innovative solutions and delivering exceptional results.';

const defaultSolutions = [
  { title: 'Outdated or Fragile Systems', description: 'We modernize legacy applications and rebuild unreliable systems with clean architecture, automated tests, and maintainable code.' },
  { title: 'Scalability Bottlenecks', description: 'We design and implement scalable backends, APIs, and databases that grow with your business.' },
  { title: 'Integration Complexity', description: 'We connect your systems—payment gateways, third-party APIs, internal tools—with reliable integrations.' },
  { title: 'Manual, Repetitive Work', description: 'We automate workflows, reporting, and data handling so your team focuses on high-value work.' },
  { title: 'Poor User Experience', description: 'We build intuitive, responsive web and mobile interfaces that users love.' },
  { title: 'Security & Compliance Concerns', description: 'We implement best practices for authentication, data protection, and regulatory compliance.' },
];

const defaultServices = [
  { title: 'Web Applications', desc: 'Secure, scalable web apps tailored to your business needs.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { title: 'Backend & APIs', desc: 'Robust backend systems and APIs designed for performance and growth.', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { title: 'Cloud & DevOps', desc: 'Containerized deployments, CI/CD, and cloud infrastructure.', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
  { title: 'UI & Frontend', desc: 'Clean, responsive, and accessible interfaces your users will enjoy.', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { title: 'Maintenance & Support', desc: 'Ongoing improvements, bug fixes, and long-term technical support.', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { title: 'Consulting', desc: 'Technical guidance, system design, and architecture planning.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

const techStack = ['Python', 'Django', 'React', 'Node.js', 'Docker', 'PostgreSQL', 'AWS', 'Git'];

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
    } catch (err) {
      if (err.isNetworkError) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load about information'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const solutions = (aboutData?.solutions && aboutData.solutions.length > 0)
    ? aboutData.solutions
    : defaultSolutions;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aboutData) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — full-bleed photo + gradient for readability */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img
            src={SECTION_IMAGES.hero}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/88 to-slate-950/95" />
          <div
            className="absolute inset-0 opacity-[0.12] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-sm">
            {aboutData.hero_title || defaultHeroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-100 max-w-3xl mx-auto leading-relaxed">
            {aboutData.hero_subtitle || defaultHeroSubtitle}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              {aboutData.our_story_title || 'Our Story'}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
              {aboutData.our_story_content ||
                'PathyCode was founded with a vision to empower businesses through technology that actually works—clear, maintainable, and built to last.'}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200/80">
            <img
              src={aboutData.image ? getMediaUrl(aboutData.image) : SECTION_IMAGES.story}
              alt="About PathyCode — our team and workspace"
              className="w-full h-full min-h-[260px] sm:min-h-[320px] object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Problems We Solve / Solutions */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Problems We Solve
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We help businesses overcome technical challenges and build solutions that scale.
            </p>
          </div>
          <div className="max-w-5xl mx-auto mb-14 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/80">
            <img
              src={SECTION_IMAGES.problems}
              alt="Planning and solving business challenges together"
              className="h-48 w-full object-cover sm:h-56 md:h-64"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((item, i) => (
              <div
                key={item.id || i}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white mb-5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">What We Do</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We build reliable, scalable, and well-crafted digital solutions.
            </p>
          </div>
          <div className="max-w-5xl mx-auto mb-14 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/80">
            <img
              src={SECTION_IMAGES.services}
              alt="Building software and digital products"
              className="h-48 w-full object-cover sm:h-56 md:h-64"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {defaultServices.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-50 border border-slate-200 p-8 hover:shadow-lg hover:border-slate-200 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-5">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{s.title}</h3>
                <p className="text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Our Purpose</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              What drives us and where we are headed.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <div className="absolute inset-0">
                <img
                  src={SECTION_IMAGES.mission}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
              </div>
              <div className="relative z-10 p-10 text-white">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-6">
                  {aboutData.mission_title || 'Our Mission'}
                </h3>
                <p className="text-lg leading-relaxed whitespace-pre-line text-white/95">
                  {aboutData.mission_content ||
                    'To deliver innovative, high-quality solutions that drive long-term success through clarity, reliability, and technical excellence.'}
                </p>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <div className="absolute inset-0">
                <img
                  src={SECTION_IMAGES.vision}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
              </div>
              <div className="relative z-10 p-10 text-white">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-6">
                  {aboutData.vision_title || 'Our Vision'}
                </h3>
                <p className="text-lg leading-relaxed whitespace-pre-line text-white/95">
                  {aboutData.vision_content ||
                    'To become a trusted technology partner known for thoughtful solutions, sustainable growth, and meaningful impact.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      {aboutData.values && aboutData.values.length > 0 && (
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-5xl mx-auto mb-12 overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80">
              <img
                src={SECTION_IMAGES.values}
                alt="Collaboration and shared values"
                className="h-40 w-full object-cover sm:h-48"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Our Values</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                The principles that guide everything we do.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aboutData.values.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl bg-slate-50 border border-slate-200 p-6 lg:p-8 hover:shadow-lg hover:border-slate-200 transition-all"
                >
                  {v.icon && (
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center text-white mb-4">
                      <i className={v.icon} style={{ fontSize: '1.25rem' }} />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{v.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How We Work */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">How We Work</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A clear, structured approach from idea to delivery.
            </p>
          </div>
          <div className="max-w-5xl mx-auto mb-14 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/80">
            <img
              src={SECTION_IMAGES.howWeWork}
              alt="Discovery, design, build, and delivery"
              className="h-44 w-full object-cover sm:h-52"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {['Discover & Plan', 'Design & Architecture', 'Build & Test', 'Deploy & Support'].map((step, i) => (
              <div
                key={i}
                className="text-center rounded-2xl bg-white border border-slate-200 p-8 hover:shadow-lg hover:border-slate-200 transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white flex items-center justify-center font-bold text-xl">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-800 text-lg">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              {aboutData.why_choose_us_title || 'Why Choose Us'}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto whitespace-pre-line">
              {aboutData.why_choose_us_content ||
                'We combine expertise, innovation, and dedication to deliver exceptional results.'}
            </p>
          </div>
          <div className="max-w-5xl mx-auto mb-14 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/80">
            <img
              src={SECTION_IMAGES.whyUs}
              alt="Partnership and successful collaboration"
              className="h-44 w-full object-cover sm:h-52"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Quality Assurance', desc: 'We maintain the highest standards in every project.' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Fast Delivery', desc: 'We deliver results quickly without compromising quality.' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: 'Expert Team', desc: 'Experienced professionals dedicated to your success.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative overflow-hidden py-20 bg-slate-50">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <img
            src={SECTION_IMAGES.tech}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Technologies We Use</h2>
          <p className="text-slate-600 mb-12 max-w-xl mx-auto">
            Modern, proven, and scalable technologies.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-medium shadow-sm hover:border-slate-300 hover:shadow transition-all"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden py-20 text-white">
        <div className="absolute inset-0">
          <img
            src={SECTION_IMAGES.stats}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/94 via-slate-900/90 to-slate-950/94" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { label: 'Projects Delivered', value: '10+' },
            { label: 'Client Commitment', value: '100%' },
            { label: 'Clean Code Focus', value: 'Always' },
            { label: 'Support & Growth', value: 'Ongoing' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-bold text-slate-200 mb-1">{s.value}</div>
              <p className="text-slate-300 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-10">Meet the Founder</h2>
          <div className="grid gap-8 text-left sm:grid-cols-[minmax(0,220px)_1fr] sm:items-center sm:gap-10">
            <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200/80 sm:mx-0">
              <img
                src={SECTION_IMAGES.founder}
                alt="Tshamala Pathy"
                className="aspect-[4/5] w-full object-cover object-top"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 lg:p-10">
              <p className="text-lg text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Tshamala Pathy</strong> is a software engineer specializing in
                backend development, APIs, and scalable web applications. He focuses on building clean,
                maintainable, and reliable solutions that help businesses grow with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <img
            src={SECTION_IMAGES.cta}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/93 via-slate-900/90 to-slate-950/93" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Work Together?
          </h2>
          <p className="text-lg md:text-xl text-slate-100 mb-12 max-w-2xl mx-auto">
            Let&apos;s discuss how we can help bring your vision to life with reliable,
            scalable, and well-crafted solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              to="/contact"
              className="px-8 py-4 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold text-lg transition shadow-lg"
            >
              Get In Touch
            </Link>
            <Link
              to="/projects"
              className="px-8 py-4 border-2 border-slate-400 text-slate-200 hover:bg-white/10 hover:border-slate-400 rounded-xl font-semibold text-lg transition"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
