from .models import InAppNotification


def notify_user(user, *, title, message, event_type, link=''):
    """Create an in-app notification for a user."""
    if not user or not getattr(user, 'pk', None):
        return None
    return InAppNotification.objects.create(
        user=user,
        title=title,
        message=message,
        event_type=event_type,
        link=link or '',
    )
