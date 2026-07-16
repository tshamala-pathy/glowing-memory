from django.contrib import admin
from .models import InAppNotification


@admin.register(InAppNotification)
class InAppNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'event_type', 'is_read', 'created_at')
    list_filter = ('event_type', 'is_read')
    search_fields = ('title', 'message', 'user__email')
