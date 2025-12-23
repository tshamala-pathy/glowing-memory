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
    """
    # Use SerializerMethodField to customize how these fields are serialized
    technologies = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

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
    
    def get_image(self, obj):
        """
        Build and return absolute URL for project image.
        
        Media files need absolute URLs so the frontend can properly load images
        from the Django backend server. This method constructs the full URL
        using the request's scheme (http/https) and host (domain:port).
        
        Args:
            obj: Project instance with an optional image field
            
        Returns:
            str: Absolute URL to the image (e.g., 'http://localhost:8000/media/projects/image.jpg')
            None: If no image is associated with the project
        """
        if obj.image:
            request = self.context.get('request')
            if request:
                # Build absolute URL with proper scheme and domain
                # This ensures images load correctly from any client origin
                scheme = request.scheme  # http or https
                host = request.get_host()  # localhost:8000 or production domain
                image_path = obj.image.url  # e.g., '/media/projects/image.jpg'
                
                # Ensure image_path starts with / for proper URL construction
                if not image_path.startswith('/'):
                    image_path = '/' + image_path
                
                return f"{scheme}://{host}{image_path}"
            
            # Fallback: return relative URL if no request context
            # This shouldn't normally happen, but provides graceful degradation
            return obj.image.url
        return None
    
    def to_internal_value(self, data):
        """Convert technologies and tags lists to comma-separated strings for storage."""
        if 'technologies' in data and isinstance(data['technologies'], list):
            data = data.copy()
            data['technologies'] = ','.join([str(tech) for tech in data['technologies']])
        if 'tags' in data and isinstance(data['tags'], list):
            data = data.copy()
            data['tags'] = ','.join([str(tag) for tag in data['tags']])
        return super().to_internal_value(data)