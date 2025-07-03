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
        created_at (datetime): Timestamp when the project was created.
    """
    title = models.CharField(max_length=255)
    description = models.TextField()
    technologies = models.CharField(max_length=255)
    image = models.ImageField(upload_to='projects/', blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """
        Returns a string representation of the project instance.
        Useful for displaying the object in Django admin or shell.

        Returns:
            str: The title of the project.
        """
        return self.title
