from rest_framework import serializers
from .models import NewsletterSubscription

class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for Newsletter Subscription model.
    """
    class Meta:
        model = NewsletterSubscription
        fields = ['id', 'email', 'name', 'subscribed_at', 'is_active']
        read_only_fields = ['id', 'subscribed_at', 'is_active']

