// Mock axios so api.js can load (it uses ESM in node_modules)
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: jest.fn(),
      post: jest.fn(),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    }),
  },
}));

import { getMediaUrl } from './api';

describe('getMediaUrl', () => {
  it('returns null for null or undefined', () => {
    expect(getMediaUrl(null)).toBe(null);
    expect(getMediaUrl(undefined)).toBe(null);
  });

  it('returns null for non-string', () => {
    expect(getMediaUrl(123)).toBe(null);
    expect(getMediaUrl({})).toBe(null);
  });

  it('returns full http URL as-is when no 0.0.0.0', () => {
    const url = 'http://example.com/media/image.jpg';
    expect(getMediaUrl(url)).toBe(url);
  });

  it('returns full https URL as-is when no 0.0.0.0', () => {
    const url = 'https://example.com/media/image.jpg';
    expect(getMediaUrl(url)).toBe(url);
  });

  it('replaces 0.0.0.0 with localhost in full URL', () => {
    expect(getMediaUrl('http://0.0.0.0:8000/media/image.jpg')).toBe(
      'http://localhost:8000/media/image.jpg'
    );
    expect(getMediaUrl('https://0.0.0.0:8000/media/image.jpg')).toBe(
      'https://localhost:8000/media/image.jpg'
    );
  });

  it('prepends base URL to relative path', () => {
    const result = getMediaUrl('/media/uploads/image.jpg');
    expect(result).toMatch(/^http:\/\//);
    expect(result).toContain('/media/uploads/image.jpg');
  });

  it('handles relative path without leading slash', () => {
    const result = getMediaUrl('media/image.jpg');
    expect(result).toMatch(/^http:\/\//);
    expect(result).toContain('media/image.jpg');
  });
});
