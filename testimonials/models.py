from django.db import models


class Testimonial(models.Model):
    """
    Model for storing client testimonials.
    Linked to Client when submitted by authenticated user for identity & history.
    """
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]

    name = models.CharField(max_length=255)
    position = models.CharField(max_length=255, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    testimonial = models.TextField()
    rating = models.IntegerField(choices=RATING_CHOICES, default=5)
    image = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    # Link to Client when submitted by authenticated user
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='testimonials',
        help_text="Client (business entity) when submitted by authenticated user"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.rating} stars"

    class Meta:
        ordering = ['-is_featured', '-created_at']
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"
