from django.db import models
from django.contrib.auth.models import AbstractUser

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