from rest_framework import serializers
from .models import Project

# 📌 Serializer for the Project model.
class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer to convert Project model instances into JSON format
    and validate incoming project data.
    Converts technologies and tags from comma-separated strings to arrays.
    Returns full image URLs.
    """
    technologies = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'technologies', 'image', 'tags', 'status', 'category', 'github_url', 'live_url', 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at')
    
    def get_technologies(self, obj):
        """Return technologies as a list."""
        return obj.get_technologies_list()
    
    def get_tags(self, obj):
        """Return tags as a list."""
        return obj.get_tags_list()
    
    def get_image(self, obj):
        """Return full image URL."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
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