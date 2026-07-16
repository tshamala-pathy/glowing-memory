"""Shared media URL helpers for user-related serializers."""
from django.conf import settings


def absolute_url_path(request, path):
    """Build an absolute URL for a media or API path."""
    if not path:
        return None
    if path.startswith(('http://', 'https://')):
        return path
    if not path.startswith('/'):
        path = '/' + path
    if request:
        return request.build_absolute_uri(path)
    base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
    return f'{base}{path}'


def absolute_media_url(request, file_field):
    if not file_field:
        return None
    try:
        path = file_field.url
    except (ValueError, AttributeError):
        return None
    return absolute_url_path(request, path)
