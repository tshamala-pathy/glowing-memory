import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjects from './pages/admin/AdminProjects';
import AdminBlog from './pages/admin/AdminBlog';
import AdminServices from './pages/admin/AdminServices';
import AdminContact from './pages/admin/AdminContact';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminQuotes from './pages/admin/AdminQuotes';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminUsers from './pages/admin/AdminUsers';
import Pricing from './pages/Pricing';
import Quotes from './pages/Quotes';
import SearchResults from './pages/SearchResults';
import ProjectDetail from './pages/ProjectDetail';
import BlogDetail from './pages/BlogDetail';
import ServiceDetail from './pages/ServiceDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
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
                path="/admin/users" 
                element={
                  <ProtectedRoute requireSuperuser={true}>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/search" element={<SearchResults />} />
              <Route 
                path="/quotes" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Quotes />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
