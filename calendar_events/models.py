from django.db import models
from django.conf import settings


class CalendarEvent(models.Model):
    """Calendar event: deadlines, meetings, reminders."""

    TYPE_DEADLINE = 'deadline'
    TYPE_MEETING = 'meeting'
    TYPE_REMINDER = 'reminder'

    TYPE_CHOICES = [
        (TYPE_DEADLINE, 'Deadline'),
        (TYPE_MEETING, 'Meeting'),
        (TYPE_REMINDER, 'Reminder'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calendar_events',
    )
    project = models.ForeignKey(
        'clients.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='calendar_events',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_DEADLINE)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    reminder_minutes = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_at']

    def __str__(self):
        return f'{self.title} @ {self.start_at}'
