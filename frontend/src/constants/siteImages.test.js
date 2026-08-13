import { LOCAL_PLACEHOLDERS, placeholderAt, publicAsset, SITE_IMAGES } from './siteImages';

describe('siteImages', () => {
  it('normalizes public asset paths', () => {
    expect(publicAsset('/pathycode-logo.png')).toBe('/pathycode-logo.png');
    expect(publicAsset('pathycode-logo.png')).toBe('/pathycode-logo.png');
  });

  it('exposes local logo and hero assets', () => {
    expect(SITE_IMAGES.logo).toBe('/pathycode-logo.png');
    expect(SITE_IMAGES.pricing).toBe('/pricing-hero.png');
    expect(SITE_IMAGES.backend).toBe('/backend-hero.png');
    expect(SITE_IMAGES.clientPortal).toBe('/client-portal-hero.png');
    expect(SITE_IMAGES.contact).toBe('/contact-hero.jpg');
    expect(SITE_IMAGES.blog.heroMain).toContain('/blog/');
    expect(SITE_IMAGES.newsletter.hero).toContain('/newsletter/');
  });

  it('rotates placeholders and handles invalid indexes', () => {
    expect(LOCAL_PLACEHOLDERS.length).toBeGreaterThan(0);
    expect(placeholderAt(0)).toBe(LOCAL_PLACEHOLDERS[0]);
    expect(placeholderAt(LOCAL_PLACEHOLDERS.length)).toBe(LOCAL_PLACEHOLDERS[0]);
    expect(placeholderAt(-1)).toBe(LOCAL_PLACEHOLDERS[1]);
    expect(placeholderAt('x')).toBe(LOCAL_PLACEHOLDERS[0]);
  });
});
