from django.db.models import Q
from django.utils import timezone
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import WorkTask
from .serializers import WorkTaskSerializer


class WorkTaskViewSet(viewsets.ModelViewSet):
    serializer_class = WorkTaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'priority', 'assignees']
    search_fields = ['title', 'description', 'assignees__email', 'assignees__first_name', 'assignees__last_name']
    ordering_fields = ['due_date', 'created_at', 'priority', 'status', 'progress']
    ordering = ['due_date', '-created_at']

    def get_queryset(self):
        qs = WorkTask.objects.select_related('project', 'created_by').prefetch_related('assignees')
        user = self.request.user
        if user.is_superuser:
            return qs
        if user.is_staff:
            return qs.filter(Q(assignees=user) | Q(created_by=user)).distinct()
        profile = getattr(user, 'client_profile', None)
        if profile:
            return qs.filter(project__client=profile)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        project = serializer.validated_data.get('project')
        if not (user.is_staff or user.is_superuser):
            profile = getattr(user, 'client_profile', None)
            if not profile or project.client_id != profile.id:
                raise PermissionDenied('Not allowed')
        extra = {'created_by': user}
        if serializer.validated_data.get('status') == WorkTask.STATUS_COMPLETED:
            extra['completed_at'] = timezone.now()
            if serializer.validated_data.get('progress', 0) < 100:
                extra['progress'] = 100
        serializer.save(**extra)

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get('status', instance.status)
        extra = {}
        if new_status == WorkTask.STATUS_COMPLETED and instance.status != WorkTask.STATUS_COMPLETED:
            extra['completed_at'] = timezone.now()
            if serializer.validated_data.get('progress', instance.progress) < 100:
                extra['progress'] = 100
        elif new_status != WorkTask.STATUS_COMPLETED and instance.status == WorkTask.STATUS_COMPLETED:
            extra['completed_at'] = None
        serializer.save(**extra)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """Export all work tasks as CSV. Admin/staff only."""
        from PathyCodeback.csv_export import branded_csv_response

        response, writer = branded_csv_response(
            'work_tasks.csv',
            'Work Tasks Export',
            'Staff work tasks with team assignees, priority, progress, and due dates.',
        )
        writer.writerow([
            'ID', 'Project', 'Title', 'Status', 'Priority', 'Progress',
            'Assignees', 'Due Date', 'Completed At', 'Created By', 'Created At',
        ])
        for task in WorkTask.objects.select_related(
            'project', 'created_by',
        ).prefetch_related('assignees').order_by('id'):
            assignee_labels = [
                u.get_full_name() or u.email for u in task.assignees.all()
            ]
            writer.writerow([
                task.id,
                task.project.name if task.project else '',
                task.title,
                task.status,
                task.priority,
                task.progress,
                '; '.join(assignee_labels),
                task.due_date.isoformat() if task.due_date else '',
                task.completed_at.isoformat() if task.completed_at else '',
                (task.created_by.get_full_name() or task.created_by.email) if task.created_by else '',
                task.created_at.isoformat() if task.created_at else '',
            ])
        return response
