"""
Preset images for message thread appearance.

Two independent layers:
- COVER_PRESETS: sharp hero photo on the sidebar (``background_*`` model fields).
- WALLPAPER_PRESETS: tiled/full wallpaper behind chat messages (``wallpaper_*`` fields).
"""

DEFAULT_COVER_PRESET = 'workspace'
DEFAULT_WALLPAPER_PRESET = 'workspace'
MAX_IMAGE_BYTES = 5 * 1024 * 1024

COVER_PRESETS = {
    'workspace': {
        'label': 'Workspace',
        'url': 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1200&q=90',
    },
    'collaboration': {
        'label': 'Team meeting',
        'url': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=90',
    },
    'creative': {
        'label': 'Creative studio',
        'url': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=90',
    },
    'minimal': {
        'label': 'Minimal office',
        'url': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=90',
    },
}

WALLPAPER_PRESETS = {
    'workspace': {
        'label': 'Classic',
        'url': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=85',
    },
    'collaboration': {
        'label': 'Sky',
        'url': 'https://images.unsplash.com/photo-1557683311-eac9222aa4b8?auto=format&fit=crop&w=800&q=85',
    },
    'creative': {
        'label': 'Sunset',
        'url': 'https://images.unsplash.com/photo-1579546929518-9fa3963792a0?auto=format&fit=crop&w=800&q=85',
    },
    'minimal': {
        'label': 'Sage',
        'url': 'https://images.unsplash.com/photo-1557682250-033bd709f09a?auto=format&fit=crop&w=800&q=85',
    },
}


def _absolute_media_url(url, request=None):
    from users.media_urls import absolute_url_path
    return absolute_url_path(request, url)


def resolve_cover_url(thread, request=None):
    """Sidebar cover photo URL (custom upload or preset)."""
    if thread.background_image:
        return _absolute_media_url(thread.background_image.url, request)
    preset = thread.background_preset or DEFAULT_COVER_PRESET
    return COVER_PRESETS.get(preset, COVER_PRESETS[DEFAULT_COVER_PRESET])['url']


def resolve_wallpaper_url(thread, request=None):
    """Chat box wallpaper URL (custom upload or preset)."""
    if thread.wallpaper_image:
        return _absolute_media_url(thread.wallpaper_image.url, request)
    preset = thread.wallpaper_preset or DEFAULT_WALLPAPER_PRESET
    return WALLPAPER_PRESETS.get(preset, WALLPAPER_PRESETS[DEFAULT_WALLPAPER_PRESET])['url']


def user_owns_thread_as_client(user, thread):
    profile = getattr(user, 'client_profile', None)
    return bool(profile and thread.client_id == profile.id)


def user_can_edit_thread_background(user, thread):
    """Client owner or staff/superuser admin may update cover and wallpaper."""
    if not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    return user_owns_thread_as_client(user, thread)
