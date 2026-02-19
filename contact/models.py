from django.db import models


class ContactMessage(models.Model):
    """
    Stores messages sent through the contact form.
    Linked to Client when submitted by authenticated user for identity & history.
    """
    STATUS_CHOICES = [
        ('New', 'New'),
        ('Read', 'Read'),
        ('Replied', 'Replied'),
        ('Archived', 'Archived'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='New',
        help_text="Message status for tracking"
    )
    # Link to Client when submitted by authenticated user
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact_messages',
        help_text="Client (business entity) when submitted by authenticated user"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"
