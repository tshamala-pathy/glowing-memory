from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project
from .serializers import ProjectSerializer
from rest_framework.permissions import IsAuthenticated

# Create your views here.

# 📌 ViewSet for handling project-related API requests.
class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    Supports filtering by status, category, and tags.
    Supports search by title, description, and technologies.

    Attributes:
        queryset (QuerySet): Retrieves all Project instances ordered by creation date descending.
        serializer_class (Serializer): Specifies the serializer to use for Project objects.
        permission_classes (list): Permissions - requires authentication for all operations.
        filter_backends: Enables filtering and searching capabilities.
        filterset_fields: Fields that can be used for filtering.
        search_fields: Fields that can be searched.
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]  # Require authentication for all operations
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'description', 'technologies', 'tags']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    
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
    
    # Permission notes:
    # IsAuthenticated requires:
    # - All users must be authenticated to access projects (read, create, update, delete)
    # - Unauthenticated requests will receive 401 Unauthorized