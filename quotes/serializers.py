from rest_framework import serializers
from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    """
    Serializer for Quote model.
    """
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    
    class Meta:
        model = Quote
        fields = [
            'id', 'client_name', 'client_email', 'client_phone', 'company_name',
            'project_title', 'project_description', 'project_type', 'budget_range',
            'deadline', 'estimated_amount', 'status', 'notes', 'assigned_to',
            'assigned_to_name', 'assigned_to_email', 'created_at', 'updated_at',
            'approved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'approved_at']

