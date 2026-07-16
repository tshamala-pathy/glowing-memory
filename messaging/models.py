"""
Internal messaging: message threads per project between client and admin.
Only participants (project's client user + staff/superuser) can access a thread.
"""
from django.db import models
from django.conf import settings


class MessageThread(models.Model):
    """
    One thread per project. Links a project and its client; admins join as participants
    via is_staff / is_superuser when accessing threads.
    """
    project = models.OneToOneField(
        'clients.Project',
        on_delete=models.CASCADE,
        related_name='message_thread',
        help_text="Project this thread belongs to",
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='message_threads',
        help_text="Client (participant) for this thread",
    )
    background_preset = models.CharField(
        max_length=32,
        default='workspace',
        help_text="Sidebar cover preset when background_image is empty",
    )
    background_image = models.ImageField(
        upload_to='messaging/covers/%Y/%m/',
        blank=True,
        null=True,
        help_text="Custom sidebar cover photo",
    )
    wallpaper_preset = models.CharField(
        max_length=32,
        default='workspace',
        help_text="Chat wallpaper preset when wallpaper_image is empty",
    )
    wallpaper_image = models.ImageField(
        upload_to='messaging/wallpapers/%Y/%m/',
        blank=True,
        null=True,
        help_text="Custom chat box wallpaper",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = "Message Thread"
        verbose_name_plural = "Message Threads"

    def __str__(self):
        return f"Thread: {self.project.name} ({self.client.name})"


class Message(models.Model):
    """Single message in a thread. Sender can be client user or admin."""
    thread = models.ForeignKey(
        MessageThread,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="Thread this message belongs to",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_messages',
        help_text="User who sent the message",
    )
    content = models.TextField(help_text="Message text")
    attachment = models.FileField(
        upload_to='message_attachments/%Y/%m/',
        blank=True,
        null=True,
        help_text="Optional file attachment",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        return f"{self.sender} @ {self.created_at}: {self.content[:50]}"
