/**
 * Root component: auth context, router, and route definitions.
 *
 * ACCESS CONTROL:
 * - Public (no auth): home, login, register, about, projects, services, contact,
 *   pricing, request-quote, quote-success. Unauthenticated users see only these.
 * - Profile & history (auth required): /profile, /portal, /my-projects, /blog,
 *   /clients, /case-studies, /search. Redirect to /login if not authenticated.
 * - Admin (superuser): all /admin/* routes. Non-superusers redirect to /profile.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Projects from './pages/Projects';
import Services from './pages/Services';
import Contact from './pages/Contact';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjects from './pages/admin/AdminProjects';
import AdminBlog from './pages/admin/AdminBlog';
import AdminServices from './pages/admin/AdminServices';
import AdminContact from './pages/admin/AdminContact';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminQuotes from './pages/admin/AdminQuotes';
import AdminMessagingThreads from './pages/admin/AdminMessagingThreads';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminUsers from './pages/admin/AdminUsers';
import AdminClients from './pages/admin/AdminClients';
import AdminClientProjects from './pages/admin/AdminClientProjects';
import AdminCaseStudies from './pages/admin/AdminCaseStudies';
import AdminAbout from './pages/admin/AdminAbout';
import AdminFinancialDashboard from './pages/admin/AdminFinancialDashboard';
import AdminTasks from './pages/admin/AdminTasks';
import Pricing from './pages/Pricing';
import Quotes from './pages/Quotes';
import Requirements from './pages/Requirements';
import QuoteSuccess from './pages/QuoteSuccess';
import TermsAndPrivacy from './pages/TermsAndPrivacy';
import NewsletterPage from './pages/NewsletterPage';
import SearchResults from './pages/SearchResults';
import ProjectDetail from './pages/ProjectDetail';
import BlogDetail from './pages/BlogDetail';
import ServiceDetail from './pages/ServiceDetail';
import Clients from './pages/Clients';
import CaseStudies from './pages/CaseStudies';
import PublicProjects from './pages/PublicProjects';
import ClientProjects from './pages/ClientProjects';
import ClientPortal from './pages/ClientPortal';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Files from './pages/Files';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import ProposalDetail from './pages/ProposalDetail';
import ActivityLog from './pages/ActivityLog';
import Messages from './pages/Messages';
import ThreadChat from './pages/ThreadChat';
import './App.css';

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full flex-col overflow-x-hidden app-background">
      {!isAdminRoute && <Navbar />}
      <main className={`flex w-full min-w-0 flex-1 flex-col min-h-0 ${isAdminRoute ? 'min-h-screen' : ''}`}>
        <Routes>
              {/* ========== PUBLIC PAGES (no authentication) ========== */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/requirements" element={<Requirements />} />
              <Route path="/request-quote" element={<Quotes />} />
              <Route path="/quote-success" element={<QuoteSuccess />} />
              <Route path="/terms-and-privacy" element={<TermsAndPrivacy />} />
              <Route path="/newsletter" element={<NewsletterPage />} />
              <Route path="/public-projects" element={<PublicProjects />} />
              <Route path="/client-projects" element={<PublicProjects />} />

              {/* ========== PROFILE (main hub) & CLIENT PORTAL (authentication required) ========== */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requireAuth={true} forbidSuperuser={true}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal"
                element={
                  <ProtectedRoute requireAuth={true} forbidSuperuser={true}>
                    <ClientPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:quoteId"
                element={
                  <ProtectedRoute requireAuth={true} forbidSuperuser={true}>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route path="/files" element={<ProtectedRoute requireAuth={true} forbidSuperuser={true}><Files /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute requireAuth={true} forbidSuperuser={true}><Tasks /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute requireAuth={true} forbidSuperuser={true}><Calendar /></ProtectedRoute>} />
              <Route
                path="/proposal/:id"
                element={
                  <ProtectedRoute requireAuth={true} forbidSuperuser={true}>
                    <ProposalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-projects"
                element={
                  <ProtectedRoute requireAuth={true} forbidSuperuser={true}>
                    <ClientProjects />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
              <Route path="/activity-log" element={<ProtectedRoute requireAuth={true}><ActivityLog /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute requireAuth={true}><Messages /></ProtectedRoute>} />
              <Route path="/messages/:threadId" element={<ProtectedRoute requireAuth={true}><ThreadChat /></ProtectedRoute>} />
              <Route path="/blog" element={<ProtectedRoute requireAuth={true}><Blog /></ProtectedRoute>} />
              <Route path="/blog/:id" element={<ProtectedRoute requireAuth={true}><BlogDetail /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute requireAuth={true}><SearchResults /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute requireAuth={true}><Clients /></ProtectedRoute>} />
              <Route path="/case-studies" element={<ProtectedRoute requireAuth={true}><CaseStudies /></ProtectedRoute>} />

              {/* ========== ADMIN DASHBOARD (superuser only) ========== */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/projects" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminProjects />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/services" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminServices />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/contact" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminContact />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/testimonials" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminTestimonials />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/newsletter" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminNewsletter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/messaging-threads" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminMessagingThreads />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quotes" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminQuotes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/invoices" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminInvoices />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/financial" 
                element={
                  <ProtectedRoute requireStaffOrSuperuser={true}>
                    <AdminFinancialDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tasks" 
                element={
                  <ProtectedRoute requireStaffOrSuperuser={true}>
                    <AdminTasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/clients" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminClients />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/client-projects" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminClientProjects />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/case-studies" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminCaseStudies />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/about" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminAbout />
                  </ProtectedRoute>
                } 
              />
              {/* Legacy route - same as /request-quote */}
            <Route path="/quotes" element={<Quotes />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
