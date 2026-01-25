from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client, Project, CaseStudy
from .serializers import (
    ClientSerializer,
    ProjectSerializer,
    CaseStudySerializer,
    CaseStudyDetailSerializer
)


# ================================
# Client ViewSet
# ================================
class ClientViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing clients.
    
    Requires authentication for all operations.
    """
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]  # Require authentication for all operations
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'is_public']
    search_fields = ['name', 'industry', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter queryset based on user permissions.
        - Public users: Only see is_public=True clients
        - Authenticated users: See all clients
        """
        queryset = Client.objects.all()
        
        # If user is not authenticated, only return public clients
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_public=True)
        
        return queryset

    def get_serializer_context(self):
        """Add request object to serializer context for absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        """Get all projects for a specific client."""
        client = self.get_object()
        projects = client.projects.all()
        serializer = ProjectSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def case_studies(self, request, pk=None):
        """Get all case studies for a specific client."""
        client = self.get_object()
        case_studies = client.case_studies.all()
        
        serializer = CaseStudySerializer(case_studies, many=True, context={'request': request})
        return Response(serializer.data)


# ================================
# Project ViewSet
# ================================
class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing client projects.
    
    Requires authentication for all operations.
    """
    queryset = Project.objects.all().select_related('client')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]  # Require authentication for all operations
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client']
    search_fields = ['title', 'description', 'tech_stack']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_serializer_context(self):
        """Add request object to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ================================
# Case Study ViewSet
# ================================
class CaseStudyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing case studies.
    
    Requires authentication for all operations.
    """
    serializer_class = CaseStudySerializer
    permission_classes = [IsAuthenticated]  # Require authentication for all operations
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'is_public']
    search_fields = ['title', 'problem', 'solution', 'result']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Return all case studies (authentication required).
        """
        return CaseStudy.objects.all().select_related('client')

    def get_serializer_class(self):
        """Use detail serializer for retrieve action."""
        if self.action == 'retrieve':
            return CaseStudyDetailSerializer
        return CaseStudySerializer

    def get_serializer_context(self):
        """Add request object to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
