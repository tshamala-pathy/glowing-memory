from django.contrib import admin
from .models import Testimonial

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'rating', 'is_featured', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'is_featured', 'rating', 'created_at']
    search_fields = ['name', 'company', 'testimonial']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_approved', 'is_featured']
