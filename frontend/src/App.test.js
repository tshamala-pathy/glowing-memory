import { render, screen } from '@testing-library/react';
import App from './App';

// Ensure no stored tokens so AuthProvider resolves quickly
beforeEach(() => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
});

test('renders app with home content', async () => {
  render(<App />);
  // Home page or navbar shows brand name
  const brand = await screen.findByText(/PathyCode/i);
  expect(brand).toBeInTheDocument();
});

test('renders main navigation', async () => {
  render(<App />);
  // Navbar is present (contains link to home or login)
  const loginLink = await screen.findByRole('link', { name: /sign in|login/i });
  expect(loginLink).toBeInTheDocument();
});
