import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../services/api';

/**
 * Public Projects Page
 * 
 * Displays all public client projects.
 * Accessible to everyone (no authentication required).
 * Shows: project name, description, tech stack, screenshots, status.
 * Hides sensitive data (client email, invoice number, etc.).
 */
const PublicProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPublicProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const fetchPublicProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      // Use the public endpoint
      const response = await api.get('/clients/projects/public/', { params });
      const projectsData = response.data || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setError('');
    } catch (error) {
      console.error('Error fetching public projects:', error);
      setError('Failed to load projects. Please try again later.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 text-lg">Loading projects...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-4 py-md-5 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Client Projects
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Browse selected client projects that our team has made public. Click through to visit live demos and explore the work.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white p-4 p-md-5 rounded-lg shadow-sm border border-gray-200">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Projects
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or tech stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'No public projects are available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 group"
              >
                {/* Screenshots/Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {project.hero_image ? (
                    <img
                      src={project.hero_image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : project.screenshots && project.screenshots.length > 0 ? (
                    <img
                      src={getMediaUrl(project.screenshots[0])}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center text-gray-400"
                    style={{
                      display: !project.screenshots || project.screenshots.length === 0 ? 'flex' : 'none',
                    }}
                  >
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        project.status
                      )}`}
                    >
                      {project.status === 'in_progress' ? 'In Progress' : project.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title and client */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  {project.client_name && (
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                      Client: <span className="font-semibold text-gray-700">{project.client_name}</span>
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description}
                  </p>
        
                  {/* Tech Stack */}
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.slice(0, 4).map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                            +{project.tech_stack.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
        
                  {/* Links */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary text-xs sm:text-sm font-semibold flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Visit project
                      </a>
                    )}
                    {!project.live_url && (
                      <span className="text-xs text-gray-400">
                        Project link coming soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProjects;
