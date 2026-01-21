from django.contrib import admin
from django.utils.html import format_html
from .models import AboutUs, Value

class ValueInline(admin.TabularInline):
    """Inline admin for Value model."""
    model = Value
    extra = 1
    fields = ('title', 'description', 'icon', 'order')
    classes = ('collapse',)

@admin.register(AboutUs)
class AboutUsAdmin(admin.ModelAdmin):
    """Admin configuration for About Us model."""
    list_display = ('title', 'hero_title', 'image_preview', 'updated_at')
    list_filter = ('updated_at', 'created_at')
    search_fields = ('title', 'hero_title', 'our_story_content', 'mission_content', 'vision_content')
    fieldsets = (
        ('General Information', {
            'fields': ('title',)
        }),
        ('Hero Section', {
            'fields': ('hero_title', 'hero_subtitle', 'image'),
            'description': 'Main hero section displayed at the top of the About page'
        }),
        ('Our Story', {
            'fields': ('our_story_title', 'our_story_content'),
            'description': 'Tell your story and background'
        }),
        ('Mission & Vision', {
            'fields': ('mission_title', 'mission_content', 'vision_title', 'vision_content'),
            'description': 'Define your mission and vision statements'
        }),
        ('Why Choose Us', {
            'fields': ('why_choose_us_title', 'why_choose_us_content'),
            'description': 'Explain why clients should choose you'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    inlines = [ValueInline]
    readonly_fields = ('created_at', 'updated_at', 'image_preview')
    
    def image_preview(self, obj):
        """Display image preview in admin list."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Image"

@admin.register(Value)
class ValueAdmin(admin.ModelAdmin):
    """Admin configuration for Value model."""
    list_display = ('title', 'about_us', 'icon', 'order', 'created_at')
    list_filter = ('created_at', 'about_us')
    search_fields = ('title', 'description')
    list_editable = ('order',)
    fields = ('about_us', 'title', 'description', 'icon', 'order')
    ordering = ('about_us', 'order', 'created_at')
