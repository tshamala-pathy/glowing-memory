from rest_framework import serializers
from .models import WorkTask


class WorkTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = WorkTask
        fields = [
            'id', 'project', 'project_name', 'title', 'description',
            'assigned_to', 'assigned_to_name', 'created_by', 'status',
            'progress', 'due_date', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.email
        return None
