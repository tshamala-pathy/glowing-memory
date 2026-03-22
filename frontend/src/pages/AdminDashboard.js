import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/admin/AdminLayout';

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
    messageThreads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentContacts, setRecentContacts] = useState([]);
  const [recentTestimonials, setRecentTestimonials] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/profile');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, blogRes, servicesRes, contactsRes, testimonialsRes, newsletterRes, threadsRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/blog/'),
        api.get('/services/'),
        api.get('/contact/'),
        api.get('/testimonials/'),
        api.get('/newsletter/subscriptions/').catch(() => ({ data: [] })),
        api.get('/messaging/threads/').catch(() => ({ data: [] })),
      ]);

      const getCount = (res) => {
        const d = res?.data;
        if (typeof d?.count === 'number') return d.count;
        if (Array.isArray(d)) return d.length;
        if (Array.isArray(d?.results)) return d.results.length;
        return 0;
      };

      setStats({
        projects: getCount(projectsRes),
        blogPosts: getCount(blogRes),
        services: getCount(servicesRes),
        contacts: getCount(contactsRes),
        testimonials: getCount(testimonialsRes),
        newsletter: getCount(newsletterRes),
        messageThreads: getCount(threadsRes),
      });

      const contacts = contactsRes.data?.results ?? contactsRes.data ?? [];
      const testimonials = testimonialsRes.data?.results ?? testimonialsRes.data ?? [];
      setRecentContacts(Array.isArray(contacts) ? contacts.slice(0, 5) : []);
      setRecentTestimonials(Array.isArray(testimonials) ? testimonials.slice(0, 5) : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (user && user.is_superuser !== true) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600 mb-6 text-sm">
              Only superusers can access the admin dashboard.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { title: 'Projects', value: stats.projects, path: '/admin/projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'teal' },
    { title: 'Blog Posts', value: stats.blogPosts, path: '/admin/blog', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'cyan' },
    { title: 'Services', value: stats.services, path: '/admin/services', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6', color: 'fuchsia' },
    { title: 'Contact Messages', value: stats.contacts, path: '/admin/contact', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'orange' },
    { title: 'Testimonials', value: stats.testimonials, path: '/admin/testimonials', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', color: 'pink' },
    { title: 'Newsletter', value: stats.newsletter, path: '/admin/newsletter', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'lime' },
    { title: 'Message Threads', value: stats.messageThreads, path: '/admin/messaging-threads', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', color: 'blue' },
  ];

  const colorClasses = {
    teal: { bg: 'bg-teal-100', text: 'text-teal-800', icon: 'text-teal-600' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: 'text-cyan-600' },
    fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', icon: 'text-fuchsia-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-800', icon: 'text-pink-600' },
    lime: { bg: 'bg-lime-100', text: 'text-lime-800', icon: 'text-lime-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
  };

  return (
    <AdminLayout>
      <div className="space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-6 sm:p-8 lg:p-10 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2.5 bg-white/20 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-base">
                Welcome back, {user?.first_name || user?.username || 'Admin'}. Here&apos;s your overview.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="self-start sm:self-center px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="rounded-2xl bg-slate-100 p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statCards.map((stat, i) => {
              const c = colorClasses[stat.color] || colorClasses.slate;
              return (
                <Link
                  key={i}
                  to={stat.path}
                  className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                      </svg>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-600 mt-0.5">{stat.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contact Messages */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Contact Messages</h3>
              <Link
                to="/admin/contact"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="p-5">
              {recentContacts.length > 0 ? (
                <div className="space-y-3">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                          <p className="text-sm text-slate-600 truncate">{contact.email}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{contact.subject || contact.message}</p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No recent messages</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Testimonials */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Testimonials</h3>
              <Link
                to="/admin/testimonials"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="p-5">
              {recentTestimonials.length > 0 ? (
                <div className="space-y-3">
                  {recentTestimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-900">{testimonial.name}</p>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < (testimonial.rating ?? 0) ? 'text-amber-400' : 'text-slate-200'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{testimonial.testimonial || testimonial.content}</p>
                          {!testimonial.is_approved && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-lg">
                              Pending
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(testimonial.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No recent testimonials</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
