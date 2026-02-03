from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from PathyCodeback.permissions import IsSuperuser
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
    List/retrieve: authenticated. Create/update/delete: superuser only.
    """
    serializer_class = ClientSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsSuperuser()]
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
    
    Access Control:
    - Public projects: Visible to everyone (including non-authenticated users)
    - Private projects: Only visible to the project's client and admin users
    - Clients can only see their own projects
    - Admins can see all projects
    
    Business Rules:
    - Projects are automatically created when invoices are marked as PAID
    - Projects are linked to User (client), Quote, and Invoice
    """
    queryset = Project.objects.all().select_related('client', 'quote', 'invoice')
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'is_public']
    search_fields = ['name', 'description', 'tech_stack']
    ordering_fields = ['created_at', 'name', 'status']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        List/retrieve: public (filtered by get_queryset). Create/update/delete: superuser only.
        """
        if self.action in ['list', 'retrieve', 'public']:
            from rest_framework.permissions import AllowAny
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsSuperuser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter projects based on user permissions:
        - Non-authenticated users: Only public projects
        - Authenticated clients: Their own projects + public projects
        - Admin users: All projects
        """
        queryset = super().get_queryset()
        
        # Non-authenticated users: Only public projects
        if not self.request.user.is_authenticated:
            return queryset.filter(is_public=True)
        
        # Admin users: All projects
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset
        
        # Regular users: Their own projects + public projects
        return queryset.filter(
            models.Q(client=self.request.user) | models.Q(is_public=True)
        )
    
    def get_serializer_context(self):
        """Add request object to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def public(self, request):
        """
        Public endpoint to get all public projects.
        No authentication required.
        """
        public_projects = Project.objects.filter(is_public=True).select_related('client', 'quote', 'invoice')
        
        # Apply search and ordering if provided
        search_query = request.query_params.get('search', None)
        if search_query:
            public_projects = public_projects.filter(
                models.Q(name__icontains=search_query) |
                models.Q(description__icontains=search_query) |
                models.Q(tech_stack__icontains=search_query)
            )
        
        ordering = request.query_params.get('ordering', '-created_at')
        public_projects = public_projects.order_by(ordering)
        
        serializer = self.get_serializer(public_projects, many=True)
        return Response(serializer.data)


# ================================
# Case Study ViewSet
# ================================
class CaseStudyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing case studies.
    List/retrieve: authenticated. Create/update/delete: superuser only.
    """
    serializer_class = CaseStudySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsSuperuser()]
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
