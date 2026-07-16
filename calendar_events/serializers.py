from rest_framework import serializers
from .models import CalendarEvent


class CalendarEventSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)

    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'user', 'project', 'project_name', 'title', 'description',
            'event_type', 'start_at', 'end_at', 'all_day', 'reminder_minutes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'user']
