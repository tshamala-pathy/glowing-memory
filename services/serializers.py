from rest_framework import serializers
import json
from .models import Service

# ✅ Serializer for the Service model to handle conversion between model instances and JSON.
class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Service model.
    
    This serializer automatically generates fields from the Service model
    and is used to validate and transform input/output for API views.
    Includes methods to convert features and categories to lists.
    """
    features = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'price', 'features', 'categories', 'icon', 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at')  # Prevents modification of timestamps through the API
    
    def get_features(self, obj):
        """Return features as a list."""
        return obj.get_features_list()
    
    def get_categories(self, obj):
        """Return categories as a list of objects with id and name."""
        categories_list = obj.get_categories_list()
        return [{'id': idx, 'name': cat} for idx, cat in enumerate(categories_list)]
    
    def to_representation(self, instance):
        """Ensure name is returned even if title exists (for migration compatibility)."""
        ret = super().to_representation(instance)
        # Handle migration: if name is default and title exists, use title
        if ret.get('name') == 'Service' and instance.title:
            ret['name'] = instance.title
        return ret
    
    def to_internal_value(self, data):
        """Convert features list to JSON string for storage."""
        if 'features' in data and isinstance(data['features'], list):
            data = data.copy()
            data['features'] = json.dumps(data['features'])
        if 'categories' in data and isinstance(data['categories'], list):
            data = data.copy()
            data['categories'] = ','.join([cat.get('name', cat) if isinstance(cat, dict) else str(cat) for cat in data['categories']])
        return super().to_internal_value(data)