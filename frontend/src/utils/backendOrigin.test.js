import { getBackendOrigin } from './backendOrigin';

describe('getBackendOrigin', () => {
  const originalEnv = process.env.REACT_APP_BACKEND_URL;

  afterEach(() => {
    process.env.REACT_APP_BACKEND_URL = originalEnv;
  });

  it('uses REACT_APP_BACKEND_URL when set', () => {
    process.env.REACT_APP_BACKEND_URL = 'https://api.example.com/';
    expect(getBackendOrigin()).toBe('https://api.example.com');
  });

  it('falls back to localhost in development', () => {
    process.env.REACT_APP_BACKEND_URL = '';
    expect(getBackendOrigin()).toBe('http://localhost:8000');
  });
});
