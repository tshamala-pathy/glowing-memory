import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

const AboutSection = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await api.get('/about/');
      setAboutData(response.data);
    } catch {
      // Don't show error, just don't display the section
    } finally {
      setLoading(false);
    }
  };

  if (loading || !aboutData) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              {aboutData.our_story_title || 'About PathyCode'}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6 whitespace-pre-line">
              {aboutData.our_story_content || 'PathyCode was founded with a vision to empower businesses and individuals through cutting-edge technology solutions.'}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center text-teal-600 hover:text-teal-700 font-semibold transition-colors"
            >
              <span>Learn More About Us</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {aboutData.image && (
            <div className="fade-in" style={{ animationDelay: '0.1s' }}>
              <img
                src={getMediaUrl(aboutData.image)}
                alt="About Us"
                className="w-full h-auto rounded-2xl shadow-2xl"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <div className="bg-gradient-to-br from-teal-50 to-slate-50 rounded-2xl p-8 fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-slate-600 rounded-xl flex items-center justify-center text-white mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {aboutData.mission_title || 'Our Mission'}
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {aboutData.mission_content || 'To deliver innovative, high-quality solutions that drive success for our clients.'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-2xl p-8 fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-teal-600 rounded-xl flex items-center justify-center text-white mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {aboutData.vision_title || 'Our Vision'}
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {aboutData.vision_content || 'To be a leading force in technology innovation, recognized for excellence and impact.'}
            </p>
          </div>
        </div>

        {/* Values Preview */}
        {aboutData.values && aboutData.values.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aboutData.values.slice(0, 3).map((value) => (
                <div key={value.id} className="text-center fade-in">
                  {value.icon && (
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-slate-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                      <i className={value.icon}></i>
                    </div>
                  )}
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h4>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSection;

