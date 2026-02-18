from rest_framework import serializers
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for the ContactMessage model.
    Converts ContactMessage instances to and from JSON.
    """
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'client')
