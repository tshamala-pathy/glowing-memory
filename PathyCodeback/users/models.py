from django.db import models
from django.contrib.auth.models import AbstractUser

# 📌 Custom user model extending Django's built-in AbstractUser.
# This allows you to add additional fields while keeping the standard auth functionality.

class CustomUser(AbstractUser):
    """
    Custom user model that extends the default Django AbstractUser.

    Fields added:
    - email: Must be unique. Used for login or communication.
    - bio: Optional text field where users can write a short biography.
    """
    email = models.EmailField(unique=True)  # Ensures each user has a unique email
    bio = models.TextField(blank=True, null=True)  # Optional user bio

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