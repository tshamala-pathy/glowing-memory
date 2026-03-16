from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# 📌 Custom user model extending Django's built-in AbstractUser.
# This allows you to add additional fields while keeping the standard auth functionality.


class CustomUser(AbstractUser):
    """
    Authentication and authorization only (login, permissions).

    Use this model for:
    - Identity and login (email, username, password).
    - Permissions: is_staff, is_superuser, and role-based access.
    - Optional profile: email, bio, avatar (for the person using the system).

    This model is NOT the business "client" or "customer". The entity that owns
    quotes, invoices, and projects is the Client (business entity). See docs/RESPONSIBILITIES.md.
    """
    email = models.EmailField(unique=True)  # Ensures each user has a unique email
    bio = models.TextField(blank=True, null=True)  # Optional user bio
    avatar = models.ImageField(
        upload_to='users/avatars/',
        blank=True,
        null=True,
        help_text='Optional profile picture'
    )
    email_verified = models.BooleanField(
        default=False,
        help_text='Whether the email address has been verified'
    )

    def __str__(self):
        """
        Returns a string representation of the user (their username).
        """
        return self.username

    class Meta:
        """
        Meta options for the CustomUser model.
        """
        verbose_name = "Custom User"
        verbose_name_plural = "Custom Users"


class Notification(models.Model):
    """
    Simple in-app notification for a specific user.

    Examples:
    - \"New message from admin for Project X\"
    - \"Project X status changed to Completed\"
    - \"New invoice INV-2026-1234 generated\"
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='User who should see this notification',
    )
    message = models.CharField(
        max_length=255,
        help_text='Short notification text to display',
    )
    link = models.CharField(
        max_length=255,
        blank=True,
        help_text='Optional internal link (frontend route) for this notification',
    )
    is_read = models.BooleanField(
        default=False,
        help_text='Whether the user has read this notification',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f'Notification for {self.user}: {self.message[:50]}'