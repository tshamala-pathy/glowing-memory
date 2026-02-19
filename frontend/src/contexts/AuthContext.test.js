import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock api
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

const TestConsumer = () => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <button onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });

  it('provides loading then user null when no token', async () => {
    mockGet.mockRejectedValue(new Error('No token'));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('login stores tokens and updates user on success', async () => {
    mockPost.mockResolvedValue({ data: { access: 'access', refresh: 'refresh' } });
    mockGet.mockResolvedValue({ data: { id: 1, email: 'user@test.com', is_superuser: false } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      screen.getByText('Login').click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockPost).toHaveBeenCalledWith('/users/login/', {
      email: 'test@test.com',
      password: 'pass',
    });
    expect(localStorage.getItem('access_token')).toBe('access');
    expect(localStorage.getItem('refresh_token')).toBe('refresh');
    expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
  });

  it('logout clears tokens and user', async () => {
    mockGet.mockRejectedValue(new Error('No token'));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    localStorage.setItem('access_token', 'fake');
    localStorage.setItem('refresh_token', 'fake');
    await act(async () => {
      screen.getByText('Logout').click();
    });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });
});
