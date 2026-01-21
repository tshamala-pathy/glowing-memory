from rest_framework import serializers
from .models import AboutUs, Value

class ValueSerializer(serializers.ModelSerializer):
    """
    Serializer for Value model.
    """
    class Meta:
        model = Value
        fields = ['id', 'title', 'description', 'icon', 'order']

class AboutUsSerializer(serializers.ModelSerializer):
    """
    Serializer for About Us model.
    Includes related values.
    """
    values = ValueSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = AboutUs
        fields = [
            'id', 'title', 'hero_title', 'hero_subtitle',
            'our_story_title', 'our_story_content',
            'mission_title', 'mission_content',
            'vision_title', 'vision_content',
            'why_choose_us_title', 'why_choose_us_content',
            'image', 'values', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image(self, obj):
        """Return full image URL."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

