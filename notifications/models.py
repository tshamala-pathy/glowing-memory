from django.db import models
from django.conf import settings


class InAppNotification(models.Model):
    """In-app notification delivered to a specific user."""

    EVENT_QUOTE_SUBMITTED = 'quote_submitted'
    EVENT_QUOTE_REVIEWED = 'quote_reviewed'
    EVENT_QUOTE_APPROVED = 'quote_approved'
    EVENT_QUOTE_REJECTED = 'quote_rejected'
    EVENT_QUOTE_CHANGES_REQUESTED = 'quote_changes_requested'
    EVENT_QUOTE_PAID = 'quote_paid'
    EVENT_PAYMENT_COMPLETED = 'payment_completed'
    EVENT_PAYMENT_FAILED = 'payment_failed'
    EVENT_INVOICE_GENERATED = 'invoice_generated'
    EVENT_INVOICE_PAID = 'invoice_paid'
    EVENT_INVOICE_OVERDUE = 'invoice_overdue'
    EVENT_PROJECT_CREATED = 'project_created'
    EVENT_PROJECT_UPDATED = 'project_updated'
    EVENT_PROJECT_COMPLETED = 'project_completed'
    EVENT_TASK_ASSIGNED = 'task_assigned'
    EVENT_TASK_COMPLETED = 'task_completed'
    EVENT_TASK_UPDATED = 'task_updated'
    EVENT_FILE_UPLOADED = 'file_uploaded'
    EVENT_CALENDAR_EVENT = 'calendar_event'
    EVENT_NEW_MESSAGE = 'new_message'
    EVENT_THREAD_CREATED = 'thread_created'
    EVENT_TESTIMONIAL_SUBMITTED = 'testimonial_submitted'
    EVENT_TESTIMONIAL_APPROVED = 'testimonial_approved'
    EVENT_PROFILE_UPDATED = 'profile_updated'
    EVENT_PASSWORD_CHANGED = 'password_changed'
    EVENT_EMAIL_CHANGED = 'email_changed'
    EVENT_CONTACT_SUBMITTED = 'contact_submitted'
    EVENT_NEWSLETTER_SUBSCRIBED = 'newsletter_subscribed'
    EVENT_USER_REGISTERED = 'user_registered'

    EVENT_CHOICES = [
        (EVENT_QUOTE_SUBMITTED, 'Quote submitted'),
        (EVENT_QUOTE_REVIEWED, 'Quote reviewed'),
        (EVENT_QUOTE_APPROVED, 'Quote approved'),
        (EVENT_QUOTE_REJECTED, 'Quote rejected'),
        (EVENT_QUOTE_CHANGES_REQUESTED, 'Quote changes requested'),
        (EVENT_QUOTE_PAID, 'Quote paid'),
        (EVENT_PAYMENT_COMPLETED, 'Payment completed'),
        (EVENT_PAYMENT_FAILED, 'Payment failed'),
        (EVENT_INVOICE_GENERATED, 'Invoice generated'),
        (EVENT_INVOICE_PAID, 'Invoice paid'),
        (EVENT_INVOICE_OVERDUE, 'Invoice overdue'),
        (EVENT_PROJECT_CREATED, 'Project created'),
        (EVENT_PROJECT_UPDATED, 'Project updated'),
        (EVENT_PROJECT_COMPLETED, 'Project completed'),
        (EVENT_TASK_ASSIGNED, 'Task assigned'),
        (EVENT_TASK_COMPLETED, 'Task completed'),
        (EVENT_TASK_UPDATED, 'Task updated'),
        (EVENT_FILE_UPLOADED, 'File uploaded'),
        (EVENT_CALENDAR_EVENT, 'Calendar event'),
        (EVENT_NEW_MESSAGE, 'New message'),
        (EVENT_THREAD_CREATED, 'Message thread created'),
        (EVENT_TESTIMONIAL_SUBMITTED, 'Testimonial submitted'),
        (EVENT_TESTIMONIAL_APPROVED, 'Testimonial approved'),
        (EVENT_PROFILE_UPDATED, 'Profile updated'),
        (EVENT_PASSWORD_CHANGED, 'Password changed'),
        (EVENT_EMAIL_CHANGED, 'Email changed'),
        (EVENT_CONTACT_SUBMITTED, 'Contact form submitted'),
        (EVENT_NEWSLETTER_SUBSCRIBED, 'Newsletter subscribed'),
        (EVENT_USER_REGISTERED, 'User registered'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='in_app_notifications',
    )
    title = models.CharField(max_length=120)
    message = models.CharField(max_length=255)
    event_type = models.CharField(max_length=40, choices=EVENT_CHOICES, default=EVENT_QUOTE_REVIEWED)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'In-app notification'
        verbose_name_plural = 'In-app notifications'

    def __str__(self):
        return f'{self.title} → {self.user}'
