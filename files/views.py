from django.http import FileResponse
from rest_framework.exceptions import PermissionDenied
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from clients.models import Client
from .models import SharedFile
from .serializers import SharedFileSerializer


class SharedFileViewSet(viewsets.ModelViewSet):
    """Upload, list, download, and preview shared files."""

    serializer_class = SharedFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = SharedFile.objects.select_related('project', 'client', 'uploaded_by')
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return qs
        profile = getattr(user, 'client_profile', None)
        if profile:
            return qs.filter(client=profile, is_client_visible=True)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, 'client_profile', None)
        project = serializer.validated_data.get('project')
        if user.is_staff or user.is_superuser:
            if project:
                client = project.client
            elif profile:
                client = profile
            else:
                raise PermissionDenied('Project or client profile required.')
        else:
            if not profile:
                raise PermissionDenied('Client profile required.')
            if project and project.client_id != profile.id:
                raise PermissionDenied('Not allowed for this project.')
            client = profile
        uploaded = serializer.save(uploaded_by=user, client=client)
        f = uploaded.file
        if f and hasattr(f, 'content_type'):
            uploaded.mime_type = f.content_type or ''
            uploaded.save(update_fields=['mime_type'])

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        obj = self.get_object()
        if not obj.file:
            return Response({'detail': 'No file.'}, status=status.HTTP_404_NOT_FOUND)
        response = FileResponse(obj.file.open('rb'), as_attachment=True, filename=obj.name)
        return response
