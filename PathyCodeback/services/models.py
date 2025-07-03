from django.db import models

# ✅ Model for representing a service offered on the platform.
class Service(models.Model):
    """
    Represents a service that the user or developer provides, such as web development or design.
    Includes details like title, description, and icon for display in the UI.
    """

    title = models.CharField(
        max_length=100,
        help_text="Short title or name of the service (e.g., 'Web Development')"
    )
    description = models.TextField(
        help_text="Detailed explanation of the service"
    )
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional: FontAwesome class or custom icon name for frontend display (e.g., 'fas fa-code')"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp automatically set when the service is created"
    )

    def __str__(self):
        """
        String representation of the service in admin and console.
        """
        return self.title
    class Meta:
        """
        Metadata options for the Service model.
        """
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["-created_at"]
# This model is used to store and manage services that users can offer or request.