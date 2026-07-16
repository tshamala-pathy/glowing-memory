from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from clients.models import Project
from .models import WorkTask
from .serializers import WorkTaskSerializer


class WorkTaskViewSet(viewsets.ModelViewSet):
    serializer_class = WorkTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = WorkTask.objects.select_related('project', 'assigned_to', 'created_by')
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return qs
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
        serializer.save(created_by=user)
