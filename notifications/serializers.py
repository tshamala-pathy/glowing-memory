from rest_framework import serializers
from .models import InAppNotification


class InAppNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InAppNotification
        fields = ['id', 'title', 'message', 'event_type', 'link', 'is_read', 'created_at']
        read_only_fields = fields
