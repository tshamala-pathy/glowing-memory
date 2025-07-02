from django.db import models

# Create your models here.

# 📌 Model for storing project details.
class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    technologies = models.CharField(max_length=255)
    image = models.ImageField(upload_to='projects/', blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
