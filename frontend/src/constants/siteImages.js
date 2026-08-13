/**
 * Local images from /public — reliable without external CDN or network.
 * Use publicAsset() so CRA PUBLIC_URL works in subpath deployments.
 */
const publicUrl = process.env.PUBLIC_URL || '';

export const publicAsset = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${publicUrl}${normalized}`;
};

export const SITE_IMAGES = {
  logo: publicAsset('/pathycode-logo.png'),
  logo192: publicAsset('/logo192.png'),
  fallback: publicAsset('/blog/hero-reading-learning.jpg'),
  contact: publicAsset('/contact-hero.jpg'),
  pricing: publicAsset('/pricing-hero.png'),
  backend: publicAsset('/backend-hero.png'),
  clientPortal: publicAsset('/client-portal-hero.png'),
  workspace: publicAsset('/blog/hero-writing-desk.jpg'),
  team: publicAsset('/blog/hero-writing-desk.jpg'),
  admin: publicAsset('/blog/hero-reading-learning.jpg'),
  blog: {
    heroMain: publicAsset('/blog/hero-reading-learning.jpg'),
    heroSide: publicAsset('/blog/hero-writing-desk.jpg'),
    footer: publicAsset('/blog/footer-more-insights.jpg'),
  },
  newsletter: {
    hero: publicAsset('/newsletter/hero-newsletter.jpg'),
    loop: publicAsset('/newsletter/loop-insights.jpg'),
  },
};

/** Rotating local placeholders when API media is missing. */
export const LOCAL_PLACEHOLDERS = [
  SITE_IMAGES.blog.heroMain,
  SITE_IMAGES.blog.heroSide,
  SITE_IMAGES.blog.footer,
  SITE_IMAGES.contact,
  SITE_IMAGES.pricing,
  SITE_IMAGES.backend,
];

export const placeholderAt = (index) =>
  LOCAL_PLACEHOLDERS[Math.abs(Number(index) || 0) % LOCAL_PLACEHOLDERS.length];
