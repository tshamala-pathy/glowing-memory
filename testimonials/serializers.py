from rest_framework import serializers
from .models import Testimonial

class TestimonialSerializer(serializers.ModelSerializer):
    """
    Serializer for Testimonial model.
    Returns full image URLs.
    """
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'position', 'company', 'testimonial', 'rating', 'image', 'is_featured', 'is_approved', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_approved', 'is_featured']
    
    def get_image(self, obj):
        """Return absolute image URL for frontend display."""
        if not obj.image:
            return None
        try:
            path = obj.image.url
            if not path.startswith('/'):
                path = '/' + path
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(path)
            from django.conf import settings
            base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
            return f'{base}{path}'
        except (ValueError, AttributeError):
            return None

