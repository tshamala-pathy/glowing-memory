from django.contrib import admin
from .models import WorkTask


@admin.register(WorkTask)
class WorkTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'assigned_to', 'due_date', 'progress')
    list_filter = ('status',)
