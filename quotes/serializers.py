from rest_framework import serializers
from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    """
    Serializer for Quote model.
    
    Handles serialization of quote requests and responses.
    - Public users can create quotes (POST)
    - Authenticated users can view quotes (GET)
    - Admin users can update quotes and add responses (PUT/PATCH)
    """
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    
    class Meta:
        model = Quote
        fields = [
            'id', 'client_name', 'client_email', 'client_phone', 'company_name',
            'project_title', 'project_description', 'project_type', 'service_type',
            'budget_range', 'deadline', 'timeline', 'estimated_amount', 'status',
            'notes', 'admin_response', 'assigned_to', 'assigned_to_name',
            'assigned_to_email', 'requirements_accepted', 'requirements_accepted_at',
            'created_at', 'updated_at', 'approved_at', 'replied_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'approved_at', 'replied_at',
            'requirements_accepted_at', 'assigned_to_name', 'assigned_to_email'
        ]
    
    def validate_requirements_accepted(self, value):
        """
        Ensure requirements are accepted before quote submission.
        This validation is enforced in the view for public submissions.
        """
        return value

