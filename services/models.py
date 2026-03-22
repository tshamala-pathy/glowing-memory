from django.db import models
import json

# ✅ Model for representing a service offered on the platform.
class Service(models.Model):
    """
    Represents a service that the user or developer provides, such as web development or design.
    Includes details like name, description, price, features, and categories.
    """

    name = models.CharField(
        max_length=255,
        default='Service',
        help_text="Name of the service (e.g., 'Web Development')"
    )
    # Keep title for backward compatibility during migration
    title = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Legacy title field (deprecated, use name instead)"
    )
    description = models.TextField(
        help_text="Detailed explanation of the service"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price of the service (optional)"
    )
    features = models.TextField(
        blank=True,
        help_text="JSON array or comma-separated list of features"
    )
    categories = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated list of categories"
    )
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional: FontAwesome class or custom icon name for frontend display (e.g., 'fas fa-code')"
    )
    short_description = models.CharField(
        max_length=300,
        blank=True,
        help_text="Brief teaser for cards and listings (max 300 chars)"
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Show this service prominently on the homepage"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Lower numbers appear first"
    )
    image = models.ImageField(
        upload_to='services/',
        blank=True,
        null=True,
        help_text="Optional service image for cards"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp automatically set when the service is created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp automatically updated when the service is modified"
    )

    def __str__(self):
        """
        String representation of the service in admin and console.
        """
        # Handle migration from title to name
        if self.name and self.name != 'Service':
            return self.name
        elif self.title:
            return self.title
        else:
            return 'Unnamed Service'
    
    def save(self, *args, **kwargs):
        # Migrate title to name if name is default and title exists
        if self.name == 'Service' and self.title:
            self.name = self.title
        super().save(*args, **kwargs)
    
    def get_features_list(self):
        """Returns a list of features."""
        if not self.features:
            return []
        try:
            # Try to parse as JSON first
            return json.loads(self.features)
        except (json.JSONDecodeError, TypeError):
            # If not JSON, treat as comma-separated
            return [f.strip() for f in self.features.split(',') if f.strip()]
    
    def get_categories_list(self):
        """Returns a list of categories."""
        if not self.categories:
            return []
        return [c.strip() for c in self.categories.split(',') if c.strip()]
    
    class Meta:
        """
        Metadata options for the Service model.
        """
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["-created_at"]
# This model is used to store and manage services that users can offer or request.