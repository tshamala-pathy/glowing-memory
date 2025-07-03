from django.db import models

# Create your models here.

class ContactMessage(models.Model):
    """
    📬 ContactMessage Model

    This model stores messages submitted through a contact form.
    It captures the sender's name, email, subject, message content,
    and the timestamp when the message was created.

    Fields:
        name (CharField): The name of the person sending the message.
        email (EmailField): The email address of the sender.
        subject (CharField): The subject line of the message.
        message (TextField): The main content/body of the message.
        created_at (DateTimeField): The timestamp when the message was created.
    """

    name = models.CharField(max_length=100)  # Sender's name
    email = models.EmailField()  # Sender's email address
    subject = models.CharField(max_length=150)  # Subject of the message
    message = models.TextField()  # The actual message content
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set on creation

    def __str__(self):
        """
        String representation of the ContactMessage model.
        Returns a combination of the sender's name and the subject.
        """
        return f"{self.name} - {self.subject}"
    class Meta:
        """
        Meta options for the ContactMessage model.
        """
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"
        ordering = ['-created_at']