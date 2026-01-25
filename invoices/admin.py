from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from .models import Invoice
from quotes.models import Quote


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """
    Admin interface for Invoice model.
    
    Features:
    - View all invoices with filters
    - Generate invoices from approved quotes
    - Filter by status, date, quote
    - See related quote information
    """
    list_display = [
        'invoice_number', 'client_name', 'quote_link', 'total_amount',
        'status', 'issue_date', 'due_date', 'amount_due'
    ]
    list_filter = ['status', 'issue_date', 'due_date', 'created_at']
    search_fields = [
        'invoice_number', 'client_name', 'client_email', 'client_company',
        'quote__project_title', 'quote__client_name'
    ]
    readonly_fields = [
        'invoice_number', 'created_at', 'updated_at', 'quote_link',
        'subtotal', 'vat_amount', 'total_amount', 'amount_due'
    ]
    
    fieldsets = (
        ('Invoice Details', {
            'fields': ('invoice_number', 'quote', 'quote_link', 'issue_date', 'due_date', 'status'),
            'description': 'Invoice basic information. Quote must be approved before invoice creation.'
        }),
        ('Client Information', {
            'fields': ('client_name', 'client_email', 'client_phone', 'client_address', 'client_company', 'client_vat_number'),
            'description': 'Client information (auto-populated from quote)'
        }),
        ('Provider Information', {
            'fields': ('provider_name', 'provider_address', 'provider_phone', 'provider_email', 'provider_vat_number'),
            'description': 'Your business/service provider information'
        }),
        ('Items', {
            'fields': ('items',),
            'description': 'Invoice line items (auto-populated from quote)'
        }),
        ('Financial Details', {
            'fields': ('subtotal', 'vat_rate', 'vat_amount', 'total_amount', 'amount_paid', 'amount_due'),
            'description': 'Financial calculations (auto-calculated)'
        }),
        ('Payment', {
            'fields': ('payment_method', 'payment_reference', 'paid_date', 'notes'),
            'description': 'Payment tracking information'
        }),
        ('Admin', {
            'fields': ('created_by',),
            'description': 'Admin user who created this invoice'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Automatically tracked timestamps'
        }),
    )
    
    def quote_link(self, obj):
        """Display link to related quote."""
        if obj.quote:
            url = reverse('admin:quotes_quote_change', args=[obj.quote.pk])
            return format_html('<a href="{}">{}</a>', url, obj.quote.project_title)
        return '-'
    quote_link.short_description = 'Related Quote'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related for quote."""
        qs = super().get_queryset(request)
        return qs.select_related('quote', 'created_by')
    
    def save_model(self, request, obj, form, change):
        """
        Override save to:
        1. Set created_by if new invoice
        2. Validate quote is approved
        3. Auto-populate from quote if new
        """
        if not change:  # New invoice
            if not obj.created_by:
                obj.created_by = request.user
            
            # Validate quote is approved
            if obj.quote and obj.quote.status != 'Approved':
                messages.error(request, 'Invoice can only be created from an approved quote. Please approve the quote first.')
                return
        
        super().save_model(request, obj, form, change)



