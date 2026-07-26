from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import InAppNotification

User = get_user_model()


class InAppNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InAppNotification
        fields = ['id', 'title', 'message', 'event_type', 'link', 'is_read', 'created_at']
        read_only_fields = fields


class AdminInAppNotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = InAppNotification
        fields = [
            'id', 'user', 'user_email', 'title', 'message', 'event_type',
            'link', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'user_email']
