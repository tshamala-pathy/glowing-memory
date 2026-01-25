from django.contrib import admin
from .models import Client, Project, CaseStudy

# ================================
# Client Admin
# ================================
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'is_public', 'created_at']
    list_filter = ['is_public', 'industry', 'created_at']
    search_fields = ['name', 'industry', 'description']
    list_editable = ['is_public']


# ================================
# Project Admin
# ================================
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'created_at']
    list_filter = ['client', 'created_at']
    search_fields = ['title', 'description', 'tech_stack']
    autocomplete_fields = ['client']


# ================================
# Case Study Admin
# ================================
@admin.register(CaseStudy)
class CaseStudyAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'is_public', 'created_at']
    list_filter = ['is_public', 'client', 'created_at']
    search_fields = ['title', 'problem', 'solution', 'result']
    list_editable = ['is_public']
    autocomplete_fields = ['client']
