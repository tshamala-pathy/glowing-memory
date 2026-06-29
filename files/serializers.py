from rest_framework import serializers
from .models import SharedFile


class SharedFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    previewable = serializers.SerializerMethodField()

    class Meta:
        model = SharedFile
        fields = [
            'id', 'project', 'client', 'uploaded_by', 'uploaded_by_name',
            'file', 'file_url', 'name', 'description', 'mime_type',
            'is_client_visible', 'previewable', 'uploaded_at',
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'client', 'mime_type']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.email
        return None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

    def get_previewable(self, obj):
        mt = (obj.mime_type or '').lower()
        if not mt and obj.file:
            mt = obj.file.name.rsplit('.', 1)[-1].lower()
        return mt.startswith('image/') or mt in ('pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp')
