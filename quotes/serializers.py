from rest_framework import serializers
from .models import Quote


class ProfileQuoteSerializer(serializers.ModelSerializer):
    """
    Serializer for quote data in the profile API (/api/profile/).
    Returns only fields needed for the client profile: id, title, description,
    item_breakdown, total_price, status, admin_response, created_at, responded_at.
    """
    title = serializers.CharField(source='project_title', read_only=True)
    description = serializers.CharField(source='project_description', read_only=True)
    total_price = serializers.DecimalField(
        source='estimated_amount',
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )
    item_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = [
            'id',
            'title',
            'description',
            'item_breakdown',
            'total_price',
            'status',
            'admin_response',
            'payment_url',
            'created_at',
            'responded_at',
        ]

    def get_item_breakdown(self, obj):
        """
        Quote has no line items; return a single summary item when estimated_amount exists,
        otherwise empty list. Enables future extension (e.g. quote line items).
        """
        if obj.estimated_amount is not None:
            return [
                {
                    'description': obj.project_title or 'Project estimate',
                    'amount': str(obj.estimated_amount),
                }
            ]
        return []


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
            'id', 'client', 'client_name', 'client_email', 'client_phone', 'company_name',
            'project_title', 'project_description', 'project_type', 'service_type',
            'budget_range', 'deadline', 'timeline', 'estimated_amount', 'status',
            'notes', 'admin_response', 'payment_url', 'assigned_to', 'assigned_to_name',
            'assigned_to_email', 'requirements_accepted', 'requirements_accepted_at',
            'created_at', 'updated_at', 'approved_at', 'responded_at', 'client_decision_at'
        ]
        read_only_fields = [
            'id', 'client', 'created_at', 'updated_at', 'approved_at', 'responded_at', 'client_decision_at',
            'requirements_accepted_at', 'assigned_to_name', 'assigned_to_email'
        ]
    
    def validate_requirements_accepted(self, value):
        """
        Ensure requirements are accepted before quote submission.
        This validation is enforced in the view for public submissions.
        """
        return value

    def to_representation(self, instance):
        """Hide internal notes from non-admin/staff clients."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if not (request.user.is_staff or request.user.is_superuser):
                data.pop('notes', None)
        else:
            data.pop('notes', None)
        return data