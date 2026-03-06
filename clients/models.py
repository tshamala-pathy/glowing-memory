from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator

# ================================
# Client Model (Business / Customer Entity)
# ================================
class Client(models.Model):
    """
    Business/customer entity: the company or organization that owns projects,
    quotes, and invoices in domain terms.

    Use this model for the "client" in business sense (the customer), not for
    login. Authentication is handled by User (AUTH_USER_MODEL). See docs/RESPONSIBILITIES.md.

    Each authenticated user has exactly one client profile (Client.user OneToOneField);
    it is created automatically when the user is created (see clients.signals).

    Fields:
        user: OneToOne link to User (auth); one client profile per user
        name: Company or contact name
        logo: Client logo image
        industry: Industry sector (e.g., Technology, Healthcare, Finance)
        description: Brief description of the client
        is_public: Whether to display on public website
        created_at: Timestamp when client was added
    """
    # One-to-one link: each user has exactly one client profile (created on user creation)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_profile',
        null=True,
        blank=True,
        help_text="Authenticated user this client profile belongs to (one profile per user)"
    )
    name = models.CharField(max_length=255, help_text="Client company or contact name")
    logo = models.ImageField(
        upload_to='clients/logos/',
        blank=True,
        null=True,
        help_text="Client logo image"
    )
    industry = models.CharField(
        max_length=100,
        blank=True,
        help_text="Industry sector (e.g., Technology, Healthcare, Finance)"
    )
    description = models.TextField(
        blank=True,
        help_text="Brief description of the client"
    )
    internal_notes = models.TextField(
        blank=True,
        help_text="Internal notes (admin/staff only; not visible to clients)",
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Display on public website"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Client"
        verbose_name_plural = "Clients"


# ================================
# Project Model (Owned by Client)
# ================================
class Project(models.Model):
    """
    Represents a project for a specific client (business/customer entity).

    In domain terms the project is owned by the Client. The `client` FK points to
    Client (business entity); access is determined by client.user. See docs/RESPONSIBILITIES.md.

    Business Rules:
    - Projects are created when an invoice is marked as PAID.
    - Projects can be public (visible to everyone) or private (only that client and admin).

    Workflow:
    1. Client (customer) submits Quote
    2. Admin approves Quote
    3. Admin generates Invoice from Quote
    4. Client pays Invoice
    5. When Invoice status = "Paid", Project is automatically created
    6. Project is linked to Client, Quote, and Invoice (access via client.user)

    Fields:
        name: Project name/title
        description: Project description
        client: FK to Client — the business/customer entity that owns this project
        status: Project status (pending, in_progress, completed)
        quote: FK to Quote (the original quote request)
        invoice: FK to Invoice (the paid invoice)
        tech_stack: Comma-separated list of technologies used
        screenshots: JSON field for project screenshots/images
        repo_url: Optional GitHub repository URL
        live_url: Optional live demo URL
        is_public: Whether project is visible to non-authenticated users
        created_at: Timestamp when project was created
    """
    STAGE_CHOICES = [
        ('planning', 'Planning'),
        ('design', 'Design'),
        ('development', 'Development'),
        ('testing', 'Testing'),
        ('completed', 'Completed'),
    ]
    
    name = models.CharField(
        max_length=255,
        help_text="Project name/title"
    )
    description = models.TextField(
        help_text="Detailed project description"
    )
    
    # Client (business entity) that owns this project; access via client.user
    client = models.ForeignKey(
        'Client',
        on_delete=models.CASCADE,
        related_name='projects',
        null=True,
        blank=True,
        help_text="Client (business entity) that owns this project"
    )
    
    # Project status
    status = models.CharField(
        max_length=20,
        choices=STAGE_CHOICES,
        default='planning',
        help_text="Current stage of the project"
    )

    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Project progress percentage (0-100). Clients can view; admin updates."
    )
    
    # Links to Quote and Invoice
    quote = models.ForeignKey(
        'quotes.Quote',
        on_delete=models.PROTECT,
        related_name='projects',
        null=True,
        blank=True,
        help_text="The quote this project is based on"
    )
    invoice = models.ForeignKey(
        'invoices.Invoice',
        on_delete=models.PROTECT,
        related_name='projects',
        null=True,
        blank=True,
        help_text="The invoice that triggered this project creation"
    )
    
    # Technical details
    tech_stack = models.CharField(
        max_length=500,
        blank=True,
        help_text="Comma-separated list of technologies used"
    )
    screenshots = models.JSONField(
        default=list,
        blank=True,
        help_text="List of screenshot/image URLs (JSON array)"
    )
    
    # URLs
    repo_url = models.URLField(
        blank=True,
        null=True,
        help_text="GitHub repository URL (optional)"
    )
    live_url = models.URLField(
        blank=True,
        null=True,
        help_text="Live demo URL (optional)"
    )
    
    # Visibility
    is_public = models.BooleanField(
        default=False,
        help_text="If true, project is visible to non-authenticated users on public projects page"
    )
    internal_notes = models.TextField(
        blank=True,
        help_text="Internal notes (admin/staff only; not visible to clients)",
    )
    
    # Timestamps
    start_date = models.DateField(
        blank=True,
        null=True,
        help_text="Project start date (set when project is auto-created from paid invoice)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when the project was marked as completed",
    )

    def __str__(self):
        return f"{self.name} - {self.client.name}" if self.client else self.name

    def get_tech_stack_list(self):
        """Returns a list of technologies."""
        return [tech.strip() for tech in self.tech_stack.split(',')] if self.tech_stack else []
    
    def clean(self):
        """
        Validate that if invoice is provided, it must be paid.
        """
        if self.invoice and self.invoice.status != 'paid':
            raise ValidationError({
                'invoice': 'Project can only be created from a paid invoice.'
            })
        super().clean()

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Client Project"
        verbose_name_plural = "Client Projects"


# ================================
# Task Model (Admin-only; linked to Project)
# ================================
class Task(models.Model):
    """
    Internal task linked to a Project. Admin-only: not visible to clients.
    Used for project task tracking (todo / in_progress / done).
    """
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text="Project this task belongs to",
    )
    title = models.CharField(max_length=255, help_text="Task title")
    description = models.TextField(blank=True, help_text="Task description")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='todo',
        help_text="Task status",
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Task priority",
    )
    due_date = models.DateField(
        blank=True,
        null=True,
        help_text="Due date for this task",
    )
    internal_notes = models.TextField(
        blank=True,
        help_text="Internal notes (admin only)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Task"
        verbose_name_plural = "Tasks"


# ================================
# Case Study Model
# ================================
class CaseStudy(models.Model):
    """
    Detailed case study for a client project. Belongs to the Client (business entity).
    See docs/RESPONSIBILITIES.md.

    Fields:
        title: Case study title
        client: FK to Client (business/customer entity)
        problem: The problem/challenge addressed
        solution: The solution implemented
        result: The results achieved
        metrics: JSON field for key metrics (e.g., {"revenue": "+50%", "users": "10K"})
        testimonial: Optional client testimonial
        is_public: Whether to display on public website
        created_at: Timestamp when case study was created
    """
    title = models.CharField(max_length=255)
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='case_studies',
        help_text="The client this case study belongs to"
    )
    problem = models.TextField(
        help_text="The problem or challenge that was addressed"
    )
    solution = models.TextField(
        help_text="The solution that was implemented"
    )
    result = models.TextField(
        help_text="The results and outcomes achieved"
    )
    metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Key metrics as JSON (e.g., {'revenue': '+50%', 'users': '10K'})"
    )
    testimonial = models.TextField(
        blank=True,
        help_text="Optional client testimonial"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Display on public website"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.client.name}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Case Study"
        verbose_name_plural = "Case Studies"
