from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Client, Project, CaseStudy, Task
from quotes.models import Quote
from invoices.models import Invoice


# ================================
# Inlines: related Quotes, Invoices, Projects per Client
# ================================
class QuoteInline(admin.TabularInline):
    """Show this client's quotes on the Client change page."""
    model = Quote
    fk_name = 'client'
    extra = 0
    show_change_link = True
    fields = ('project_title', 'client_email', 'status', 'estimated_amount', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ['-created_at']
    verbose_name = 'Quote'
    verbose_name_plural = 'Quotes'


class InvoiceInline(admin.TabularInline):
    """Show this client's invoices on the Client change page."""
    model = Invoice
    fk_name = 'client'
    extra = 0
    show_change_link = True
    fields = ('invoice_number', 'total_amount', 'status', 'issue_date', 'due_date')
    readonly_fields = ()
    ordering = ['-created_at']
    verbose_name = 'Invoice'
    verbose_name_plural = 'Invoices'


class ProjectInline(admin.TabularInline):
    """Show this client's projects on the Client change page."""
    model = Project
    fk_name = 'client'
    extra = 0
    show_change_link = True
    fields = ('name', 'status', 'progress_percentage', 'is_public', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ['-created_at']
    verbose_name = 'Project'
    verbose_name_plural = 'Projects'


class TaskInline(admin.TabularInline):
    """Show tasks for this project on the Project change page (admin-only)."""
    model = Task
    fk_name = 'project'
    extra = 0
    show_change_link = True
    fields = ('title', 'status', 'priority', 'due_date', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ['-created_at']
    verbose_name = 'Task'
    verbose_name_plural = 'Tasks'


# ================================
# Client Admin
# ================================
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Admins can see all clients and, per client, related Quotes, Invoices, and Projects (inlines).
    """
    list_display = ['name', 'user', 'industry', 'is_public', 'created_at']
    list_filter = ['is_public', 'industry', 'created_at']
    search_fields = ['name', 'industry', 'description', 'internal_notes', 'user__email', 'user__username']
    list_editable = ['is_public']
    raw_id_fields = ['user']
    inlines = [QuoteInline, InvoiceInline, ProjectInline]


# ================================
# Project Admin
# ================================
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    Admin interface for Client Project model.
    
    Features:
    - View all projects with filters
    - See related quote and invoice
    - Filter by status, client, public/private
    - Search by name, description, tech stack
    """
    list_display = [
        'name', 'client_name', 'status', 'progress_percentage', 'is_public',
        'quote_link', 'invoice_link', 'created_at'
    ]
    list_filter = ['status', 'is_public', 'created_at', 'client']
    search_fields = ['name', 'description', 'tech_stack', 'client__name', 'client__user__email']
    readonly_fields = ['created_at', 'updated_at', 'quote_link', 'invoice_link']
    autocomplete_fields = ['client', 'quote', 'invoice']
    
    inlines = [TaskInline]

    fieldsets = (
        ('Project Information', {
            'fields': ('name', 'description', 'status', 'progress_percentage', 'is_public', 'internal_notes'),
            'description': 'Basic project information'
        }),
        ('Client & Relationships', {
            'fields': ('client', 'quote', 'quote_link', 'invoice', 'invoice_link'),
            'description': 'Client (business entity) and related quote/invoice'
        }),
        ('Technical Details', {
            'fields': ('tech_stack', 'screenshots', 'repo_url', 'live_url'),
            'description': 'Technical information and links'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',),
            'description': 'Automatically tracked timestamps'
        }),
    )
    
    def client_name(self, obj):
        """Display client (business entity) name."""
        if obj.client:
            return obj.client.name
        return '-'
    client_name.short_description = 'Client'
    
    def quote_link(self, obj):
        """Display link to related quote."""
        if obj.quote:
            url = reverse('admin:quotes_quote_change', args=[obj.quote.pk])
            return format_html('<a href="{}">{}</a>', url, obj.quote.project_title)
        return '-'
    quote_link.short_description = 'Related Quote'
    
    def invoice_link(self, obj):
        """Display link to related invoice."""
        if obj.invoice:
            url = reverse('admin:invoices_invoice_change', args=[obj.invoice.pk])
            return format_html('<a href="{}">{}</a>', url, obj.invoice.invoice_number)
        return '-'
    invoice_link.short_description = 'Related Invoice'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related('client', 'client__user', 'quote', 'invoice')


# ================================
# Task Admin (admin-only; not visible to clients)
# ================================
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Tasks are internal to projects; only staff/superuser can view and edit."""
    list_display = ['title', 'project', 'status', 'priority', 'due_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at', 'project']
    search_fields = ['title', 'description', 'internal_notes', 'project__name']
    list_editable = ['status', 'priority']
    autocomplete_fields = ['project']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'due_date'

    fieldsets = (
        (None, {
            'fields': ('project', 'title', 'description', 'status', 'priority', 'due_date', 'internal_notes'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


# ================================
# Case Study Admin
# ================================
@admin.register(CaseStudy)
class CaseStudyAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'is_public', 'created_at']
    list_filter = ['is_public', 'client', 'created_at']
    search_fields = ['title', 'problem', 'solution', 'result']
    list_editable = ['is_public']
    autocomplete_fields = ['client']
