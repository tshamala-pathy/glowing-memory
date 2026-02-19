from django.contrib import admin
from .models import ContactMessage

# Register your models here.

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """
    Admin configuration for ContactMessage model.
    """
    list_display = ('name', 'email', 'subject', 'status', 'client', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    list_filter = ('status', 'created_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_editable = ('status',)
