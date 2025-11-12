from django.db import models

# 📌 Model for storing project details.
class Project(models.Model):
    """
    Represents a project entry in the portfolio.

    Fields:
        title (str): The title of the project.
        description (str): A detailed description of the project.
        technologies (str): Comma-separated list of technologies used.
        image (ImageField): Optional image for the project.
        tags (str): Optional tags for categorizing the project.
        status (str): Project status (Completed, In Progress, Planned).
        category (str): Project category (Web, Mobile, Desktop, etc.).
        github_url (str): Optional GitHub repository URL.
        live_url (str): Optional live demo URL.
        created_at (datetime): Timestamp when the project was created.
    """
    STATUS_CHOICES = [
        ('Completed', 'Completed'),
        ('In Progress', 'In Progress'),
        ('Planned', 'Planned'),
    ]
    
    CATEGORY_CHOICES = [
        ('Web', 'Web Development'),
        ('Mobile', 'Mobile Development'),
        ('Desktop', 'Desktop Application'),
        ('API', 'API Development'),
        ('Other', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    technologies = models.CharField(max_length=255, help_text="Comma-separated list of technologies")
    image = models.ImageField(upload_to='projects/', blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Web')
    github_url = models.URLField(blank=True, null=True)
    live_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Returns a string representation of the project instance.
        Useful for displaying the object in Django admin or shell.

        Returns:
            str: The title of the project.
        """
        return self.title
    
    def get_technologies_list(self):
        """Returns a list of technologies."""
        return [tech.strip() for tech in self.technologies.split(',')] if self.technologies else []
    
    def get_tags_list(self):
        """Returns a list of tags."""
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Project"
        verbose_name_plural = "Projects"
