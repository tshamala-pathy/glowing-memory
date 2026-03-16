from rest_framework import serializers
from .models import Client, Project, ProjectFile, CaseStudy, Task


# ================================
# Client Serializer
# ================================
class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for Client model.
    
    Features:
    - Builds absolute logo URLs for frontend consumption
    - Filters public/private clients based on user permissions
    """
    logo = serializers.SerializerMethodField()
    projects_count = serializers.SerializerMethodField()
    case_studies_count = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'logo', 'industry', 'description',
            'is_public', 'created_at', 'updated_at',
            'internal_notes',
            'projects_count', 'case_studies_count'
        ]
        read_only_fields = ('created_at', 'updated_at', 'projects_count', 'case_studies_count')

    def get_logo(self, obj):
        """Build and return absolute URL for client logo."""
        if not obj.logo:
            return None

        logo_path = obj.logo.url
        if not logo_path.startswith('/'):
            logo_path = '/' + logo_path

        request = self.context.get('request')
        if request:
            scheme = request.scheme
            host = request.get_host()
            if '0.0.0.0' in host:
                host = host.replace('0.0.0.0', 'localhost', 1)
            return f"{scheme}://{host}{logo_path}"

        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000')
        return f"{str(base).rstrip('/')}{logo_path}"

    def get_projects_count(self, obj):
        """Return count of projects for this client."""
        return obj.projects.count()

    def get_case_studies_count(self, obj):
        """Return count of case studies for this client."""
        return obj.case_studies.count()

    def to_representation(self, instance):
        """
        Hide internal_notes from non-admin/staff users.
        """
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if not (request.user.is_staff or request.user.is_superuser):
                data.pop('internal_notes', None)
        else:
            data.pop('internal_notes', None)
        return data


# ================================
# Project Serializer
# ================================
class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model (client-specific).
    
    Features:
    - Converts comma-separated tech_stack to array
    - Includes client information
    - Includes quote and invoice information
    - Handles screenshots as JSON array
    - Filters sensitive data for non-owners
    """
    tech_stack = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    client_id = serializers.IntegerField(source='client.id', read_only=True, allow_null=True)
    client_email = serializers.SerializerMethodField()
    quote_project_title = serializers.CharField(source='quote.project_title', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'client', 'client_id', 'client_name', 'client_email',
            'status', 'status_label', 'progress_percentage', 'quote', 'quote_project_title', 'invoice', 'invoice_number',
            'tech_stack', 'hero_image', 'screenshots', 'repo_url', 'live_url',
            'is_public', 'created_at', 'updated_at', 'internal_notes'
        ]
        read_only_fields = (
            'created_at', 'updated_at', 'client_id', 'client_name', 'client_email',
            'quote_project_title', 'invoice_number'
        )

    def get_tech_stack(self, obj):
        """Convert comma-separated tech_stack string to a list."""
        return obj.get_tech_stack_list()
    
    def get_client_name(self, obj):
        """Get client (business entity) name."""
        if obj.client:
            return obj.client.name
        return None
    
    def get_client_email(self, obj):
        """Get client contact email (from client.user), but only for project owner or admin."""
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.client and obj.client.user:
            if request.user == obj.client.user or request.user.is_staff or request.user.is_superuser:
                return obj.client.user.email
        return None

    def to_internal_value(self, data):
        """Convert tech_stack list to comma-separated string for storage."""
        if 'tech_stack' in data and isinstance(data['tech_stack'], list):
            data = data.copy()
            data['tech_stack'] = ','.join([str(tech) for tech in data['tech_stack']])
        return super().to_internal_value(data)
    
    def _build_absolute_media_url(self, path):
        """Build absolute URL for a media path (used for screenshots and logos)."""
        if not path or not isinstance(path, str):
            return path
        if path.startswith('http://') or path.startswith('https://'):
            return path
        if not path.startswith('/'):
            path = '/' + path
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(path)
        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
        return f'{base}{path}'

    def to_representation(self, instance):
        """Hide sensitive data for non-owners; convert screenshots and hero image to absolute URLs."""
        representation = super().to_representation(instance)
        request = self.context.get('request')

        # Convert screenshots list to absolute URLs so frontend can display them
        if representation.get('screenshots') and isinstance(representation['screenshots'], list):
            representation['screenshots'] = [
                self._build_absolute_media_url(p) for p in representation['screenshots']
            ]

        # Convert hero_image to absolute URL if present
        if representation.get('hero_image'):
            representation['hero_image'] = self._build_absolute_media_url(representation['hero_image'])

        if request and not request.user.is_authenticated:
            representation.pop('client_email', None)
            representation.pop('invoice_number', None)
            representation.pop('invoice', None)
            representation.pop('internal_notes', None)
        elif request and request.user.is_authenticated:
            is_owner = instance.client and getattr(instance.client, 'user', None) == request.user
            if not is_owner and not (request.user.is_staff or request.user.is_superuser):
                representation.pop('client_email', None)
                representation.pop('invoice_number', None)
                representation.pop('invoice', None)
                representation.pop('internal_notes', None)

        return representation


# ================================
# ProjectFile Serializer (file sharing: client + admin)
# ================================
class ProjectFileSerializer(serializers.ModelSerializer):
    """Serializer for ProjectFile. Returns file URL for download (use download endpoint for auth)."""
    file_url = serializers.SerializerMethodField()
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True, allow_null=True)
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFile
        fields = ['id', 'project', 'uploaded_by', 'uploaded_by_email', 'file', 'file_url', 'file_name', 'description', 'uploaded_at']
        read_only_fields = ['uploaded_by', 'uploaded_at']

    def get_file_url(self, obj):
        """Build absolute URL for the file (download goes through API for access control)."""
        if not obj.file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/clients/project-files/{obj.id}/download/')
        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000').rstrip('/')
        return f'{base}/api/clients/project-files/{obj.id}/download/'

    def get_file_name(self, obj):
        """Original filename for display."""
        return obj.file.name.split('/')[-1] if obj.file else None

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context.get('request').user
        return super().create(validated_data)


# ================================
# Task Serializer (admin-only; not exposed to clients)
# ================================
class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model. Used only by admin API. Includes project/client labels for display."""

    project_name = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "project_name",
            "client_name",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "internal_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_at", "updated_at", "project_name", "client_name")

    def get_project_name(self, obj):
        """Display name for the linked project (name or quote title)."""
        if not obj.project_id:
            return None
        proj = obj.project
        if proj.name:
            return proj.name
        if getattr(proj, "quote", None) and proj.quote:
            return getattr(proj.quote, "project_title", None)
        return None

    def get_client_name(self, obj):
        """Client name for the linked project."""
        if not obj.project_id or not obj.project:
            return None
        client = getattr(obj.project, "client", None)
        return client.name if client else None


# ================================
# Case Study Serializer
# ================================
class CaseStudySerializer(serializers.ModelSerializer):
    """
    Serializer for CaseStudy model.
    
    Features:
    - Includes client information
    - Handles JSON metrics field
    """
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_id = serializers.IntegerField(source='client.id', read_only=True)
    client_logo = serializers.SerializerMethodField()

    class Meta:
        model = CaseStudy
        fields = [
            'id', 'title', 'client', 'client_name', 'client_id', 'client_logo',
            'problem', 'solution', 'result', 'metrics', 'testimonial',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'client_name', 'client_id', 'client_logo')

    def get_client_logo(self, obj):
        """Get client logo URL if available."""
        if not obj.client.logo:
            return None

        logo_path = obj.client.logo.url
        if not logo_path.startswith('/'):
            logo_path = '/' + logo_path

        request = self.context.get('request')
        if request:
            scheme = request.scheme
            host = request.get_host()
            if '0.0.0.0' in host:
                host = host.replace('0.0.0.0', 'localhost', 1)
            return f"{scheme}://{host}{logo_path}"

        from django.conf import settings
        base = getattr(settings, 'PROJECT_BASE_URL', 'http://localhost:8000')
        return f"{str(base).rstrip('/')}{logo_path}"


# ================================
# Case Study Detail Serializer (with related projects)
# ================================
class CaseStudyDetailSerializer(CaseStudySerializer):
    """
    Extended serializer for case study detail view.
    Includes related projects for the client.
    """
    related_projects = serializers.SerializerMethodField()

    class Meta(CaseStudySerializer.Meta):
        fields = CaseStudySerializer.Meta.fields + ['related_projects']

    def get_related_projects(self, obj):
        """Get related projects for the client."""
        projects = obj.client.projects.all()[:5]  # Limit to 5 projects
        return ProjectSerializer(projects, many=True, context=self.context).data
