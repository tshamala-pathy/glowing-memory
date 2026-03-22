from django.contrib import admin
from django.utils.html import format_html
from django.conf import settings
from .models import MessageThread, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 1
    readonly_fields = ['created_at']
    ordering = ['created_at']
    verbose_name = 'Message'
    verbose_name_plural = 'Messages (admin can add a reply below; sender defaults to you)'

    def get_formset(self, request, obj=None, **kwargs):
        formset_class = super().get_formset(request, obj=None, **kwargs)
        _request = request

        class MessageFormSet(formset_class):
            def _construct_form(self, i, **kwargs):
                form = super()._construct_form(i, **kwargs)
                if not form.instance.pk and getattr(self, '_request', None):
                    form.initial.setdefault('sender', _request.user.pk)
                return form

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._request = _request

        return MessageFormSet


@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'client', 'open_chat_link', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['project__name', 'client__name']
    inlines = [MessageInline]
    raw_id_fields = ['project', 'client']

    def open_chat_link(self, obj):
        if not obj.pk:
            return ''
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        url = f'{frontend_url}/messages/{obj.pk}'
        return format_html('<a href="{}" target="_blank" rel="noopener">Open chat</a>', url)
    open_chat_link.short_description = 'Frontend chat'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread', 'sender', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'sender__email']
    raw_id_fields = ['thread', 'sender']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return (obj.content or '')[:60] + ('...' if len(obj.content or '') > 60 else '')
    content_preview.short_description = 'Content'
