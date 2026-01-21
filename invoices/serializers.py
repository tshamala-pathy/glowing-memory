from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model.
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    quote_project_title = serializers.CharField(source='quote.project_title', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'quote', 'quote_project_title',
            'client_name', 'client_email', 'client_phone', 'client_address',
            'client_company', 'client_vat_number',
            'provider_name', 'provider_address', 'provider_phone', 'provider_email',
            'provider_vat_number',
            'items', 'subtotal', 'vat_rate', 'vat_amount', 'total_amount',
            'amount_paid', 'amount_due', 'issue_date', 'due_date', 'paid_date',
            'status', 'payment_method', 'payment_reference', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at', 'created_by_name']

