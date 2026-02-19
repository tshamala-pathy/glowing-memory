from rest_framework import serializers
from .models import BlogPost

class BlogPostSerializer(serializers.ModelSerializer):
    """
    Serializer for the BlogPost model.

    Handles converting BlogPost instances to and from JSON representations for use in the API.
    Converts tags from comma-separated string to array.
    Includes featured_image as absolute URL for frontend display.
    """
    tags = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'body', 'category', 'tags', 'featured_image', 'created_at']
        read_only_fields = ['created_at', 'id']

        # Custom error messages for required fields
        extra_kwargs = {
            'title': {
                'error_messages': {
                    'blank': 'Title cannot be blank.'
                }
            },
            'body': {
                'error_messages': {
                    'blank': 'Body cannot be blank.'
                }
            },
            'category': {
                'error_messages': {
                    'blank': 'Category cannot be blank.'
                }
            },
        }

    def to_representation(self, instance):
        """Output featured_image as absolute URL so frontend can display it cross-origin."""
        ret = super().to_representation(instance)
        if instance.featured_image:
            try:
                request = self.context.get('request')
                path = instance.featured_image.url
                if not path.startswith('/'):
                    path = '/' + path
                if request:
                    ret['featured_image'] = request.build_absolute_uri(path)
                else:
                    from django.conf import settings
                    base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
                    ret['featured_image'] = f'{base}{path}'
            except (ValueError, AttributeError):
                ret['featured_image'] = None
        else:
            ret['featured_image'] = None
        return ret
    
    def get_tags(self, obj):
        """Return tags as a list."""
        return obj.get_tags_list()
    
    def to_internal_value(self, data):
        """Convert tags list to comma-separated string for storage."""
        if 'tags' in data and isinstance(data['tags'], list):
            data = data.copy()
            data['tags'] = ','.join([str(tag) for tag in data['tags']])
        return super().to_internal_value(data)
