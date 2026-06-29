from django.db import models
from django.conf import settings


class InAppNotification(models.Model):
    """In-app notification delivered to a specific user."""

    EVENT_QUOTE_REVIEWED = 'quote_reviewed'
    EVENT_PAYMENT_COMPLETED = 'payment_completed'
    EVENT_INVOICE_GENERATED = 'invoice_generated'
    EVENT_NEW_MESSAGE = 'new_message'

    EVENT_CHOICES = [
        (EVENT_QUOTE_REVIEWED, 'Quote reviewed'),
        (EVENT_PAYMENT_COMPLETED, 'Payment completed'),
        (EVENT_INVOICE_GENERATED, 'Invoice generated'),
        (EVENT_NEW_MESSAGE, 'New message'),
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
