from django.db import models

# Testimonials Model
class Testimonial(models.Model):
    """
    Model for storing client testimonials.
    
    Fields:
        name (str): Client's name
        position (str): Client's position/role
        company (str): Client's company name (optional)
        testimonial (str): The testimonial text
        rating (int): Rating from 1 to 5
        image (ImageField): Optional client photo
        is_featured (bool): Whether to feature this testimonial
        is_approved (bool): Whether the testimonial is approved for display
        created_at (datetime): When the testimonial was created
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.rating} stars"

    class Meta:
        ordering = ['-is_featured', '-created_at']
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"
