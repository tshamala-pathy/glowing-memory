"""
Serializers for project-scoped messaging threads and chat messages.

Nested thread detail returns messages with absolute attachment URLs when ``request``
is present in serializer context (see :class:`MessageThreadDetailSerializer`).
"""
from rest_framework import serializers
from .models import MessageThread, Message
from .backgrounds import (
    COVER_PRESETS,
    WALLPAPER_PRESETS,
    DEFAULT_COVER_PRESET,
    DEFAULT_WALLPAPER_PRESET,
    MAX_IMAGE_BYTES,
    resolve_cover_url,
    resolve_wallpaper_url,
    user_can_edit_thread_background,
)


class MessageSerializer(serializers.ModelSerializer):
    """
    One chat row: sender display fields, content, file metadata, and download/media URLs.

    ``has_attachment`` lets the client show file UI even when URL shapes differ.
    Thread detail uses ``MessageThreadDetailSerializer.get_messages`` with ``context=self.context``
    so nested rows receive ``request`` for absolute media/download URLs.
    """
    sender_email = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    attachment_media_url = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    has_attachment = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'sender_email', 'sender_name', 'sender_role',
            'content', 'attachment', 'has_attachment', 'attachment_media_url', 'attachment_url', 'attachment_name', 'created_at',
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

    def get_has_attachment(self, obj):
        """Whether a file is stored (not only placeholder content ``(attachment)``)."""
        return bool(obj.attachment)

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
    background_display_url = serializers.SerializerMethodField()
    has_custom_background = serializers.SerializerMethodField()
    wallpaper_preset = serializers.CharField(read_only=True)
    wallpaper_display_url = serializers.SerializerMethodField()
    has_custom_wallpaper = serializers.SerializerMethodField()
    can_edit_background = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = [
            'id', 'project', 'project_id', 'project_name',
            'client', 'client_name', 'created_at', 'updated_at',
            'last_message_preview', 'last_message_at', 'message_count',
            'background_preset', 'background_display_url', 'has_custom_background',
            'wallpaper_preset', 'wallpaper_display_url', 'has_custom_wallpaper',
            'can_edit_background',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'background_display_url',
            'has_custom_background', 'wallpaper_display_url', 'has_custom_wallpaper',
            'can_edit_background',
        ]

    def get_can_edit_background(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return user_can_edit_thread_background(request.user, obj)

    def get_background_display_url(self, obj):
        request = self.context.get('request')
        return resolve_cover_url(obj, request)

    def get_has_custom_background(self, obj):
        return bool(obj.background_image)

    def get_wallpaper_display_url(self, obj):
        request = self.context.get('request')
        return resolve_wallpaper_url(obj, request)

    def get_has_custom_wallpaper(self, obj):
        return bool(obj.wallpaper_image)

    def get_last_message_preview(self, obj):
        """Snippet for inbox lists: prefer filename for attachments; map legacy ``(attachment)`` text."""
        last = obj.messages.order_by('-created_at').first()
        if not last:
            return None
        if last.attachment:
            name = last.attachment.name.split('/')[-1]
            return f'📎 {name}' if name else '📎 Attachment'
        text = (last.content or '').strip()
        if text == '(attachment)':
            return '📎 Attachment'
        return (text[:80] + '...') if len(text) > 80 else text

    def get_last_message_at(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else obj.updated_at

    def get_message_count(self, obj):
        return obj.messages.count()


class MessageThreadBackgroundSerializer(serializers.ModelSerializer):
    """PATCH body for sidebar cover (background_*) and chat wallpaper (wallpaper_*)."""

    clear_background_image = serializers.BooleanField(required=False, write_only=True, default=False)
    clear_wallpaper_image = serializers.BooleanField(required=False, write_only=True, default=False)

    class Meta:
        model = MessageThread
        fields = [
            'background_preset', 'background_image', 'clear_background_image',
            'wallpaper_preset', 'wallpaper_image', 'clear_wallpaper_image',
        ]

    def validate_background_preset(self, value):
        if not value:
            return None
        if value == 'custom':
            return value
        if value not in COVER_PRESETS:
            raise serializers.ValidationError('Invalid cover preset.')
        return value

    def validate_wallpaper_preset(self, value):
        if not value:
            return None
        if value == 'custom':
            return value
        if value not in WALLPAPER_PRESETS:
            raise serializers.ValidationError('Invalid wallpaper preset.')
        return value

    def validate_background_image(self, value):
        return self._validate_image(value)

    def validate_wallpaper_image(self, value):
        return self._validate_image(value)

    def _validate_image(self, value):
        if not value:
            return value
        content_type = getattr(value, 'content_type', '') or ''
        if not content_type.startswith('image/'):
            raise serializers.ValidationError('Upload an image file (PNG, JPG, WebP, etc.).')
        if value.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError('Image must be 5 MB or smaller.')
        return value

    def _apply_image_field(self, instance, *, image_field, preset_field, image, preset, clear_custom, default_preset):
        if image:
            existing = getattr(instance, image_field)
            if existing:
                existing.delete(save=False)
            setattr(instance, image_field, image)
            setattr(instance, preset_field, 'custom')
        elif clear_custom and getattr(instance, image_field):
            getattr(instance, image_field).delete(save=False)
            setattr(instance, image_field, None)
            if preset:
                setattr(instance, preset_field, preset)
            else:
                setattr(instance, preset_field, default_preset)
        elif preset and preset != 'custom':
            existing = getattr(instance, image_field)
            if existing:
                existing.delete(save=False)
                setattr(instance, image_field, None)
            setattr(instance, preset_field, preset)

    def update(self, instance, validated_data):
        cover_preset = validated_data.get('background_preset')
        cover_image = validated_data.get('background_image')
        clear_cover = validated_data.pop('clear_background_image', False)
        wallpaper_preset = validated_data.get('wallpaper_preset')
        wallpaper_image = validated_data.get('wallpaper_image')
        clear_wallpaper = validated_data.pop('clear_wallpaper_image', False)

        if any(k in validated_data for k in ('background_preset', 'background_image')) or clear_cover:
            self._apply_image_field(
                instance,
                image_field='background_image',
                preset_field='background_preset',
                image=cover_image,
                preset=cover_preset,
                clear_custom=clear_cover,
                default_preset=DEFAULT_COVER_PRESET,
            )

        if any(k in validated_data for k in ('wallpaper_preset', 'wallpaper_image')) or clear_wallpaper:
            self._apply_image_field(
                instance,
                image_field='wallpaper_image',
                preset_field='wallpaper_preset',
                image=wallpaper_image,
                preset=wallpaper_preset,
                clear_custom=clear_wallpaper,
                default_preset=DEFAULT_WALLPAPER_PRESET,
            )

        instance.save()
        return instance


class MessageThreadDetailSerializer(MessageThreadSerializer):
    """Thread including ordered ``messages`` (timeline). Nested serializer receives parent ``context``."""
    messages = serializers.SerializerMethodField()

    class Meta(MessageThreadSerializer.Meta):
        fields = MessageThreadSerializer.Meta.fields + ['messages']

    def get_messages(self, obj):
        qs = obj.messages.all().order_by('created_at')
        return MessageSerializer(qs, many=True, context=self.context).data
