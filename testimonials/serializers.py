from rest_framework import serializers
from .models import Testimonial

class TestimonialSerializer(serializers.ModelSerializer):
    """
    Serializer for Testimonial model.
    """
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'position', 'company', 'testimonial', 'rating', 'image', 'is_featured', 'created_at']
        read_only_fields = ['id', 'created_at']

