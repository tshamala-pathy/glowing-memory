from rest_framework import serializers
from .models import Service

# ✅ Serializer for the Service model to handle conversion between model instances and JSON.
class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Service model.
    
    This serializer automatically generates fields from the Service model
    and is used to validate and transform input/output for API views.
    """

    class Meta:
        model = Service
        fields = '__all__'  # Includes all model fields in the API
        read_only_fields = ('created_at',)  # Prevents modification of created_at through the API
        """
        Metadata options for the ServiceSerializer.
        
        - `model`: Specifies the model to serialize.
        - `fields`: Uses all fields from the model.
        - `read_only_fields`: Marks 'created_at' as read-only to prevent modification via API.
        """