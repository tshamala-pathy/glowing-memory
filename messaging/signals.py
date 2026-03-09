from django.db.models.signals import post_save
from django.dispatch import receiver
from clients.models import Project
from .models import MessageThread


@receiver(post_save, sender=Project)
def create_message_thread_for_project(sender, instance, created, **kwargs):
    """Create one MessageThread per project when the project is created."""
    if not created:
        return
    if not instance.client_id:
        return
    if MessageThread.objects.filter(project=instance).exists():
        return
    MessageThread.objects.create(project=instance, client=instance.client)
