from django.contrib import admin
from .models import Quote

# ================================
# Quotes Admin Configuration
# ================================

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for Quote model.
    
    Allows administrators to:
    - View all submitted quote requests
    - Filter and search quotes by various fields
    - Update quote status and add estimated amounts
    - Assign quotes to team members
    - Add notes and respond to client inquiries
    """
    # Fields displayed in the list view
    list_display = ['project_title', 'client_name', 'client_email', 'status', 'estimated_amount', 'created_at']
    
    # Filters available in the sidebar for quick filtering
    list_filter = ['status', 'created_at', 'project_type']
    
    # Fields searchable in the admin search bar
    search_fields = ['project_title', 'client_name', 'client_email', 'project_description']
    
    # Fields that cannot be edited (auto-generated timestamps)
    readonly_fields = ['created_at', 'updated_at', 'approved_at']
    
    # Organize form fields into logical sections for better UX
    fieldsets = (
        ('Client Information', {
            'fields': ('client_name', 'client_email', 'client_phone', 'company_name'),
            'description': 'Contact details of the client requesting the quote'
        }),
        ('Project Details', {
            'fields': ('project_title', 'project_description', 'project_type', 'budget_range', 'deadline'),
            'description': 'Details about the project the client wants quoted'
        }),
        ('Quote Information', {
            'fields': ('estimated_amount', 'status', 'notes', 'assigned_to'),
            'description': 'Quote response information. Use notes to communicate with the team or store internal comments.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'approved_at'),
            'classes': ('collapse',),  # Collapsed by default to save space
            'description': 'Automatically tracked timestamps'
        }),
    )

