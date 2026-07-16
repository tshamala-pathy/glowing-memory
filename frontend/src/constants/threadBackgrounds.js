/**
 * Thread appearance presets (sidebar cover + chat wallpaper).
 *
 * Preset ids must stay in sync with messaging/backgrounds.py on the backend.
 * Cover and wallpaper are independent — changing one does not affect the other.
 */

export const MAX_THREAD_IMAGE_BYTES = 5 * 1024 * 1024;

/** High-resolution hero photos for the left sidebar cover. */
export const THREAD_COVER_PRESETS = [
  {
    id: 'workspace',
    label: 'Workspace',
    url: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'collaboration',
    label: 'Team meeting',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'creative',
    label: 'Creative studio',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'minimal',
    label: 'Minimal office',
    url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=90',
  },
];

/** Tiled textures for the chat message area (WhatsApp-style). */
export const THREAD_WALLPAPER_PRESETS = [
  {
    id: 'workspace',
    label: 'Classic',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=85',
    repeat: true,
    tileSize: '400px',
  },
  {
    id: 'collaboration',
    label: 'Sky',
    url: 'https://images.unsplash.com/photo-1557683311-eac9222aa4b8?auto=format&fit=crop&w=800&q=85',
    repeat: true,
    tileSize: '400px',
  },
  {
    id: 'creative',
    label: 'Sunset',
    url: 'https://images.unsplash.com/photo-1579546929518-9fa3963792a0?auto=format&fit=crop&w=800&q=85',
    repeat: true,
    tileSize: '400px',
  },
  {
    id: 'minimal',
    label: 'Sage',
    url: 'https://images.unsplash.com/photo-1557682250-033bd709f09a?auto=format&fit=crop&w=800&q=85',
    repeat: true,
    tileSize: '400px',
  },
];

const DEFAULT_PRESET_ID = 'workspace';

export const resolveCoverUrl = (thread) =>
  thread?.background_display_url ||
  THREAD_COVER_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)?.url ||
  THREAD_COVER_PRESETS[0].url;

export const resolveWallpaperUrl = (thread) =>
  thread?.wallpaper_display_url ||
  THREAD_WALLPAPER_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)?.url ||
  THREAD_WALLPAPER_PRESETS[0].url;

/** Returns 'custom' or the active preset id for cover or wallpaper. */
export const getActivePresetId = (thread, kind) => {
  if (kind === 'cover') {
    return thread?.has_custom_background ? 'custom' : thread?.background_preset || DEFAULT_PRESET_ID;
  }
  return thread?.has_custom_wallpaper ? 'custom' : thread?.wallpaper_preset || DEFAULT_PRESET_ID;
};

/**
 * Chat wallpaper render config.
 * Custom uploads use a full-bleed image; presets tile behind messages.
 */
export const resolveChatWallpaperStyle = (thread) => {
  if (thread?.has_custom_wallpaper) {
    return { mode: 'image', imageUrl: resolveWallpaperUrl(thread) };
  }

  const presetId = thread?.wallpaper_preset || DEFAULT_PRESET_ID;
  const preset =
    THREAD_WALLPAPER_PRESETS.find((p) => p.id === presetId) || THREAD_WALLPAPER_PRESETS[0];

  return {
    mode: 'pattern',
    backgroundImage: `url("${preset.url}")`,
    backgroundSize: preset.tileSize || '400px',
    backgroundRepeat: preset.repeat ? 'repeat' : 'no-repeat',
    backgroundPosition: 'top left',
  };
};

/** Validates a file input selection; returns an error message or null. */
export const validateThreadImageFile = (file) => {
  if (!file) return null;
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file (PNG, JPG, WebP, etc.).';
  }
  if (file.size > MAX_THREAD_IMAGE_BYTES) {
    return 'Image must be 5 MB or smaller.';
  }
  return null;
};
