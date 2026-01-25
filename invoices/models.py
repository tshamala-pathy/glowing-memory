from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone


class Invoice(models.Model):
    """
    Model for storing invoices with VAT support (important for South Africa).
    
    Business Rules:
    - An Invoice MUST be linked to an approved Quote (OneToOne relationship)
    - Invoice cannot be created unless Quote status is 'Approved'
    - Invoice data is auto-populated from the linked Quote
    - Quote data remains immutable after invoice generation for audit purposes
    
    Workflow:
    1. Client submits Quote request
    2. Admin reviews and approves Quote
    3. Admin generates Invoice from approved Quote
    4. Invoice is sent to client
    5. Payment is tracked via Invoice status
    """
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Sent', 'Sent'),
        ('Paid', 'Paid'),
        ('Overdue', 'Overdue'),
        ('Cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('Bank Transfer', 'Bank Transfer'),
        ('Credit Card', 'Credit Card'),
        ('PayPal', 'PayPal'),
        ('Cash', 'Cash'),
        ('Other', 'Other'),
    ]
    
    # Invoice Details
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique invoice number (auto-generated)"
    )
    
    # One-to-One relationship with Quote
    # An Invoice MUST be linked to exactly one approved Quote
    quote = models.OneToOneField(
        'quotes.Quote',
        on_delete=models.PROTECT,  # Prevent deletion of quote if invoice exists
        related_name='invoice',
        help_text="The approved quote this invoice is based on. Quote must be approved before invoice creation."
    )
    
    # Client Information (copied from quote at invoice creation)
    client_name = models.CharField(
        max_length=255,
        help_text="Client name (copied from quote at creation)"
    )
    client_email = models.EmailField(
        help_text="Client email (copied from quote at creation)"
    )
    client_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Client phone (copied from quote at creation)"
    )
    client_address = models.TextField(
        blank=True,
        null=True,
        help_text="Client address (if available)"
    )
    client_company = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Client company name (copied from quote at creation)"
    )
    client_vat_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Client VAT number (if applicable)"
    )
    
    # Service Provider Information (Your Business)
    provider_name = models.CharField(max_length=255, default='PathyCode')
    provider_address = models.TextField(blank=True, null=True)
    provider_phone = models.CharField(max_length=20, blank=True, null=True)
    provider_email = models.EmailField(blank=True, null=True)
    provider_vat_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Invoice Items
    items = models.JSONField(default=list, help_text="List of items with description, quantity, price")
    
    # Financial Details
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Subtotal before VAT (defaults from quote estimated_amount)"
    )
    vat_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('15.00'),
        help_text="VAT rate in percentage (15% for South Africa)"
    )
    vat_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="VAT amount (calculated automatically)"
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount including VAT (defaults from quote estimated_amount)"
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Amount paid by client"
    )
    amount_due = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Amount still due (calculated automatically)"
    )
    
    # Dates
    issue_date = models.DateField(
        default=timezone.now,
        help_text="Date invoice was issued (defaults to today)"
    )
    due_date = models.DateField(
        help_text="Date payment is due (defaults to 30 days from issue date)"
    )
    paid_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date payment was received"
    )
    
    # Status and Payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Admin
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_invoices'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.client_name}"
    
    def clean(self):
        """
        Validate that the quote is approved before allowing invoice creation.
        This is called by Django's model validation.
        """
        if self.quote and self.quote.status != 'Approved':
            raise ValidationError({
                'quote': 'Invoice can only be created from an approved quote. Please approve the quote first.'
            })
        super().clean()
    
    def save(self, *args, **kwargs):
        """
        Override save to:
        1. Validate quote is approved
        2. Auto-populate data from quote if not already set
        3. Set default dates
        4. Calculate totals
        """
        # Validate quote is approved
        if self.quote and self.quote.status != 'Approved':
            raise ValidationError('Invoice can only be created from an approved quote.')
        
        # Auto-populate from quote if this is a new invoice
        if self.pk is None and self.quote:
            self._populate_from_quote()
        
        # Set default due date if not provided
        if not self.due_date:
            self.due_date = self.issue_date + timedelta(days=30)
        
        # Calculate totals
        self.calculate_totals()
        
        super().save(*args, **kwargs)
    
    def _populate_from_quote(self):
        """
        Populate invoice fields from the linked quote.
        This ensures data consistency and audit trail.
        """
        quote = self.quote
        
        # Copy client information
        self.client_name = quote.client_name
        self.client_email = quote.client_email
        self.client_phone = quote.client_phone or ''
        self.client_company = quote.company_name or ''
        
        # Set amount from quote (if available)
        if quote.estimated_amount:
            self.subtotal = quote.estimated_amount
            self.total_amount = quote.estimated_amount
            # Create a default invoice item from the quote
            self.items = [{
                'description': quote.project_title,
                'quantity': 1,
                'price': str(quote.estimated_amount),
            }]
        else:
            # If no estimated amount, set defaults
            self.subtotal = Decimal('0.00')
            self.total_amount = Decimal('0.00')
            self.items = [{
                'description': quote.project_title,
                'quantity': 1,
                'price': '0.00',
            }]
    
    def calculate_totals(self):
        """
        Calculate subtotal, VAT, and total amounts from items.
        If items are empty or invalid, use the quote's estimated_amount.
        """
        if self.items and len(self.items) > 0:
            # Calculate from items
            self.subtotal = sum(
                Decimal(str(item.get('price', 0))) * Decimal(str(item.get('quantity', 0)))
                for item in self.items
            )
        elif self.quote and self.quote.estimated_amount:
            # Fallback to quote amount
            self.subtotal = self.quote.estimated_amount
        
        # Calculate VAT
        self.vat_amount = self.subtotal * (self.vat_rate / Decimal('100'))
        
        # Calculate total
        self.total_amount = self.subtotal + self.vat_amount
        
        # Calculate amount due
        self.amount_due = self.total_amount - self.amount_paid
        
        # Auto-update status based on payment
        if self.amount_due <= Decimal('0.00') and self.status != 'Paid':
            self.status = 'Paid'
            if not self.paid_date:
                self.paid_date = timezone.now().date()
        elif self.due_date and timezone.now().date() > self.due_date and self.status not in ['Paid', 'Cancelled']:
            self.status = 'Overdue'
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"
        # Ensure one invoice per quote
        constraints = [
            models.UniqueConstraint(fields=['quote'], name='unique_quote_invoice')
        ]

