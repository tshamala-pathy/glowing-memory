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


def invoice_owner_user(invoice):
    """Resolve the auth user linked to an invoice (via quote, client, or email)."""
    if invoice.quote_id:
        user = quote_owner_user(invoice.quote)
        if user:
            return user
    if invoice.client_id and invoice.client.user_id:
        return invoice.client.user
    if invoice.client_email:
        return User.objects.filter(email__iexact=invoice.client_email).first()
    return None


def client_user(client):
    """
    Resolve the auth user linked to a client profile.

    Args:
        client: ``clients.Client`` instance or ``None``.

    Returns:
        User | None: The client's ``user``, or ``None`` when unlinked.
    """
    if client and getattr(client, 'user_id', None):
        return client.user
    return None


def staff_users():
    """
    Active staff and superuser accounts for broadcast notifications.

    Returns:
        QuerySet: ``User`` queryset filtered to ``is_staff`` or ``is_superuser``.
    """
    return User.objects.filter(is_active=True).filter(Q(is_staff=True) | Q(is_superuser=True))


def project_client_user(project):
    """
    Resolve the client portal user for a project.

    Args:
        project: ``clients.Project`` instance or ``None``.

    Returns:
        User | None: Auth user for ``project.client``, if any.
    """
    if project and project.client_id:
        return client_user(project.client)
    return None


def quote_label(quote):
    """
    Human-readable label for a quote in notification copy.

    Args:
        quote: ``quotes.Quote`` instance.

    Returns:
        str: ``project_title`` when set, otherwise ``Quote #<pk>``.
    """
    return quote.project_title or f'Quote #{quote.pk}'


def truncate_message(text, max_len=255):
    """
    Trim notification body text to fit database/display limits.

    Args:
        text (str): Raw message text.
        max_len (int): Maximum character length (default 255).

    Returns:
        str: Trimmed text with an ellipsis when truncated.
    """
    text = (text or '').strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + '…'


def notify_invoice_payment_reminder(invoice):
    """In-app notification when staff sends an invoice payment reminder."""
    from .models import InAppNotification
    from .services import notify_user

    user = invoice_owner_user(invoice)
    if not user:
        return None
    due_label = (
        invoice.due_date.strftime('%b %d, %Y')
        if invoice.due_date
        else 'as soon as possible'
    )
    return notify_user(
        user,
        title='Payment reminder',
        message=truncate_message(
            f'Invoice {invoice.invoice_number}: R {invoice.amount_due:.2f} due {due_label}. '
            'Complete payment so we can proceed with your project.'
        ),
        event_type=InAppNotification.EVENT_INVOICE_PAYMENT_REMINDER,
        link='/profile',
    )


def notify_quote_payment_reminder(quote):
    """In-app notification when staff sends a quote payment reminder."""
    from .models import InAppNotification
    from .services import notify_user

    user = quote_owner_user(quote)
    if not user:
        return None
    amount = quote.estimated_amount or 0
    label = quote.project_title or f'Quote #{quote.pk}'
    return notify_user(
        user,
        title='Payment required',
        message=truncate_message(
            f'Your quote "{label}" (R {amount:.2f}) is approved. '
            'Complete payment to start your project.'
        ),
        event_type=InAppNotification.EVENT_QUOTE_PAYMENT_REMINDER,
        link=f'/payment/{quote.pk}',
    )
