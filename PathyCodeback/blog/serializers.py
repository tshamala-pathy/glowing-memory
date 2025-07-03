from rest_framework import serializers
from .models import BlogPost

class BlogPostSerializer(serializers.ModelSerializer):
    """
    Serializer for the BlogPost model.

    Handles converting BlogPost instances to and from JSON representations for use in the API.
    Includes validation rules and custom error messages.
    """

    class Meta:
        model = BlogPost
        fields = '__all__'  # Include all fields from the model

        # Make `created_at` read-only to prevent users from setting it manually
        read_only_fields = ['created_at']

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
