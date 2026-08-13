from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import WorkTask

User = get_user_model()


class WorkTaskAssigneeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'name', 'is_staff']
        read_only_fields = fields

    def get_name(self, obj):
        return obj.get_full_name() or obj.email


class WorkTaskSerializer(serializers.ModelSerializer):
    assignee_names = serializers.SerializerMethodField()
    assignees_detail = WorkTaskAssigneeSerializer(source='assignees', many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignees = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(is_active=True),
        required=False,
    )

    class Meta:
        model = WorkTask
        fields = [
            'id', 'project', 'project_name', 'title', 'description',
            'assignees', 'assignees_detail', 'assignee_names',
            'created_by', 'created_by_name',
            'status', 'priority', 'progress', 'due_date', 'completed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'completed_at']

    def get_assignee_names(self, obj):
        return [
            user.get_full_name() or user.email
            for user in obj.assignees.all()
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None

    def validate_progress(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Progress must be between 0 and 100.')
        return value

    def validate_assignees(self, value):
        if not value:
            return value
        inactive = [u.email for u in value if not u.is_active]
        if inactive:
            raise serializers.ValidationError(
                f'Inactive users cannot be assigned: {", ".join(inactive)}'
            )
        return value
