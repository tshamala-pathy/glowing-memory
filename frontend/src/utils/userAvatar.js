import { getMediaUrl } from '../services/api';

/** Profile photo URL from auth user object (avatar_url or avatar path). */
export function getUserAvatarUrl(user) {
  if (!user) return null;
  return user.avatar_url || getMediaUrl(user.avatar) || null;
}

/** Photo shown on a testimonial card (API image already includes profile fallback). */
export function getTestimonialAvatarUrl(testimonial, fallbackUser) {
  if (!testimonial) return getUserAvatarUrl(fallbackUser);
  return testimonial.image || testimonial.client_avatar_url || getUserAvatarUrl(fallbackUser) || null;
}

export function getInitials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return source.charAt(0).toUpperCase();
}
