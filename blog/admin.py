from django.contrib import admin
from .models import BlogPost

# Register your models here.

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    """
    Custom admin interface for BlogPost model.

    Displays key fields and allows filtering and searching in the admin panel.
    """
    list_display = ('title', 'category', 'created_at')      # Fields shown in the list view
    search_fields = ('title', 'body', 'category', 'tags')   # Enable search by these fields
    list_filter = ('category', 'created_at')                # Enable filtering in sidebar
    ordering = ('-created_at',)                             # Default ordering
