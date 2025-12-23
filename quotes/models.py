from django.db import models
from django.conf import settings


class Quote(models.Model):
    """
    Model for storing client quote/estimate requests.
    """
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]
    
    # Client Information
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField()
    client_phone = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Project Details
    project_title = models.CharField(max_length=255)
    project_description = models.TextField()
    project_type = models.CharField(max_length=100, blank=True, null=True)
    budget_range = models.CharField(max_length=100, blank=True, null=True)
    deadline = models.DateField(blank=True, null=True)
    
    # Quote Details
    estimated_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    notes = models.TextField(blank=True, null=True)
    
    # Admin Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_quotes'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.project_title} - {self.client_name} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Quote"
        verbose_name_plural = "Quotes"

