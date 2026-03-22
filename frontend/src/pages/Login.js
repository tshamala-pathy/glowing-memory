import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LOGIN_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      const loggedInUser = result.user;
      if (loggedInUser?.is_superuser) {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Image panel - hidden on small screens, shown from md up */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden">
        <img
          src={LOGIN_IMAGE}
          alt="Modern workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-slate-900/90" />
        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14 text-white">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/pathycode-logo.png"
              alt="PathyCode"
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold tracking-tight">PathyCode</span>
          </Link>
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Build your digital presence
            </h2>
            <p className="text-slate-200 text-lg max-w-md leading-relaxed">
              Sign in to access your projects, quotes, and client portal. We help businesses grow with modern digital solutions.
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Trusted by professionals · Secure & reliable
          </p>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center px-6 sm:px-10 py-12 bg-slate-50 lg:bg-white">
        {/* Mobile: compact image banner + logo */}
        <div className="md:hidden mb-8">
          <div className="relative h-40 rounded-2xl overflow-hidden mb-6">
            <img src={LOGIN_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <Link to="/" className="inline-flex items-center gap-2 text-white">
                <img src="/pathycode-logo.png" alt="" className="h-8 w-auto drop-shadow-lg" />
                <span className="text-lg font-bold">PathyCode</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Welcome back
            </h1>
            <p className="text-slate-600">
              Sign in to your account to continue
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg sm:shadow-xl border border-slate-100 p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500 mb-4">New to PathyCode?</p>
              <Link
                to="/register"
                className="block w-full py-3 px-4 text-center border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Create an account
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-xs sm:text-sm text-slate-500">
            By signing in, you agree to our{' '}
            <Link to="/terms-and-privacy#terms-of-service" className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/terms-and-privacy#privacy-policy" className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
