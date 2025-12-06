import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    blogPosts: 0,
    services: 0,
    contacts: 0,
    testimonials: 0,
    newsletter: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentContacts, setRecentContacts] = useState([]);
  const [recentTestimonials, setRecentTestimonials] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Check if user is superuser
    if (user && user.is_superuser !== true) {
      navigate('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, blogRes, servicesRes, contactsRes, testimonialsRes, newsletterRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/blog/'),
        api.get('/services/'),
        api.get('/contact/'),
        api.get('/testimonials/'),
        api.get('/newsletter/subscribe/').catch(() => ({ data: [] })), // May not have list endpoint
      ]);

      setStats({
        projects: projectsRes.data.count || (Array.isArray(projectsRes.data) ? projectsRes.data.length : projectsRes.data.results?.length || 0),
        blogPosts: blogRes.data.count || (Array.isArray(blogRes.data) ? blogRes.data.length : blogRes.data.results?.length || 0),
        services: servicesRes.data.count || (Array.isArray(servicesRes.data) ? servicesRes.data.length : servicesRes.data.results?.length || 0),
        contacts: contactsRes.data.count || (Array.isArray(contactsRes.data) ? contactsRes.data.length : contactsRes.data.results?.length || 0),
        testimonials: testimonialsRes.data.count || (Array.isArray(testimonialsRes.data) ? testimonialsRes.data.length : testimonialsRes.data.results?.length || 0),
        newsletter: newsletterRes.data.count || (Array.isArray(newsletterRes.data) ? newsletterRes.data.length : newsletterRes.data.results?.length || 0),
      });

      // Get recent contacts
      const contacts = contactsRes.data.results || contactsRes.data || [];
      setRecentContacts(contacts.slice(0, 5));

      // Get recent testimonials
      const testimonials = testimonialsRes.data.results || testimonialsRes.data || [];
      setRecentTestimonials(testimonials.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading or access denied
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Double check superuser status (in case user object hasn't loaded yet)
  if (user && user.is_superuser !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard. Only superusers can access this page.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Projects',
      value: stats.projects,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      adminUrl: 'http://localhost:8000/admin/projects/project/',
    },
    {
      title: 'Blog Posts',
      value: stats.blogPosts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      adminUrl: 'http://localhost:8000/admin/blog/blogpost/',
    },
    {
      title: 'Services',
      value: stats.services,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      adminUrl: 'http://localhost:8000/admin/services/service/',
    },
    {
      title: 'Contact Messages',
      value: stats.contacts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      adminUrl: 'http://localhost:8000/admin/contact/contactmessage/',
    },
    {
      title: 'Testimonials',
      value: stats.testimonials,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      adminUrl: 'http://localhost:8000/admin/testimonials/testimonial/',
    },
    {
      title: 'Newsletter',
      value: stats.newsletter,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      adminUrl: 'http://localhost:8000/admin/newsletter/newslettersubscription/',
    },
  ];

  const quickActions = [
    {
      title: 'Django Admin Panel',
      description: 'Full content management system',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: 'http://localhost:8000/admin/',
      external: true,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'About Us',
      description: 'Manage About Us content',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: 'http://localhost:8000/admin/about/aboutus/',
      external: true,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'View Website',
      description: 'Preview your live site',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      link: '/',
      external: false,
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between fade-in">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administration Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all your content and platform settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.link}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white mb-4 transform group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Content Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
              <a
                key={index}
                href={stat.adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <svg className={`w-4 h-4 ${stat.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-600">{stat.title}</div>
                <div className="mt-2 text-xs text-gray-500">Click to manage in admin</div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contact Messages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Contact Messages</h3>
              <a
                href="http://localhost:8000/admin/contact/contactmessage/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </a>
            </div>
            {recentContacts.length > 0 ? (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <div key={contact.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{contact.subject || contact.message}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent messages</p>
            )}
          </div>

          {/* Recent Testimonials */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Testimonials</h3>
              <a
                href="http://localhost:8000/admin/testimonials/testimonial/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </a>
            </div>
            {recentTestimonials.length > 0 ? (
              <div className="space-y-3">
                {recentTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-gray-900 mr-2">{testimonial.name}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{testimonial.testimonial}</p>
                        {!testimonial.is_approved && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pending Approval</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent testimonials</p>
            )}
          </div>
        </div>

        {/* Admin Links Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Panel Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="http://localhost:8000/admin/projects/project/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
            >
              <div className="text-blue-600 font-semibold">Projects</div>
            </a>
            <a
              href="http://localhost:8000/admin/blog/blogpost/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
            >
              <div className="text-green-600 font-semibold">Blog Posts</div>
            </a>
            <a
              href="http://localhost:8000/admin/services/service/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
            >
              <div className="text-purple-600 font-semibold">Services</div>
            </a>
            <a
              href="http://localhost:8000/admin/about/aboutus/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors"
            >
              <div className="text-orange-600 font-semibold">About Us</div>
            </a>
            <a
              href="http://localhost:8000/admin/contact/contactmessage/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-pink-50 hover:bg-pink-100 rounded-lg text-center transition-colors"
            >
              <div className="text-pink-600 font-semibold">Messages</div>
            </a>
            <a
              href="http://localhost:8000/admin/testimonials/testimonial/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors"
            >
              <div className="text-indigo-600 font-semibold">Testimonials</div>
            </a>
            <a
              href="http://localhost:8000/admin/newsletter/newslettersubscription/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg text-center transition-colors"
            >
              <div className="text-teal-600 font-semibold">Newsletter</div>
            </a>
            <a
              href="http://localhost:8000/admin/users/customuser/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="text-gray-600 font-semibold">Users</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

