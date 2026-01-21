from django.contrib import admin
from .models import Service

# Register your models here.

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at',)
    fields = ('name', 'description', 'price', 'features', 'categories', 'icon')