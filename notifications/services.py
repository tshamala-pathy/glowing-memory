from .helpers import staff_users
from .models import InAppNotification


def notify_user(user, *, title, message, event_type, link=''):
    """Create an in-app notification for a user."""
    if not user or not getattr(user, 'pk', None):
        return None
    return InAppNotification.objects.create(
        user=user,
        title=title,
        message=message[:255],
        event_type=event_type,
        link=link or '',
    )


def notify_users(users, *, title, message, event_type, link=''):
    """Notify multiple users (skips duplicates and invalid users)."""
    seen = set()
    created = []
    for user in users:
        if not user or not getattr(user, 'pk', None) or user.pk in seen:
            continue
        seen.add(user.pk)
        n = notify_user(user, title=title, message=message, event_type=event_type, link=link)
        if n:
            created.append(n)
    return created


def notify_staff(*, title, message, event_type, link='/admin'):
    """Notify all active staff users."""
    return notify_users(staff_users(), title=title, message=message, event_type=event_type, link=link)


def mark_link_notifications_read(user, link, *, event_types=None, limit=None):
    """Mark unread notifications for a user matching link (and optional event types)."""
    if not user or not getattr(user, 'pk', None) or not link:
        return 0
    qs = InAppNotification.objects.filter(user=user, link=link, is_read=False)
    if event_types:
        qs = qs.filter(event_type__in=event_types)
    if limit is not None:
        pks = list(qs.order_by('-created_at').values_list('pk', flat=True)[: max(1, int(limit))])
        if not pks:
            return 0
        return InAppNotification.objects.filter(pk__in=pks).update(is_read=True)
    return qs.update(is_read=True)


def mark_notification_read(user, notification_id):
    """Mark a single notification as read."""
    if not user or not notification_id:
        return 0
    return InAppNotification.objects.filter(user=user, pk=notification_id, is_read=False).update(is_read=True)


def mark_message_thread_notifications_read(user, thread_id, *, notification_id=None):
    """Mark message notification(s) read when the user opens a thread."""
    link = f'/messages/{thread_id}'
    if notification_id:
        return mark_notification_read(user, notification_id)
    return mark_link_notifications_read(
        user,
        link,
        event_types=[
            InAppNotification.EVENT_NEW_MESSAGE,
            InAppNotification.EVENT_THREAD_CREATED,
        ],
        limit=1,
    )


def delete_notifications(user, *, ids=None, delete_all=False):
    """Delete notifications for a user. Returns number of rows removed."""
    if not user or not getattr(user, 'pk', None):
        return 0
    qs = InAppNotification.objects.filter(user=user)
    if delete_all:
        deleted, _ = qs.delete()
        return deleted
    if not ids:
        return 0
    normalized_ids = []
    for pk in ids:
        try:
            normalized_ids.append(int(pk))
        except (TypeError, ValueError):
            continue
    if not normalized_ids:
        return 0
    deleted, _ = qs.filter(pk__in=normalized_ids).delete()
    return deleted
