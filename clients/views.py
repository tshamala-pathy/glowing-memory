from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.http import HttpResponse, FileResponse
from PathyCodeback.permissions import IsSuperuser
from users.activity import log_activity
from .models import Client, Project, ProjectFile, CaseStudy, Task
import csv
from .serializers import (
    ClientSerializer,
    ProjectSerializer,
    ProjectFileSerializer,
    CaseStudySerializer,
    CaseStudyDetailSerializer,
    TaskSerializer,
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
        """Non-admin users see only their own Client profile; unauthenticated see public only."""
        queryset = Client.objects.all()
        if not self.request.user.is_authenticated:
            return queryset.filter(is_public=True)
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset
        profile = getattr(self.request.user, 'client_profile', None)
        if profile:
            return queryset.filter(pk=profile.pk)
        return queryset.none()

    def get_serializer_context(self):
        """Add request object to serializer context for absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save()
        log_activity(self.request.user, 'client_created', object_type='client', object_id=serializer.instance.id, details=serializer.instance.name)

    def perform_update(self, serializer):
        serializer.save()
        log_activity(self.request.user, 'client_updated', object_type='client', object_id=serializer.instance.id, details=serializer.instance.name)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """
        Export all clients as CSV.
        Admin/staff only.
        """
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="clients.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Name",
                "Industry",
                "Email",
                "User ID",
                "Is Public",
                "Created At",
            ]
        )
        for client in Client.objects.select_related("user").all().order_by("id"):
            writer.writerow(
                [
                    client.id,
                    client.name,
                    client.industry,
                    getattr(client.user, "email", ""),
                    getattr(client.user, "id", ""),
                    client.is_public,
                    client.created_at.isoformat() if client.created_at else "",
                ]
            )
        return response

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
    - Projects are linked to Client (business entity), Quote, and Invoice
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
        Client Portal: list and retrieve require authentication (own + public projects).
        Public portfolio: only the 'public' action is AllowAny.
        Create/update/delete: superuser only.
        """
        if self.action == 'public':
            return [AllowAny()]
        if self.action in ['list', 'retrieve', 'my_projects']:
            return [IsAuthenticated()]
        return [IsSuperuser()]
    
    def get_queryset(self):
        """Non-admin users see only their Client's projects plus public; staff/superuser see all."""
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.filter(is_public=True)
        
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset
        
        profile = getattr(self.request.user, 'client_profile', None)
        if profile:
            return queryset.filter(models.Q(client=profile) | models.Q(is_public=True))
        return queryset.filter(is_public=True)
    
    def get_serializer_context(self):
        """Add request object to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save()
        log_activity(self.request.user, 'project_created', object_type='project', object_id=serializer.instance.id, details=serializer.instance.name)

    def perform_update(self, serializer):
        serializer.save()
        log_activity(self.request.user, 'project_updated', object_type='project', object_id=serializer.instance.id, details=serializer.instance.name)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """
        Export all projects as CSV.
        Admin/staff only.
        """
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="projects.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Name",
                "Client Name",
                "Status",
                "Quote ID",
                "Invoice ID",
                "Is Public",
                "Created At",
            ]
        )
        for project in Project.objects.select_related("client", "quote", "invoice").all().order_by("id"):
            writer.writerow(
                [
                    project.id,
                    project.name,
                    project.client.name if project.client else "",
                    project.status,
                    project.quote_id or "",
                    project.invoice_id or "",
                    project.is_public,
                    project.created_at.isoformat() if project.created_at else "",
                ]
            )
        return response
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_projects(self, request):
        """
        Return only the current user's assigned projects (for client portal).
        Requires authentication; clients see only projects where they are the client.
        """
        profile = getattr(request.user, 'client_profile', None)
        if not profile:
            return Response([])
        projects = Project.objects.filter(client=profile).select_related(
            'client', 'quote', 'invoice'
        ).order_by('-created_at')
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """
        Public endpoint to get all public projects (portfolio).
        No authentication required. Use this for the public-facing projects page.
        """
        public_projects = Project.objects.filter(is_public=True).select_related(
            'client', 'client__user', 'quote', 'invoice'
        )
        
        # Apply search and ordering if provided
        search_query = request.query_params.get('search', None)
        if search_query:
            public_projects = public_projects.filter(
                models.Q(name__icontains=search_query) |
                models.Q(description__icontains=search_query) |
                models.Q(tech_stack__icontains=search_query)
            )

        status_filter = request.query_params.get('status', None)
        if status_filter:
            public_projects = public_projects.filter(status=status_filter)
        
        ordering = request.query_params.get('ordering', '-created_at')
        public_projects = public_projects.order_by(ordering)
        
        serializer = self.get_serializer(public_projects, many=True)
        return Response(serializer.data)


# ================================
# Task ViewSet (admin-only; not visible to clients)
# ================================
class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing project tasks.
    Admin-only: only staff/superuser can list, create, update, delete.
    Tasks are not exposed to clients (not included in Project serializer).
    """
    queryset = Task.objects.all().select_related("project", "project__client", "project__quote").order_by("-created_at")
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["project", "status", "priority"]
    search_fields = ["title", "description", "internal_notes"]
    ordering_fields = ["created_at", "due_date", "priority", "status"]
    ordering = ["-created_at"]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """Export all tasks as CSV. Admin/staff only."""
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="tasks.csv"'
        writer = csv.writer(response)
        writer.writerow(
            ["ID", "Project", "Title", "Status", "Priority", "Due Date", "Created At"]
        )
        for task in Task.objects.select_related("project", "project__client").all().order_by("id"):
            writer.writerow(
                [
                    task.id,
                    task.project.name if task.project else "",
                    task.title,
                    task.status,
                    task.priority,
                    task.due_date.isoformat() if task.due_date else "",
                    task.created_at.isoformat() if task.created_at else "",
                ]
            )
        return response


# ================================
# ProjectFile ViewSet (file sharing: client + admin)
# ================================
class ProjectFileViewSet(viewsets.ModelViewSet):
    """
    Project files: upload, list, download. Only the project's client and admins can access.
    List: GET /api/clients/project-files/?project=<id>
    Create: POST /api/clients/project-files/ (multipart: project, file, description)
    Download: GET /api/clients/project-files/<id>/download/
    """
    serializer_class = ProjectFileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        """Only files for projects the user can access: own projects (client) or all (admin)."""
        qs = ProjectFile.objects.all().select_related('project', 'project__client', 'uploaded_by')
        if self.request.user.is_staff or self.request.user.is_superuser:
            return qs
        profile = getattr(self.request.user, 'client_profile', None)
        if profile:
            return qs.filter(project__client=profile)
        return qs.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """Serve the file; access already restricted by get_queryset."""
        project_file = self.get_object()
        if not project_file.file:
            return Response({'error': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            file_handle = project_file.file.open('rb')
            response = FileResponse(file_handle, content_type='application/octet-stream')
            name = project_file.file.name.split('/')[-1] if project_file.file.name else 'download'
            response['Content-Disposition'] = f'attachment; filename="{name}"'
            return response
        except OSError:
            return Response({'error': 'File not found on disk.'}, status=status.HTTP_404_NOT_FOUND)


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
