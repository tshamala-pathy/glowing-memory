from django.contrib import admin

from .models import WorkTask


@admin.register(WorkTask)
class WorkTaskAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'project', 'status', 'priority',
        'due_date', 'progress', 'completed_at',
    )
    list_filter = ('status', 'priority')
    search_fields = ('title', 'description', 'assignees__email')
    filter_horizontal = ('assignees',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
