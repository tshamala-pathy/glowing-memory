from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Quote(models.Model):
    """
    Quote request belonging to a Client (business/customer entity).

    Optional client FK links to Client; client_name, client_email, company_name store
    contact details for display and for unauthenticated submissions. See docs/RESPONSIBILITIES.md.

    Status flow (state machine):
    - pending → replied (admin only)
    - replied → approved | declined (client only)
    - approved → paid (system only, after payment success)
    Use validate_status_transition() before changing status.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('replied', 'Replied'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
        ('paid', 'Paid'),
    ]

    # Valid status transitions: from_status -> list of allowed to_status
    VALID_TRANSITIONS = {
        'pending': ['replied'],
        'replied': ['approved', 'declined'],
        'approved': ['paid'],
        'declined': [],
        'paid': [],
    }
    
    SERVICE_TYPE_CHOICES = [
        ('Web Development', 'Web Development'),
        ('Backend/API Development', 'Backend/API Development'),
        ('Mobile App Development', 'Mobile App Development'),
        ('E-commerce Development', 'E-commerce Development'),
        ('Maintenance/Support', 'Maintenance/Support'),
        ('Design', 'Design'),
        ('Consulting', 'Consulting'),
        ('Other', 'Other'),
    ]
    
    TIMELINE_CHOICES = [
        ('1-2 weeks', '1-2 weeks'),
        ('2-4 weeks', '2-4 weeks'),
        ('1-2 months', '1-2 months'),
        ('2-3 months', '2-3 months'),
        ('3-6 months', '3-6 months'),
        ('6+ months', '6+ months'),
        ('Flexible', 'Flexible'),
    ]
    
    # Client (business entity); optional for public submissions; set when user is authenticated
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='quotes',
        help_text="Client (business entity) this quote belongs to; set when submitted by authenticated user"
    )
    # Client Information (contact details; kept for display and for unauthenticated submissions)
    client_name = models.CharField(max_length=255, help_text="Full name of the client requesting the quote")
    client_email = models.EmailField(help_text="Email address for communication and notifications")
    client_phone = models.CharField(max_length=20, blank=True, null=True, help_text="Optional phone number")
    company_name = models.CharField(max_length=255, blank=True, null=True, help_text="Optional company name")
    
    # Project Details
    project_title = models.CharField(max_length=255, help_text="Title or name of the project")
    project_description = models.TextField(help_text="Detailed description of project requirements and features")
    project_type = models.CharField(max_length=100, blank=True, null=True, help_text="Legacy field - use service_type instead")
    service_type = models.CharField(
        max_length=50,
        choices=SERVICE_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text="Type of service requested"
    )
    budget_range = models.CharField(max_length=100, blank=True, null=True, help_text="Client's budget range")
    deadline = models.DateField(blank=True, null=True, help_text="Desired project completion date")
    timeline = models.CharField(
        max_length=50,
        choices=TIMELINE_CHOICES,
        blank=True,
        null=True,
        help_text="Expected project timeline"
    )
    
    # Requirements Acceptance
    requirements_accepted = models.BooleanField(
        default=False,
        help_text="Whether the client has read and accepted the requirements"
    )
    requirements_accepted_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when requirements were accepted"
    )
    
    # Quote Details
    estimated_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Admin-provided estimated amount for the project"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current status of the quote request"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes for admin use (not visible to client)"
    )
    admin_response = models.TextField(
        blank=True,
        null=True,
        help_text="Admin's response to the client (sent via email when status changes to 'replied')"
    )
    responded_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when admin sent response to client"
    )
    client_decision_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when client approved or declined the quote"
    )
    payment_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Payment link for the client; set when admin marks quote as replied"
    )
    
    # Admin Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_quotes',
        help_text="Admin user assigned to handle this quote"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the quote request was submitted")
    updated_at = models.DateTimeField(auto_now=True, help_text="Last update timestamp")
    approved_at = models.DateTimeField(blank=True, null=True, help_text="When the quote was approved (legacy; use client_decision_at for client decision)")
    
    def __str__(self):
        return f"{self.project_title} - {self.client_name} ({self.status})"

    @classmethod
    def validate_status_transition(cls, old_status, new_status):
        """
        Enforce strict status flow. Raises ValidationError if transition is invalid.
        - pending → replied (admin only)
        - replied → approved | declined (client only)
        - approved → paid (system only)
        """
        if old_status == new_status:
            return
        allowed = cls.VALID_TRANSITIONS.get(old_status, [])
        if new_status not in allowed:
            raise ValidationError(
                {'status': [f'Invalid transition from "{old_status}" to "{new_status}". '
                            f'Allowed: {allowed or "none"}']}
            )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Quote"
        verbose_name_plural = "Quotes"

