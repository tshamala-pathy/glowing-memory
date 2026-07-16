import os

from django.db import models
from django.conf import settings


class SharedFile(models.Model):
    """File shared between client and admin, optionally linked to a project."""

    project = models.ForeignKey(
        'clients.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shared_files',
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='shared_files',
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_shared_files',
    )
    file = models.FileField(upload_to='shared_files/%Y/%m/')
    name = models.CharField(max_length=255, blank=True)
    description = models.CharField(max_length=500, blank=True)
    mime_type = models.CharField(max_length=120, blank=True)
    is_client_visible = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def save(self, *args, **kwargs):
        if not self.name and self.file:
            self.name = os.path.basename(self.file.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name or f'File {self.pk}'
