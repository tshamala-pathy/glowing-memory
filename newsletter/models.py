from django.db import models

# Newsletter Subscription Model
class NewsletterSubscription(models.Model):
    """
    Model for storing newsletter subscriptions.
    
    Fields:
        email (str): Subscriber's email address (unique)
        name (str): Optional subscriber's name
        subscribed_at (datetime): When the subscription was created
        is_active (bool): Whether the subscription is active
        subscribed_ip (str): IP address of subscriber (optional)
    """
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    subscribed_ip = models.GenericIPAddressField(blank=True, null=True)

    def __str__(self):
        return self.email

    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = "Newsletter Subscription"
        verbose_name_plural = "Newsletter Subscriptions"
