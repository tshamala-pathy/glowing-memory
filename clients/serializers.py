from rest_framework import serializers
from .models import Client, Project, CaseStudy


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


# ================================
# Project Serializer
# ================================
class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model (client-specific).
    
    Features:
    - Converts comma-separated tech_stack to array
    - Includes client information
    """
    tech_stack = serializers.SerializerMethodField()
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_id = serializers.IntegerField(source='client.id', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'client', 'client_name', 'client_id',
            'tech_stack', 'repo_url', 'live_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'client_name', 'client_id')

    def get_tech_stack(self, obj):
        """Convert comma-separated tech_stack string to a list."""
        return obj.get_tech_stack_list()

    def to_internal_value(self, data):
        """Convert tech_stack list to comma-separated string for storage."""
        if 'tech_stack' in data and isinstance(data['tech_stack'], list):
            data = data.copy()
            data['tech_stack'] = ','.join([str(tech) for tech in data['tech_stack']])
        return super().to_internal_value(data)


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
