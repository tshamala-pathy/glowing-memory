from rest_framework import serializers

from users.media_urls import absolute_media_url
from .models import Testimonial

class TestimonialSerializer(serializers.ModelSerializer):
    """
    Serializer for Testimonial model.

    ``image`` is the photo shown publicly: testimonial upload, or the linked
    client's account profile picture when no testimonial-specific image exists.
    """

    image = serializers.SerializerMethodField()
    client_avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            'id',
            'name',
            'position',
            'company',
            'testimonial',
            'rating',
            'image',
            'client_avatar_url',
            'is_featured',
            'is_approved',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        is_admin = request and request.user.is_authenticated and request.user.is_superuser
        if not is_admin:
            self.fields['is_approved'].read_only = True
            self.fields['is_featured'].read_only = True

    def create(self, validated_data):
        request = self.context.get('request')
        is_admin = request and request.user.is_authenticated and request.user.is_superuser
        if not is_admin:
            validated_data['is_approved'] = False
            validated_data['is_featured'] = False
        return super().create(validated_data)

    def _client_user(self, obj):
        if not obj.client_id:
            return None
        client = obj.client
        if client and getattr(client, 'user_id', None):
            return client.user
        return None

    def get_client_avatar_url(self, obj):
        user = self._client_user(obj)
        if not user or not user.avatar:
            return None
        request = self.context.get('request')
        return absolute_media_url(request, user.avatar)

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return absolute_media_url(request, obj.image)
        user = self._client_user(obj)
        if user and user.avatar:
            return absolute_media_url(request, user.avatar)
        return None
