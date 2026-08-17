import { getBackendOrigin } from './backendOrigin';

describe('getBackendOrigin', () => {
  const originalEnv = process.env.REACT_APP_BACKEND_URL;
  const originalLocation = window.location;

  afterEach(() => {
    process.env.REACT_APP_BACKEND_URL = originalEnv;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  const mockLocation = ({ hostname, origin, port }) => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname, origin, port },
    });
  };

  it('uses REACT_APP_BACKEND_URL when set', () => {
    process.env.REACT_APP_BACKEND_URL = 'https://api.example.com/';
    expect(getBackendOrigin()).toBe('https://api.example.com');
  });

  it('uses Django on :8000 when running on the CRA dev server', () => {
    process.env.REACT_APP_BACKEND_URL = '';
    mockLocation({
      hostname: 'localhost',
      origin: 'http://localhost:3000',
      port: '3000',
    });
    expect(getBackendOrigin()).toBe('http://localhost:8000');
  });

  it('uses same-origin for nginx production on localhost', () => {
    process.env.REACT_APP_BACKEND_URL = '';
    mockLocation({
      hostname: 'localhost',
      origin: 'http://localhost',
      port: '',
    });
    expect(getBackendOrigin()).toBe('http://localhost');
  });

  it('uses same-origin for deployed hosts', () => {
    process.env.REACT_APP_BACKEND_URL = '';
    mockLocation({
      hostname: 'pathycode.example',
      origin: 'https://pathycode.example',
      port: '',
    });
    expect(getBackendOrigin()).toBe('https://pathycode.example');
  });
});
