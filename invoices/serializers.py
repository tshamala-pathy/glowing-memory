from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model.

    Quote-to-Invoice lifecycle:
    - Invoice can only be created from a quote with status 'approved'.
    - On create, only 'quote' (and optionally issue_date, due_date, status) are required.
    - Client details (name, email, phone, company) and project details (line items from
      project title, service type, estimated amount; notes from project description) are
      automatically copied from the quote by the model. One invoice per quote (enforced).
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    quote_project_title = serializers.CharField(source='quote.project_title', read_only=True)
    quote_status = serializers.CharField(source='quote.status', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'quote', 'quote_project_title', 'quote_status',
            'client', 'client_name', 'client_email', 'client_phone', 'client_address',
            'client_company', 'client_vat_number',
            'provider_name', 'provider_address', 'provider_phone', 'provider_email',
            'provider_vat_number',
            'items', 'subtotal', 'vat_rate', 'vat_amount', 'total_amount',
            'amount_paid', 'amount_due', 'issue_date', 'due_date', 'paid_date', 'paid_at',
            'status', 'payment_method', 'payment_reference', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'created_at', 'updated_at',
            'created_by_name', 'quote_project_title', 'quote_status',
            'subtotal', 'vat_amount', 'total_amount', 'amount_due'
        ]
    
    def validate_quote(self, value):
        """
        Validate that the quote is approved before allowing invoice creation.
        """
        if value.status != 'approved':
            raise ValidationError(
                'Invoice can only be created from an approved quote. '
                f'Current quote status: {value.status}. Please approve the quote first.'
            )
        
        # Check if invoice already exists for this quote
        if Invoice.objects.filter(quote=value).exists():
            raise ValidationError('An invoice already exists for this quote.')
        
        return value

