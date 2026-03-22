import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/projects/${id}/`);
      setProject(response.data);
    } catch {
      setError('Project not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-slate-600 text-lg font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Project Not Found</h1>
          <p className="text-slate-600 mb-8">{error || 'The project you are looking for does not exist.'}</p>
          <Link
            to="/projects"
            className="inline-flex items-center px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Projects
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Image */}
      <div className="relative">
        {project.image ? (
          <div className="relative h-[60vh] min-h-[500px] overflow-hidden bg-gray-300">
            <img
              src={getMediaUrl(project.image)}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                    project.status === 'Completed' 
                      ? 'bg-green-500/90 text-white' 
                      : project.status === 'In Progress'
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-yellow-500/90 text-white'
                  }`}>
                    {project.status}
                  </span>
                  {project.category && (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                      {project.category}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl">
                  {project.title}
                </h1>
                <p className="text-xl text-white/90 max-w-3xl drop-shadow-lg">
                  {project.description?.substring(0, 150)}...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80"
              alt="Project"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                    project.status === 'Completed' 
                      ? 'bg-green-500/90 text-white' 
                      : project.status === 'In Progress'
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-yellow-500/90 text-white'
                  }`}>
                    {project.status}
                  </span>
                  {project.category && (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                      {project.category}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl">
                  {project.title}
                </h1>
                <p className="text-xl text-white/90 max-w-3xl drop-shadow-lg">
                  {project.description?.substring(0, 150)}...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl font-medium hover:bg-white transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Meta Information */}
          <div className="flex items-center text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">
            <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {new Date(project.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          {/* Full Description */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-slate-600 rounded-full"></div>
              <h2 className="text-3xl font-bold text-slate-900">About This Project</h2>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* Technologies Section */}
          {project.technologies && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-slate-600 rounded-full"></div>
                <h2 className="text-3xl font-bold text-slate-900">Technologies Used</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {Array.isArray(project.technologies) ? (
                  project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm">
                    {project.technologies}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tags Section */}
          {project.tags && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-slate-600 rounded-full"></div>
                <h2 className="text-3xl font-bold text-slate-900">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(project.tags) ? (
                  project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    #{project.tags}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex flex-wrap gap-4">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-8 py-4 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  View on GitHub
                </a>
              )}
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-8 py-4 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Live Site
                </a>
              )}
              {!project.github_url && !project.live_url && (
                <Link
                  to="/contact"
                  className="flex items-center px-8 py-4 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact About This Project
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Projects CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center text-white shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
            alt="Projects"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10">
          <h3 className="text-3xl font-bold mb-4">Explore More Projects</h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Check out our other innovative projects and solutions
          </p>
            <Link
              to="/projects"
              className="inline-flex items-center px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all shadow-lg"
            >
              View All Projects
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
