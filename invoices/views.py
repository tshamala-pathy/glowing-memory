from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime
from decimal import Decimal
import uuid
from .models import Invoice
from .serializers import InvoiceSerializer
from .utils import generate_invoice_pdf


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    - Only authenticated users can create/view/update invoices
    """
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Generate invoice number and set created_by."""
        # Generate unique invoice number
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Ensure invoice number is unique
        while Invoice.objects.filter(invoice_number=invoice_number).exists():
            invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        invoice = serializer.save(
            invoice_number=invoice_number,
            created_by=self.request.user
        )
        # Calculate totals
        invoice.calculate_totals()
    
    def perform_update(self, serializer):
        """Recalculate totals on update."""
        invoice = serializer.save()
        invoice.calculate_totals()
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate and download PDF invoice."""
        invoice = self.get_object()
        pdf_content = generate_invoice_pdf(invoice)
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid."""
        invoice = self.get_object()
        invoice.status = 'Paid'
        invoice.amount_paid = invoice.total_amount
        invoice.amount_due = Decimal('0.00')
        invoice.paid_date = timezone.now().date()
        invoice.save()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

