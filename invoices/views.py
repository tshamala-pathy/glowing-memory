from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from datetime import timedelta
from decimal import Decimal
from rest_framework.permissions import IsAuthenticated
from PathyCodeback.permissions import IsSuperuser
from .models import Invoice
from .serializers import InvoiceSerializer
from .utils import generate_invoice_pdf
from quotes.models import Quote


def send_invoice_email(invoice):
    """
    Send invoice email to client.
    
    Args:
        invoice: Invoice instance to send
    """
    subject = f'Invoice {invoice.invoice_number} - PathyCode'
    message = f"""
Hello {invoice.client_name},

Please find attached your invoice for the following project:

Project: {invoice.quote.project_title if invoice.quote else 'N/A'}
Invoice Number: {invoice.invoice_number}
Amount Due: R {invoice.amount_due:.2f}
Due Date: {invoice.due_date.strftime('%B %d, %Y')}

Payment Details:
- Total Amount: R {invoice.total_amount:.2f}
- Amount Paid: R {invoice.amount_paid:.2f}
- Amount Due: R {invoice.amount_due:.2f}

Please make payment by the due date to avoid any delays.

If you have any questions, please don't hesitate to contact us.

Best regards,
PathyCode Team
"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pathycodes.com'),
            recipient_list=[invoice.client_email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending invoice email: {e}")


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    Non-superusers see only their Client's invoices. Create/update/delete: superuser only.
    """
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        """Non-superusers see only their Client's invoices (by client FK or client_email)."""
        qs = super().get_queryset()
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            profile = getattr(self.request.user, 'client_profile', None)
            if profile:
                return qs.filter(Q(client=profile) | Q(client__isnull=True, client_email__iexact=self.request.user.email))
            return qs.filter(client_email__iexact=self.request.user.email)
        return qs

    def get_permissions(self):
        """List, retrieve, pdf: authenticated (own only). Create/update/delete/actions: superuser only."""
        if self.action in ('list', 'retrieve', 'pdf'):
            return [IsAuthenticated()]
        return [IsSuperuser()]
    
    def perform_create(self, serializer):
        """
        Create invoice from an approved quote only.
        Client and project details are automatically copied from the quote
        by the Invoice model's _populate_from_quote() during save.
        """
        quote = serializer.validated_data.get('quote')
        if not quote:
            raise ValidationError('Quote is required to create an invoice.')
        if quote.status != 'Approved':
            raise ValidationError(
                'Invoice can only be created from an approved quote. '
                f'Current status: {quote.status}. Please approve the quote first.'
            )
        if Invoice.objects.filter(quote=quote).exists():
            raise ValidationError('An invoice already exists for this quote.')

        issue_date = serializer.validated_data.get('issue_date', timezone.now().date())
        due_date = serializer.validated_data.get('due_date', issue_date + timedelta(days=30))

        # invoice_number is auto-generated in Invoice.save(); do not pass it here
        invoice = serializer.save(
            created_by=self.request.user,
            issue_date=issue_date,
            due_date=due_date
        )
        
        # Calculate totals (this also populates data from quote)
        invoice.calculate_totals()
        
        # Send email if status is 'Sent'
        if invoice.status == 'Sent':
            send_invoice_email(invoice)
    
    def perform_update(self, serializer):
        """
        Update invoice and recalculate totals.
        Send email if status changes to 'Sent'.
        """
        old_status = self.get_object().status
        invoice = serializer.save()
        invoice.calculate_totals()
        
        # Send email if status changed to 'Sent'
        if invoice.status == 'Sent' and old_status != 'Sent':
            send_invoice_email(invoice)
    
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
        """
        Mark invoice as paid.
        Only admin users can mark invoices as paid.
        """
        invoice = self.get_object()
        invoice.status = 'Paid'
        invoice.amount_paid = invoice.total_amount
        invoice.amount_due = Decimal('0.00')
        invoice.paid_date = timezone.now().date()
        invoice.save()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_from_quote(self, request):
        """
        Create an invoice directly from an approved quote (recommended).
        Client name, email, phone, company and project details (title, service type,
        description, estimated amount) are automatically copied from the quote.
        Invoice creation is blocked unless the quote status is 'Approved'.

        Payload:
            quote_id (required), issue_date, due_date, status (optional).
        """
        quote_id = request.data.get('quote_id')
        if not quote_id:
            return Response(
                {'error': 'quote_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            quote = Quote.objects.get(pk=quote_id)
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        if quote.status != 'Approved':
            return Response(
                {
                    'error': 'Invoice can only be created from an approved quote.',
                    'quote_status': quote.status,
                    'quote_id': quote.id,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        if Invoice.objects.filter(quote=quote).exists():
            return Response(
                {'error': 'An invoice already exists for this quote.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        issue_date = request.data.get('issue_date', timezone.now().date())
        due_date = request.data.get('due_date', issue_date + timedelta(days=30))
        invoice_status = request.data.get('status', 'Draft')
        invoice = Invoice(
            quote=quote,
            created_by=request.user,
            issue_date=issue_date,
            due_date=due_date,
            status=invoice_status,
        )
        invoice.save()
        invoice.calculate_totals()
        
        # Send email if status is 'Sent'
        if invoice.status == 'Sent':
            send_invoice_email(invoice)
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

