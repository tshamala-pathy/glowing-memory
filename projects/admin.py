from django.contrib import admin
from .models import Project

# Register your models here.
# 📌 Admin configuration for the Project model.

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'category', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'description', 'technologies', 'tags')
    fields = ('title', 'description', 'technologies', 'tags', 'status', 'category', 'image', 'github_url', 'live_url')
    readonly_fields = ('created_at', 'updated_at')
