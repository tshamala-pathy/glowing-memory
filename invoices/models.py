from django.db import models
from django.conf import settings
from decimal import Decimal


class Invoice(models.Model):
    """
    Model for storing invoices with VAT support (important for South Africa).
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
    invoice_number = models.CharField(max_length=50, unique=True)
    quote = models.ForeignKey(
        'quotes.Quote',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices'
    )
    
    # Client Information
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField()
    client_phone = models.CharField(max_length=20, blank=True, null=True)
    client_address = models.TextField(blank=True, null=True)
    client_company = models.CharField(max_length=255, blank=True, null=True)
    client_vat_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Service Provider Information (Your Business)
    provider_name = models.CharField(max_length=255, default='PathyCode')
    provider_address = models.TextField(blank=True, null=True)
    provider_phone = models.CharField(max_length=20, blank=True, null=True)
    provider_email = models.EmailField(blank=True, null=True)
    provider_vat_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Invoice Items
    items = models.JSONField(default=list, help_text="List of items with description, quantity, price")
    
    # Financial Details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15.00'), help_text="VAT rate in percentage (15% for South Africa)")
    vat_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_due = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Dates
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    
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
    
    def calculate_totals(self):
        """Calculate subtotal, VAT, and total amounts."""
        self.subtotal = sum(
            Decimal(str(item.get('price', 0))) * Decimal(str(item.get('quantity', 0)))
            for item in self.items
        )
        self.vat_amount = self.subtotal * (self.vat_rate / Decimal('100'))
        self.total_amount = self.subtotal + self.vat_amount
        self.amount_due = self.total_amount - self.amount_paid
        self.save()
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"

