from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """
    Public read: list and retrieve portfolio projects (no auth). Create/update/delete: authenticated.
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'description', 'technologies', 'tags']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        """
        Add request object to serializer context.
        
        This is crucial for the ProjectSerializer to build absolute image URLs.
        The request object provides scheme (http/https) and host information
        needed to construct complete media file URLs.
        
        Returns:
            dict: Serializer context including the request object
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context