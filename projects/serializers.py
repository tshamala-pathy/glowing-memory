from rest_framework import serializers
from .models import Project

# ================================
# Project Serializer
# ================================

class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model.
    
    Handles conversion between Project model instances and JSON format.
    Key features:
    - Converts comma-separated technologies and tags strings to arrays for frontend consumption
    - Builds absolute image URLs using request context for proper media file serving
    - Validates project data on create/update operations
    - Allows image uploads via API (ImageField is writable, URL conversion in to_representation)
    """
    # Use SerializerMethodField to customize how these fields are serialized
    technologies = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    # Image field is directly included (writable) - URL conversion happens in to_representation
    # This matches the BlogPostSerializer pattern that works correctly

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'technologies', 'image', 'tags', 'status', 'category', 'github_url', 'live_url', 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at')
    
    def get_technologies(self, obj):
        """
        Convert comma-separated technologies string to a list.
        
        Args:
            obj: Project instance
            
        Returns:
            list: Array of technology strings
        """
        return obj.get_technologies_list()
    
    def get_tags(self, obj):
        """
        Convert comma-separated tags string to a list.
        
        Args:
            obj: Project instance
            
        Returns:
            list: Array of tag strings
        """
        return obj.get_tags_list()
    
    def to_representation(self, instance):
        """Convert image field to absolute URL so frontend can display it cross-origin."""
        ret = super().to_representation(instance)
        if instance.image:
            try:
                path = instance.image.url
                if not path.startswith('/'):
                    path = '/' + path
                request = self.context.get('request')
                if request:
                    ret['image'] = request.build_absolute_uri(path)
                else:
                    from django.conf import settings
                    base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
                    ret['image'] = f'{base}{path}'
            except (ValueError, AttributeError):
                ret['image'] = None
        else:
            ret['image'] = None
        return ret
    
    def to_internal_value(self, data):
        """Convert technologies and tags lists to comma-separated strings for storage."""
        if 'technologies' in data and isinstance(data['technologies'], list):
            data = data.copy()
            data['technologies'] = ','.join([str(tech) for tech in data['technologies']])
        if 'tags' in data and isinstance(data['tags'], list):
            data = data.copy()
            data['tags'] = ','.join([str(tag) for tag in data['tags']])
        return super().to_internal_value(data)
    