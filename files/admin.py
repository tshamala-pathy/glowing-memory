from django.contrib import admin
from .models import SharedFile


@admin.register(SharedFile)
class SharedFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'client', 'project', 'uploaded_by', 'uploaded_at')
    list_filter = ('is_client_visible',)
