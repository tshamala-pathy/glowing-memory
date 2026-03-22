from rest_framework import serializers
from .models import MessageThread, Message


class MessageSerializer(serializers.ModelSerializer):
    """Single message with sender info and optional attachment URL. Handles null sender (e.g. admin-added)."""
    sender_email = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    attachment_media_url = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'sender_email', 'sender_name', 'sender_role',
            'content', 'attachment', 'attachment_media_url', 'attachment_url', 'attachment_name', 'created_at',
        ]
        read_only_fields = ['sender', 'created_at']

    def get_sender_email(self, obj):
        if not obj.sender:
            return None
        return obj.sender.email

    def get_sender_name(self, obj):
        if not obj.sender:
            return None
        # Prefer a real name; fall back to email
        name = obj.sender.get_full_name() or obj.sender.first_name or obj.sender.email
        return (name or '').strip() or obj.sender.email

    def get_sender_role(self, obj):
        """Return 'admin' for staff/superuser senders, 'client' otherwise."""
        if not obj.sender:
            return None
        if getattr(obj.sender, 'is_staff', False) or getattr(obj.sender, 'is_superuser', False):
            return 'admin'
        return 'client'

    def get_attachment_media_url(self, obj):
        """Direct media URL for inline display (e.g. <img src=...>)."""
        if not obj.attachment:
            return None
        url = obj.attachment.url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
        if url.startswith('http://') or url.startswith('https://'):
            return url
        return f'{base}{url if url.startswith('/') else '/' + url}'

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/messaging/messages/{obj.id}/download_attachment/')
        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
        return f'{base}/api/messaging/messages/{obj.id}/download_attachment/'

    def get_attachment_name(self, obj):
        if not obj.attachment:
            return None
        return obj.attachment.name.split('/')[-1]

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class MessageThreadSerializer(serializers.ModelSerializer):
    """Thread with project/client info and last activity."""
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    last_message_preview = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = [
            'id', 'project', 'project_id', 'project_name',
            'client', 'client_name', 'created_at', 'updated_at',
            'last_message_preview', 'last_message_at', 'message_count',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_last_message_preview(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if not last:
            return None
        text = (last.content or '').strip()
        return (text[:80] + '...') if len(text) > 80 else text

    def get_last_message_at(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else obj.updated_at

    def get_message_count(self, obj):
        return obj.messages.count()


class MessageThreadDetailSerializer(MessageThreadSerializer):
    """Thread with full message history (timeline)."""
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(MessageThreadSerializer.Meta):
        fields = MessageThreadSerializer.Meta.fields + ['messages']
