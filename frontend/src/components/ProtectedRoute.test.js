import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test', route);
    return render(
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
    });
    renderWithRouter(
      <ProtectedRoute requireAuth={true}>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to login when requireAuth and not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    renderWithRouter(
      <ProtectedRoute requireAuth={true}>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when requireAuth and authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'user@test.com' },
      isAuthenticated: true,
      loading: false,
    });
    renderWithRouter(
      <ProtectedRoute requireAuth={true}>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects when requireSuperuser and user is not superuser', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_superuser: false },
      isAuthenticated: true,
      loading: false,
    });
    renderWithRouter(
      <ProtectedRoute requireSuperuser={true}>
        <div>Admin content</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('renders children when requireSuperuser and user is superuser', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_superuser: true },
      isAuthenticated: true,
      loading: false,
    });
    renderWithRouter(
      <ProtectedRoute requireSuperuser={true}>
        <div>Admin content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('renders children when neither requireAuth nor requireSuperuser', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    renderWithRouter(
      <ProtectedRoute>
        <div>Public wrapper content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Public wrapper content')).toBeInTheDocument();
  });
});
