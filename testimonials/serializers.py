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
        fields = ['id', 'name', 'position', 'company', 'testimonial', 'rating', 'image', 'is_featured', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_image(self, obj):
        """Return full image URL."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

