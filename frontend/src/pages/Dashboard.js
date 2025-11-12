import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    blogPosts: 0,
    services: 0,
    contacts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [isAuthenticated, navigate]);

  const fetchStats = async () => {
    try {
      const [projectsRes, blogRes, servicesRes, contactsRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/blog/'),
        api.get('/services/'),
        api.get('/contact/'),
      ]);

      setStats({
        projects: projectsRes.data.count || projectsRes.data.length || 0,
        blogPosts: blogRes.data.count || blogRes.data.length || 0,
        services: servicesRes.data.count || servicesRes.data.length || 0,
        contacts: contactsRes.data.count || contactsRes.data.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      link: '/projects',
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
      link: '/blog',
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
      link: '/services',
    },
    {
      title: 'Contacts',
      value: stats.contacts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      link: '/contact',
    },
  ];

  const quickActions = [
    {
      title: 'Add Project',
      description: 'Create a new project',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      link: '/projects',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Write Post',
      description: 'Create a new blog post',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      link: '/blog',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Manage Services',
      description: 'Update your services',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: '/services',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'View Messages',
      description: 'Check contact messages',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      link: '/contact',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between fade-in">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's an overview of your account and platform activity
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="card-professional p-6 fade-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-600">{stat.title}</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 mb-8 fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white mb-4 transform group-hover:scale-110 transition-transform shadow-lg`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Full Name</label>
              <p className="text-lg font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Email</label>
              <p className="text-lg font-medium text-gray-900">{user?.email}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Member Since</label>
              <p className="text-lg font-medium text-gray-900">
                {user?.date_joined 
                  ? new Date(user.date_joined).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Username</label>
              <p className="text-lg font-medium text-gray-900">{user?.username || 'N/A'}</p>
            </div>
          </div>
          {user?.bio && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Bio</label>
              <p className="text-gray-900">{user.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
