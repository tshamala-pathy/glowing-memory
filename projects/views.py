from django.shortcuts import render
from rest_framework import viewsets
from .models import Project
from .serializers import ProjectSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

# Create your views here.

# 📌 ViewSet for handling project-related API requests.
class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.

    Attributes:
        queryset (QuerySet): Retrieves all Project instances ordered by creation date descending.
        serializer_class (Serializer): Specifies the serializer to use for Project objects.
        permission_classes (list): Permissions to allow authenticated users to edit and others read-only access.
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    # The permission_classes attribute ensures that only authenticated users can create, update, or delete projects,
    # while unauthenticated users can only view the project list and details.