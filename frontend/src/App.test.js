import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockRejectedValue(new Error('No token')),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  getMediaUrl: (url) => url,
}));

// Ensure no stored tokens so AuthProvider resolves quickly
beforeEach(() => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
});

test('renders app with home content', async () => {
  render(<App />);
  const logo = await screen.findByAltText('PathyCode logo');
  expect(logo).toBeInTheDocument();
});

test('renders main navigation', async () => {
  render(<App />);
  const loginLink = await screen.findByRole('link', { name: /^sign in$/i });
  expect(loginLink).toHaveAttribute('href', '/login');
});
