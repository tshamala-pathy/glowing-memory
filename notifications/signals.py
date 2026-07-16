"""
In-app notification signals for all major account activity.

Each handler fires only on meaningful transitions (not every save) to avoid duplicates.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .helpers import (
    client_user,
    pop_old_instance,
    project_client_user,
    quote_label,
    quote_owner_user,
    remember_old_instance,
    truncate_message,
)
from .models import InAppNotification
from .services import notify_staff, notify_user, notify_users


def _is_staff_user(user):
    return bool(user and (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)))


# ---------------------------------------------------------------------------
# Quotes
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='quotes.Quote')
def _quote_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='quotes.Quote')
def notify_quote_events(sender, instance, created, **kwargs):
    label = quote_label(instance)
    owner = quote_owner_user(instance)

    if created:
        if owner:
            notify_user(
                owner,
                title='Quote submitted',
                message=f'We received your quote request "{label}".',
                event_type=InAppNotification.EVENT_QUOTE_SUBMITTED,
                link='/profile',
            )
        notify_staff(
            title='New quote request',
            message=f'{instance.client_name} submitted "{label}".',
            event_type=InAppNotification.EVENT_QUOTE_SUBMITTED,
            link='/admin/quotes',
        )
        return

    old = pop_old_instance(sender, instance)
    if not old or old.status == instance.status:
        return

    new_status = instance.status

    if new_status in ('reviewed', 'replied') and owner:
        notify_user(
            owner,
            title='Quote reviewed',
            message=f'Your quote "{label}" has been reviewed. Please check your portal.',
            event_type=InAppNotification.EVENT_QUOTE_REVIEWED,
            link='/profile',
        )
    elif new_status == 'approved' and owner:
        notify_user(
            owner,
            title='Quote approved',
            message=f'Your quote "{label}" was approved. You can proceed to payment.',
            event_type=InAppNotification.EVENT_QUOTE_APPROVED,
            link=f'/payment/{instance.pk}',
        )
    elif new_status in ('rejected', 'declined') and owner:
        notify_user(
            owner,
            title='Quote not approved',
            message=f'Your quote "{label}" was not approved.',
            event_type=InAppNotification.EVENT_QUOTE_REJECTED,
            link='/profile',
        )
    elif new_status == 'changes_requested':
        notify_staff(
            title='Client requested quote changes',
            message=f'{instance.client_name} requested changes on "{label}".',
            event_type=InAppNotification.EVENT_QUOTE_CHANGES_REQUESTED,
            link='/admin/quotes',
        )
    elif new_status == 'paid' and owner:
        notify_user(
            owner,
            title='Quote paid',
            message=f'Payment for "{label}" is complete.',
            event_type=InAppNotification.EVENT_QUOTE_PAID,
            link='/profile',
        )
        notify_staff(
            title='Quote paid',
            message=f'{instance.client_name} paid for "{label}".',
            event_type=InAppNotification.EVENT_QUOTE_PAID,
            link='/admin/quotes',
        )


# ---------------------------------------------------------------------------
# Payments (PayFast / external)
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='payments.Payment')
def _payment_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='payments.Payment')
def notify_payment_events(sender, instance, created, **kwargs):
    old = pop_old_instance(sender, instance)
    prev_status = old.payment_status if old else None
    new_status = instance.payment_status

    if new_status == prev_status:
        return

    user = instance.user or client_user(instance.client) or quote_owner_user(instance.quote)
    if not user:
        return

    if new_status == 'paid':
        notify_user(
            user,
            title='Payment completed',
            message=f'Payment of {instance.amount} {instance.currency.upper()} was received.',
            event_type=InAppNotification.EVENT_PAYMENT_COMPLETED,
            link='/profile',
        )
        notify_staff(
            title='Payment received',
            message=f'{user.get_full_name() or user.email} paid {instance.amount} {instance.currency.upper()}.',
            event_type=InAppNotification.EVENT_PAYMENT_COMPLETED,
            link='/admin/financial',
        )
    elif new_status == 'failed':
        notify_user(
            user,
            title='Payment failed',
            message=f'Payment for "{quote_label(instance.quote)}" could not be completed.',
            event_type=InAppNotification.EVENT_PAYMENT_FAILED,
            link=f'/payment/{instance.quote_id}',
        )
        notify_staff(
            title='Payment failed',
            message=f'Payment failed for "{quote_label(instance.quote)}" ({user.email}).',
            event_type=InAppNotification.EVENT_PAYMENT_FAILED,
            link='/admin/quotes',
        )


# ---------------------------------------------------------------------------
# Invoices
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='invoices.Invoice')
def _invoice_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='invoices.Invoice')
def notify_invoice_events(sender, instance, created, **kwargs):
    quote = instance.quote
    user = quote_owner_user(quote) if quote else client_user(instance.client)
    old = pop_old_instance(sender, instance)

    if created and user:
        notify_user(
            user,
            title='Invoice generated',
            message=f'Invoice {instance.invoice_number} is ready.',
            event_type=InAppNotification.EVENT_INVOICE_GENERATED,
            link='/profile',
        )
        notify_staff(
            title='Invoice generated',
            message=f'Invoice {instance.invoice_number} created for {user.get_full_name() or user.email}.',
            event_type=InAppNotification.EVENT_INVOICE_GENERATED,
            link='/admin/invoices',
        )
        return

    if not old or old.status == instance.status or not user:
        return

    if instance.status == 'paid':
        notify_user(
            user,
            title='Invoice paid',
            message=f'Invoice {instance.invoice_number} has been marked as paid.',
            event_type=InAppNotification.EVENT_INVOICE_PAID,
            link='/profile',
        )
        notify_staff(
            title='Invoice paid',
            message=f'Invoice {instance.invoice_number} paid by {user.get_full_name() or user.email}.',
            event_type=InAppNotification.EVENT_INVOICE_PAID,
            link='/admin/invoices',
        )
    elif instance.status == 'overdue':
        notify_user(
            user,
            title='Invoice overdue',
            message=f'Invoice {instance.invoice_number} is now overdue.',
            event_type=InAppNotification.EVENT_INVOICE_OVERDUE,
            link='/profile',
        )
        notify_staff(
            title='Invoice overdue',
            message=f'Invoice {instance.invoice_number} is overdue ({user.email}).',
            event_type=InAppNotification.EVENT_INVOICE_OVERDUE,
            link='/admin/invoices',
        )


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='clients.Project')
def _project_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='clients.Project')
def notify_project_events(sender, instance, created, **kwargs):
    user = project_client_user(instance)
    if not user:
        return

    if created:
        notify_user(
            user,
            title='Project created',
            message=f'Your project "{instance.name}" is now active.',
            event_type=InAppNotification.EVENT_PROJECT_CREATED,
            link='/my-projects',
        )
        client_name = instance.client.name if instance.client_id else user.get_full_name() or user.email
        notify_staff(
            title='New client project',
            message=f'"{instance.name}" started for {client_name}.',
            event_type=InAppNotification.EVENT_PROJECT_CREATED,
            link='/admin/client-projects',
        )
        return

    old = pop_old_instance(sender, instance)
    if not old or old.status == instance.status:
        return

    if instance.status == 'completed':
        notify_user(
            user,
            title='Project completed',
            message=f'Your project "{instance.name}" has been marked as completed.',
            event_type=InAppNotification.EVENT_PROJECT_COMPLETED,
            link='/my-projects',
        )
        notify_staff(
            title='Project completed',
            message=f'"{instance.name}" marked completed.',
            event_type=InAppNotification.EVENT_PROJECT_COMPLETED,
            link='/admin/client-projects',
        )
    else:
        notify_user(
            user,
            title='Project updated',
            message=f'"{instance.name}" moved to {instance.get_status_display()}.',
            event_type=InAppNotification.EVENT_PROJECT_UPDATED,
            link='/my-projects',
        )
        notify_staff(
            title='Project updated',
            message=f'"{instance.name}" is now {instance.get_status_display()}.',
            event_type=InAppNotification.EVENT_PROJECT_UPDATED,
            link='/admin/client-projects',
        )


# ---------------------------------------------------------------------------
# Work tasks (tasks app)
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='tasks.WorkTask')
def _work_task_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='tasks.WorkTask')
def notify_work_task_events(sender, instance, created, **kwargs):
    old = pop_old_instance(sender, instance)
    project_name = instance.project.name if instance.project_id else 'your project'
    link = '/tasks'

    assignee = instance.assigned_to
    assignee_changed = created or (old and old.assigned_to_id != instance.assigned_to_id)
    if assignee and assignee_changed and instance.status != 'completed':
        notify_user(
            assignee,
            title='Task assigned',
            message=f'You were assigned "{instance.title}" on {project_name}.',
            event_type=InAppNotification.EVENT_TASK_ASSIGNED,
            link=link,
        )

    status_changed = old is None or old.status != instance.status
    if status_changed and instance.status == 'completed':
        recipients = []
        if instance.created_by_id and instance.created_by_id != (assignee.pk if assignee else None):
            recipients.append(instance.created_by)
        client = project_client_user(instance.project)
        if client and client.pk not in {u.pk for u in recipients if u}:
            if not assignee or client.pk != assignee.pk:
                recipients.append(client)
        notify_users(
            recipients,
            title='Task completed',
            message=f'"{instance.title}" on {project_name} was completed.',
            event_type=InAppNotification.EVENT_TASK_COMPLETED,
            link=link,
        )
        notify_staff(
            title='Task completed',
            message=f'"{instance.title}" on {project_name} was completed.',
            event_type=InAppNotification.EVENT_TASK_COMPLETED,
            link='/admin/tasks',
        )


# ---------------------------------------------------------------------------
# Client project tasks (clients.Task)
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='clients.Task')
def _client_task_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='clients.Task')
def notify_client_task_events(sender, instance, created, **kwargs):
    user = project_client_user(instance.project)
    if not user:
        return

    project_name = instance.project.name if instance.project_id else 'your project'
    old = pop_old_instance(sender, instance)

    if created:
        notify_user(
            user,
            title='New project task',
            message=f'"{instance.title}" was added to {project_name}.',
            event_type=InAppNotification.EVENT_TASK_UPDATED,
            link='/tasks',
        )
        notify_staff(
            title='Client task added',
            message=f'"{instance.title}" added to {project_name}.',
            event_type=InAppNotification.EVENT_TASK_UPDATED,
            link='/admin/client-projects',
        )
        return

    if old and old.status != instance.status:
        if instance.status == 'done':
            notify_user(
                user,
                title='Task completed',
                message=f'"{instance.title}" on {project_name} is done.',
                event_type=InAppNotification.EVENT_TASK_COMPLETED,
                link='/tasks',
            )
            notify_staff(
                title='Client completed a task',
                message=f'"{instance.title}" on {project_name} is done.',
                event_type=InAppNotification.EVENT_TASK_COMPLETED,
                link='/admin/client-projects',
            )
        else:
            notify_user(
                user,
                title='Task updated',
                message=f'"{instance.title}" is now {instance.get_status_display()}.',
                event_type=InAppNotification.EVENT_TASK_UPDATED,
                link='/tasks',
            )


# ---------------------------------------------------------------------------
# Shared files
# ---------------------------------------------------------------------------

def _notify_file_uploaded(*, uploaded_by, client, file_name, link='/files'):
    owner = client_user(client)
    if uploaded_by and _is_staff_user(uploaded_by):
        if owner and owner.pk != uploaded_by.pk:
            notify_user(
                owner,
                title='New file shared',
                message=f'"{file_name}" was shared with you.',
                event_type=InAppNotification.EVENT_FILE_UPLOADED,
                link=link,
            )
        return
    if uploaded_by and owner and uploaded_by.pk == owner.pk:
        notify_staff(
            title='Client uploaded a file',
            message=f'{uploaded_by.get_full_name() or uploaded_by.email} uploaded "{file_name}".',
            event_type=InAppNotification.EVENT_FILE_UPLOADED,
            link='/admin/client-projects',
        )
        return
    if owner:
        notify_user(
            owner,
            title='New file shared',
            message=f'"{file_name}" was added to your account.',
            event_type=InAppNotification.EVENT_FILE_UPLOADED,
            link=link,
        )


@receiver(post_save, sender='files.SharedFile')
def notify_shared_file_uploaded(sender, instance, created, **kwargs):
    if not created:
        return
    name = instance.name or 'New file'
    _notify_file_uploaded(
        uploaded_by=instance.uploaded_by,
        client=instance.client,
        file_name=name,
    )


@receiver(post_save, sender='clients.ProjectFile')
def notify_project_file_uploaded(sender, instance, created, **kwargs):
    if not created:
        return
    client = instance.project.client if instance.project_id else None
    if not client:
        return
    name = instance.description or (str(instance.file.name).split('/')[-1] if instance.file else 'New file')
    _notify_file_uploaded(
        uploaded_by=instance.uploaded_by,
        client=client,
        file_name=name,
        link='/files',
    )


# ---------------------------------------------------------------------------
# Calendar
# ---------------------------------------------------------------------------

@receiver(post_save, sender='calendar_events.CalendarEvent')
def notify_calendar_event(sender, instance, created, **kwargs):
    if not created:
        return
    notify_user(
        instance.user,
        title='Calendar event added',
        message=f'"{instance.title}" was added to your calendar.',
        event_type=InAppNotification.EVENT_CALENDAR_EVENT,
        link='/calendar',
    )


# ---------------------------------------------------------------------------
# Messaging
# ---------------------------------------------------------------------------

@receiver(post_save, sender='messaging.MessageThread')
def notify_thread_created(sender, instance, created, **kwargs):
    if not created:
        return
    user = client_user(instance.client)
    project_name = instance.project.name if instance.project_id else 'your project'
    client_name = instance.client.name if instance.client_id else 'Client'
    if user:
        notify_user(
            user,
            title='Message thread ready',
            message=f'You can now message our team about {project_name}.',
            event_type=InAppNotification.EVENT_THREAD_CREATED,
            link=f'/messages/{instance.pk}',
        )
    notify_staff(
        title='New message thread',
        message=f'{client_name} · {project_name} thread is ready.',
        event_type=InAppNotification.EVENT_THREAD_CREATED,
        link='/admin/messaging-threads',
    )


@receiver(post_save, sender='messaging.Message')
def notify_new_message(sender, instance, created, **kwargs):
    if not created:
        return
    thread = instance.thread
    sender_user = instance.sender
    project_name = thread.project.name if thread.project_id else 'project'
    preview = truncate_message(instance.content or 'New message', 120)
    thread_link = f'/messages/{thread.pk}'

    client = client_user(thread.client) if thread.client_id else None
    if client and (not sender_user or sender_user.pk != client.pk):
        if sender_user and _is_staff_user(sender_user):
            sender_label = sender_user.get_full_name() or 'PathyCode team'
            title = 'New message from our team'
        else:
            sender_label = (sender_user.get_full_name() if sender_user else None) or 'Someone'
            title = 'New message'
        notify_user(
            client,
            title=title,
            message=f'{project_name}: {sender_label}: {preview}',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
            link=thread_link,
        )

    if sender_user and not _is_staff_user(sender_user):
        client_name = thread.client.name if thread.client_id else sender_user.get_full_name() or sender_user.email
        notify_staff(
            title='New client message',
            message=f'{client_name} · {project_name}: {preview}',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
            link=thread_link,
        )


# ---------------------------------------------------------------------------
# Testimonials
# ---------------------------------------------------------------------------

@receiver(pre_save, sender='testimonials.Testimonial')
def _testimonial_pre_save(sender, instance, **kwargs):
    remember_old_instance(sender, instance)


@receiver(post_save, sender='testimonials.Testimonial')
def notify_testimonial_events(sender, instance, created, **kwargs):
    if created:
        notify_staff(
            title='New testimonial',
            message=f'{instance.name} submitted a testimonial for review.',
            event_type=InAppNotification.EVENT_TESTIMONIAL_SUBMITTED,
            link='/admin/testimonials',
        )
        user = client_user(instance.client) if instance.client_id else None
        if user:
            notify_user(
                user,
                title='Testimonial submitted',
                message='Thank you! Your testimonial was received and is pending review.',
                event_type=InAppNotification.EVENT_TESTIMONIAL_SUBMITTED,
                link='/profile',
            )
        return

    old = pop_old_instance(sender, instance)
    if not old or old.is_approved == instance.is_approved:
        return
    if instance.is_approved:
        user = client_user(instance.client) if instance.client_id else None
        if user:
            notify_user(
                user,
                title='Testimonial approved',
                message='Your testimonial has been approved and may appear publicly.',
                event_type=InAppNotification.EVENT_TESTIMONIAL_APPROVED,
                link='/profile',
            )


# ---------------------------------------------------------------------------
# Contact, newsletter, registration
# ---------------------------------------------------------------------------

@receiver(post_save, sender='contact.ContactMessage')
def notify_contact_submitted(sender, instance, created, **kwargs):
    if not created:
        return
    subject = truncate_message(instance.subject or 'Contact message', 80)
    notify_staff(
        title='New contact message',
        message=f'{instance.name}: {subject}',
        event_type=InAppNotification.EVENT_CONTACT_SUBMITTED,
        link='/admin/contact',
    )


@receiver(post_save, sender='newsletter.NewsletterSubscription')
def notify_newsletter_subscribed(sender, instance, created, **kwargs):
    if not instance.is_active:
        return
    if not created:
        return
    notify_staff(
        title='Newsletter signup',
        message=f'{instance.email} subscribed to the newsletter.',
        event_type=InAppNotification.EVENT_NEWSLETTER_SUBSCRIBED,
        link='/admin/newsletter',
    )


@receiver(post_save, sender='users.CustomUser')
def notify_user_registered(sender, instance, created, **kwargs):
    if not created or _is_staff_user(instance):
        return
    name = instance.get_full_name() or instance.email or instance.username
    notify_staff(
        title='New user registered',
        message=f'{name} created an account.',
        event_type=InAppNotification.EVENT_USER_REGISTERED,
        link='/admin/users',
    )
