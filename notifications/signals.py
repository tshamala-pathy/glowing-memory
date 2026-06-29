from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import InAppNotification
from .services import notify_user


def _quote_owner_user(quote):
    if quote.client_id and quote.client.user_id:
        return quote.client.user
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if quote.client_email:
        return User.objects.filter(email__iexact=quote.client_email).first()
    return None


@receiver(post_save, sender='quotes.Quote')
def notify_quote_reviewed(sender, instance, created, **kwargs):
    if created:
        return
    if instance.status not in ('replied', 'reviewed'):
        return
    user = _quote_owner_user(instance)
    if not user:
        return
    notify_user(
        user,
        title='Quote reviewed',
        message=f'Your quote "{instance.project_title or instance.id}" has been reviewed.',
        event_type=InAppNotification.EVENT_QUOTE_REVIEWED,
        link=f'/profile',
    )


@receiver(post_save, sender='payments.Payment')
def notify_payment_completed(sender, instance, **kwargs):
    if instance.payment_status != 'paid':
        return
    user = instance.user or (instance.client.user if instance.client_id else None)
    if not user:
        user = _quote_owner_user(instance.quote)
    if not user:
        return
    notify_user(
        user,
        title='Payment completed',
        message=f'Payment of {instance.amount} {instance.currency.upper()} received.',
        event_type=InAppNotification.EVENT_PAYMENT_COMPLETED,
        link='/portal',
    )


@receiver(post_save, sender='invoices.Invoice')
def notify_invoice_generated(sender, instance, created, **kwargs):
    if not created:
        return
    quote = instance.quote
    user = _quote_owner_user(quote) if quote else None
    if not user:
        return
    notify_user(
        user,
        title='Invoice generated',
        message=f'Invoice {instance.invoice_number} is ready.',
        event_type=InAppNotification.EVENT_INVOICE_GENERATED,
        link='/profile',
    )


@receiver(post_save, sender='messaging.Message')
def notify_new_message(sender, instance, created, **kwargs):
    if not created:
        return
    thread = instance.thread
    sender_user = instance.sender
    recipients = []
    if thread.client_id and thread.client.user_id:
        client_user = thread.client.user
        if not sender_user or sender_user.pk != client_user.pk:
            recipients.append(client_user)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if sender_user and (sender_user.is_staff or sender_user.is_superuser):
        pass
    else:
        for admin in User.objects.filter(is_staff=True, is_active=True):
            if sender_user and admin.pk == sender_user.pk:
                continue
            recipients.append(admin)
    project_name = thread.project.name if thread.project_id else 'project'
    for user in recipients:
        notify_user(
            user,
            title='New message',
            message=f'New message on {project_name}.',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
            link=f'/messages/{thread.id}',
        )
