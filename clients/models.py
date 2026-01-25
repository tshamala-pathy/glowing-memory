from django.db import models

# ================================
# Client Model
# ================================
class Client(models.Model):
    """
    Represents a client company or organization.
    
    Fields:
        name: Company/client name
        logo: Client logo image
        industry: Industry sector (e.g., Technology, Healthcare, Finance)
        description: Brief description of the client
        is_public: Whether to display on public website
        created_at: Timestamp when client was added
    """
    name = models.CharField(max_length=255, help_text="Client company name")
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
# Project Model (Client-specific)
# ================================
class Project(models.Model):
    """
    Represents a project completed for a specific client.
    
    Note: This is separate from the main 'projects' app Project model.
    This model is specifically for client-related projects.
    
    Fields:
        title: Project title
        description: Project description
        client: Foreign key to Client
        tech_stack: Comma-separated list of technologies used
        repo_url: Optional GitHub repository URL
        live_url: Optional live demo URL
        created_at: Timestamp when project was created
    """
    title = models.CharField(max_length=255)
    description = models.TextField()
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text="The client this project belongs to"
    )
    tech_stack = models.CharField(
        max_length=500,
        blank=True,
        help_text="Comma-separated list of technologies used"
    )
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.client.name}"

    def get_tech_stack_list(self):
        """Returns a list of technologies."""
        return [tech.strip() for tech in self.tech_stack.split(',')] if self.tech_stack else []

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Client Project"
        verbose_name_plural = "Client Projects"


# ================================
# Case Study Model
# ================================
class CaseStudy(models.Model):
    """
    Represents a detailed case study for a client project.
    
    Fields:
        title: Case study title
        client: Foreign key to Client
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
