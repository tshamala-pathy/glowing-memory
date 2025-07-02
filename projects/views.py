from django.shortcuts import render
from rest_framework import viewsets
from .models import Project
from .serializers import ProjectSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

# Create your views here.
# 📌 ViewSet for handling project-related API requests.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
