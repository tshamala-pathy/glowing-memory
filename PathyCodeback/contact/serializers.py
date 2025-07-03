from rest_framework import serializers
from .models import ContactMessage

class ContactMessageSerializer(serializers.ModelSerializer):
    """
    📦 ContactMessageSerializer

    This serializer handles the conversion between ContactMessage model instances
    and JSON representations. It's used for validating and serializing contact form data
    in the API layer.

    Meta:
        model (ContactMessage): The model to serialize.
        fields ('__all__'): Includes all model fields: name, email, subject, message, and created_at.
    """
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['created_at']