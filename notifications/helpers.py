"""Shared helpers for in-app notification signals."""
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

# Stores pre-save snapshots: (ModelClass, pk) -> instance
_OLD_INSTANCES = {}


def remember_old_instance(sender, instance):
    """Call from pre_save to capture the row before it is updated."""
    if not instance.pk:
        return
    try:
        _OLD_INSTANCES[(sender, instance.pk)] = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        pass


def pop_old_instance(sender, instance):
    """Return and remove the pre-save snapshot for this instance."""
    return _OLD_INSTANCES.pop((sender, instance.pk), None)


def quote_owner_user(quote):
    """Resolve the auth user who owns a quote."""
    if quote.client_id and quote.client.user_id:
        return quote.client.user
    if quote.client_email:
        return User.objects.filter(email__iexact=quote.client_email).first()
    return None


def client_user(client):
    if client and getattr(client, 'user_id', None):
        return client.user
    return None


def staff_users():
    return User.objects.filter(is_active=True).filter(Q(is_staff=True) | Q(is_superuser=True))


def project_client_user(project):
    if project and project.client_id:
        return client_user(project.client)
    return None


def quote_label(quote):
    return quote.project_title or f'Quote #{quote.pk}'


def truncate_message(text, max_len=255):
    text = (text or '').strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + '…'
