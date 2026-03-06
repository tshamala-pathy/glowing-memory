from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.utils import timezone
from django import forms
from django.core.exceptions import ValidationError
from datetime import timedelta
from .models import Quote
from .views import send_quote_response_email, get_quote_payment_url

# ================================
# Quotes Admin Configuration
# ================================


class QuoteAdminForm(forms.ModelForm):
    """Enforce quote status transitions in admin: pending→reviewed (admin). paid is system-only."""
    class Meta:
        model = Quote
        fields = '__all__'

    def clean_status(self):
        status = self.cleaned_data.get('status')
        if not self.instance or not self.instance.pk:
            return status
        old_status = Quote.objects.filter(pk=self.instance.pk).values_list('status', flat=True).first()
        if old_status is None or old_status == status:
            return status
        try:
            Quote.validate_status_transition(old_status, status)
        except ValidationError as e:
            if e.message_dict and 'status' in e.message_dict:
                raise ValidationError(e.message_dict['status'])
            raise
        if status == 'paid':
            raise ValidationError(
                'Status "paid" is set by the system when the invoice is marked paid, not in admin.'
            )
        return status


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    form = QuoteAdminForm
    """
    Admin interface configuration for Quote model.
    
    Allows administrators to:
    - View all submitted quote requests
    - Filter and search quotes by various fields
    - Update quote status and add estimated amounts
    - Assign quotes to team members
    - Add admin responses that are automatically emailed to clients
    - Track requirements acceptance and response timestamps
    """
    # Fields displayed in the list view
    list_display = [
        'project_title', 'client', 'client_name', 'client_email', 'service_type',
        'status', 'estimated_amount', 'requirements_accepted', 'created_at', 'pdf_link'
    ]
    
    # Filters available in the sidebar for quick filtering
    list_filter = [
        'status', 'service_type', 'requirements_accepted',
        'created_at', 'responded_at', 'assigned_to', 'client'
    ]
    
    # Fields searchable in the admin search bar
    search_fields = [
        'project_title', 'client_name', 'client_email', 'company_name',
        'project_description', 'admin_response', 'client__name'
    ]
    
    # Fields that cannot be edited (auto-generated timestamps)
    readonly_fields = [
        'created_at', 'updated_at', 'approved_at', 'responded_at', 'client_decision_at',
        'requirements_accepted_at', 'send_response_button', 'payment_url'
    ]
    
    raw_id_fields = ['client']
    
    # Organize form fields into logical sections for better UX
    fieldsets = (
        ('Client Information', {
            'fields': ('client', 'client_name', 'client_email', 'client_phone', 'company_name'),
            'description': 'Client (business entity) and contact details'
        }),
        ('Project Details', {
            'fields': (
                'project_title', 'project_description', 'project_type',
                'service_type', 'budget_range', 'deadline', 'timeline'
            ),
            'description': 'Details about the project the client wants quoted'
        }),
        ('Requirements', {
            'fields': ('requirements_accepted', 'requirements_accepted_at'),
            'description': 'Whether the client has read and accepted the requirements'
        }),
        ('Quote Response', {
            'fields': (
                'status', 'estimated_amount', 'estimated_delivery_time', 'admin_response', 'payment_url', 'send_response_button',
                'assigned_to', 'notes'
            ),
            'description': (
                'Proposed price (estimated_amount), admin notes, and estimated delivery. '
                'Click "Send Response" to email the client; status becomes "reviewed" and client can approve/decline in portal.'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'approved_at', 'responded_at', 'client_decision_at'),
            'classes': ('collapse',),  # Collapsed by default to save space
            'description': 'Automatically tracked timestamps'
        }),
    )

    def pdf_link(self, obj):
        """Link to the API quote PDF endpoint."""
        if not obj or not obj.id:
            return "-"
        url = reverse('quote-pdf', args=[obj.pk])
        return format_html('<a href="{}" target="_blank">Download PDF</a>', url)

    pdf_link.short_description = "PDF"
    
    def send_response_button(self, obj):
        """
        Display a button to manually send the admin response email.
        """
        if not obj or not obj.id:
            return 'Save quote first to send response'
        
        if not obj.admin_response:
            return format_html(
                '<span style="color: #999;">Add admin response above, then click this button to send email</span>'
            )
        
        return format_html(
            '<a class="button" href="{}" onclick="return confirm(\'Send response email to {}?\');">'
            '📧 Send Response Email</a>',
            reverse('admin:quotes_quote_send_response', args=[obj.pk]),
            obj.client_email
        )
    send_response_button.short_description = 'Send Response'
    
    def get_urls(self):
        """
        Add custom URL for sending response emails.
        """
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:quote_id>/send-response/',
                self.admin_site.admin_view(self.send_response_view),
                name='quotes_quote_send_response',
            ),
        ]
        return custom_urls + urls
    
    def send_response_view(self, request, quote_id):
        """
        View to handle sending response email from admin.
        """
        from django.shortcuts import get_object_or_404, redirect
        from django.contrib import messages
        
        quote = get_object_or_404(Quote, pk=quote_id)
        
        if not quote.admin_response:
            messages.error(request, 'Admin response must be set before sending email.')
            return redirect('admin:quotes_quote_change', quote.id)
        
        try:
            Quote.validate_status_transition(quote.status, 'reviewed')
        except ValidationError as e:
            messages.error(request, e.messages[0] if e.messages else str(e))
            return redirect('admin:quotes_quote_change', quote.id)
        try:
            send_quote_response_email(quote)
            if quote.status != 'reviewed':
                quote.status = 'reviewed'
                quote.responded_at = timezone.now()
                quote.payment_url = get_quote_payment_url(quote)
                quote.save(update_fields=['status', 'responded_at', 'payment_url'])
            elif not quote.payment_url:
                quote.payment_url = get_quote_payment_url(quote)
                quote.save(update_fields=['payment_url'])
            messages.success(request, f'Response email sent successfully to {quote.client_email}')
        except Exception as e:
            messages.error(request, f'Error sending email: {str(e)}')
        
        return redirect('admin:quotes_quote_change', quote.id)
    
    def save_model(self, request, obj, form, change):
        """
        Override save to handle status changes and email sending.
        """
        # If status is being changed to 'reviewed' and admin_response exists, send email and set payment_url
        if change:
            old_obj = Quote.objects.get(pk=obj.pk)
            if (obj.status == 'reviewed' and obj.admin_response and
                (old_obj.status != 'reviewed' or old_obj.admin_response != obj.admin_response)):
                try:
                    send_quote_response_email(obj)
                except Exception as e:
                    print(f"Error sending quote response email: {e}")
            if obj.status == 'reviewed' and not obj.payment_url:
                obj.payment_url = get_quote_payment_url(obj)
        
        super().save_model(request, obj, form, change)
    
    actions = ['generate_invoice_from_quote']
    
    @admin.action(description='Generate Invoice from Selected Approved Quotes')
    def generate_invoice_from_quote(self, request, queryset):
        """
        Admin action to generate invoices from approved quotes.
        Only works on approved quotes that don't already have invoices.
        """
        from invoices.models import Invoice
        from datetime import datetime
        import uuid
        
        success_count = 0
        error_count = 0
        
        for quote in queryset:
            # Validate quote is approved
            if quote.status != 'approved':
                error_count += 1
                messages.error(request, f'Quote "{quote.project_title}" is not approved. Status: {quote.status}.')
                continue
            
            # Check if invoice already exists
            if hasattr(quote, 'invoice') and quote.invoice:
                error_count += 1
                messages.warning(request, f'Invoice already exists for quote "{quote.project_title}"')
                continue
            
            try:
                # Generate invoice number
                invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
                while Invoice.objects.filter(invoice_number=invoice_number).exists():
                    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
                
                # Create invoice
                invoice = Invoice.objects.create(
                    quote=quote,
                    created_by=request.user,
                    issue_date=timezone.now().date(),
                    due_date=timezone.now().date() + timedelta(days=30),
                    status='draft'
                )
                
                # Calculate totals (this also populates data from quote)
                invoice.calculate_totals()
                
                success_count += 1
                messages.success(request, f'Invoice {invoice.invoice_number} created for quote "{quote.project_title}"')
            except Exception as e:
                error_count += 1
                messages.error(request, f'Error creating invoice for quote "{quote.project_title}": {str(e)}')
        
        if success_count > 0:
            messages.success(request, f'Successfully created {success_count} invoice(s)')
        if error_count > 0:
            messages.error(request, f'Failed to create {error_count} invoice(s)')

