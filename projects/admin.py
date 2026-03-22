from django.contrib import admin
from django.utils.html import format_html
from .models import Project

# Register your models here.
# Admin configuration for the Project model.

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'category', 'created_at', 'has_image', 'image_preview')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'description', 'technologies', 'tags')
    fields = ('title', 'description', 'technologies', 'tags', 'status', 'category', 'image', 'image_preview', 'github_url', 'live_url')
    readonly_fields = ('created_at', 'updated_at', 'image_preview')
    
    def save_model(self, request, obj, form, change):
        """Save project; Django handles image upload via the model form."""
        super().save_model(request, obj, form, change)
    
    def has_image(self, obj):
        """Display whether the project has an image."""
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Has Image'
    
    def image_preview(self, obj):
        """Display image preview in admin."""
        if obj.image:
            try:
                return format_html(
                    '<img src="{}" style="max-height: 100px; max-width: 100px; object-fit: cover; border-radius: 4px;" />',
                    obj.image.url
                )
            except (ValueError, AttributeError):
                return "Image file missing"
        return "No image"
    image_preview.short_description = 'Image Preview'
