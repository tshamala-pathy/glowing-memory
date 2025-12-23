from django.contrib import admin
from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client_name', 'total_amount', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'issue_date', 'created_at']
    search_fields = ['invoice_number', 'client_name', 'client_email', 'client_company']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    fieldsets = (
        ('Invoice Details', {
            'fields': ('invoice_number', 'quote', 'issue_date', 'due_date', 'status')
        }),
        ('Client Information', {
            'fields': ('client_name', 'client_email', 'client_phone', 'client_address', 'client_company', 'client_vat_number')
        }),
        ('Provider Information', {
            'fields': ('provider_name', 'provider_address', 'provider_phone', 'provider_email', 'provider_vat_number')
        }),
        ('Items', {
            'fields': ('items',)
        }),
        ('Financial Details', {
            'fields': ('subtotal', 'vat_rate', 'vat_amount', 'total_amount', 'amount_paid', 'amount_due')
        }),
        ('Payment', {
            'fields': ('payment_method', 'payment_reference', 'paid_date', 'notes')
        }),
        ('Admin', {
            'fields': ('created_by',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

