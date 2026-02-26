from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q, Sum, F
from django.db.models.functions import TruncMonth, TruncYear, Coalesce
from datetime import timedelta
from decimal import Decimal
from PathyCodeback.permissions import IsSuperuser
from .models import Invoice
from .serializers import InvoiceSerializer
from .utils import generate_invoice_pdf
from quotes.models import Quote
from clients.models import Project
import logging


logger = logging.getLogger(__name__)


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
            from_email=getattr(
                settings, "DEFAULT_FROM_EMAIL", "noreply@pathycodes.com"
            ),
            recipient_list=[invoice.client_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error("Error sending invoice email: %s", e, exc_info=True)


class FinancialDashboardView(APIView):
    """
    Financial dashboard metrics for admin only.
    Returns: total revenue, monthly revenue, yearly revenue, unpaid/outstanding total,
    overdue total, active projects count.
    All monetary sums use the same filters as the model (Paid = revenue; non-Paid/non-Cancelled = unpaid;
    overdue = due_date < today and not Paid/Cancelled).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        today = timezone.now().date()

        # Total revenue: sum of total_amount for all paid invoices (single source of truth)
        total_revenue_result = Invoice.objects.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )
        total_revenue = float(total_revenue_result['total'] or 0)

        # Yearly revenue: sum of total_amount for paid invoices in the current calendar year
        yearly_data = (
            Invoice.objects.filter(status='paid')
            .annotate(year=TruncYear(Coalesce(F('paid_date'), F('issue_date'))))
            .values('year')
            .annotate(revenue=Sum('total_amount'))
        )
        current_year = today.year
        yearly_revenue = 0.0
        for item in yearly_data:
            year_value = item['year'].year if hasattr(item['year'], 'year') else None
            if year_value == current_year:
                yearly_revenue = float(item['revenue'] or 0)
                break

        # Monthly revenue: last 6 calendar months; use paid_date for paid invoices, fallback to issue_date
        monthly_data = (
            Invoice.objects.filter(status='paid')
            .annotate(month=TruncMonth(Coalesce(F('paid_date'), F('issue_date'))))
            .values('month')
            .annotate(revenue=Sum('total_amount'))
            .order_by('-month')
        )
        # Build last 6 calendar months (YYYY-MM) with 0 for months that have no data
        monthly_revenue = {}
        for i in range(6):
            year = today.year
            month = today.month - i
            while month <= 0:
                month += 12
                year -= 1
            key = f"{year}-{month:02d}"
            monthly_revenue[key] = 0.0
        for item in monthly_data:
            key = item['month'].strftime('%Y-%m')
            if key in monthly_revenue:
                monthly_revenue[key] = float(item['revenue'] or 0)
        # Sort keys descending (most recent first) for consistent API response
        monthly_revenue = dict(sorted(monthly_revenue.items(), key=lambda x: x[0], reverse=True))

        # Unpaid invoices total / outstanding balance: sum of amount_due for non-paid, non-cancelled
        unpaid_result = Invoice.objects.exclude(
            status__in=('paid', 'cancelled')
        ).aggregate(total=Sum('amount_due'))
        unpaid_invoices_total = float(unpaid_result['total'] or 0)

        # Overdue total: sum amount_due where due_date < today AND not paid/cancelled
        overdue_result = Invoice.objects.filter(
            due_date__lt=today
        ).exclude(status__in=('paid', 'cancelled')).aggregate(total=Sum('amount_due'))
        overdue_invoices_total = float(overdue_result['total'] or 0)

        # Active projects: count pending + in_progress (exclude completed)
        active_projects_count = Project.objects.filter(
            status__in=('pending', 'in_progress')
        ).count()

        return Response({
            'total_revenue': total_revenue,
            'monthly_revenue': monthly_revenue,
             'yearly_revenue': yearly_revenue,
            'unpaid_invoices_total': unpaid_invoices_total,
             'outstanding_balance': unpaid_invoices_total,
            'overdue_invoices_total': overdue_invoices_total,
            'active_projects_count': active_projects_count,
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.

    Access control:
    - Clients never see other clients' invoices. get_queryset() restricts non-superusers
      to invoices where request.user is the owner (client FK or client_email match).
    - Superuser has full control: list all, retrieve any, create, update, delete,
      mark_paid, pdf, create_from_quote.
    """
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status']
    search_fields = ['invoice_number', 'client_name', 'client_email']
    ordering_fields = ['created_at', 'issue_date', 'due_date']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Restrict so clients never access other clients' invoices.
        Non-superusers: only invoices where client=request.user's client_profile, or
        client is null and client_email matches request.user.email. Superusers: all.
        """
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
        if quote.status != 'approved':
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
        
        # Send email if status is 'unpaid' (sent to client)
        if invoice.status == 'unpaid':
            send_invoice_email(invoice)
    
    def perform_update(self, serializer):
        """
        Update invoice and recalculate totals.
        Send email if status changes to 'unpaid'.
        """
        old_status = self.get_object().status
        invoice = serializer.save()
        invoice.calculate_totals()
        
        # Send email if status changed to 'unpaid'
        if invoice.status == 'unpaid' and old_status != 'unpaid':
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
        Mark invoice as paid (superuser only).
        System transition: also sets linked quote status to 'paid' (approved → paid).
        """
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.amount_paid = invoice.total_amount
        invoice.amount_due = Decimal('0.00')
        invoice.paid_date = timezone.now().date()
        invoice.paid_at = timezone.now()
        invoice.save()

        # Quote state machine: approved → paid (system only)
        if invoice.quote_id and getattr(invoice.quote, 'status', None) == 'approved':
            from quotes.models import Quote
            Quote.validate_status_transition('approved', 'paid')
            invoice.quote.status = 'paid'
            invoice.quote.save(update_fields=['status'])

        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_from_quote(self, request):
        """
        Create an invoice directly from an approved quote (recommended).
        Client name, email, phone, company and project details (title, service type,
        description, estimated amount) are automatically copied from the quote.
        Invoice creation is blocked unless the quote status is 'approved'.

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
        if quote.status != 'approved':
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
        invoice_status = request.data.get('status', 'draft')
        if invoice_status in ('Draft', 'Sent'):
            invoice_status = 'draft' if invoice_status == 'Draft' else 'unpaid'
        invoice = Invoice(
            quote=quote,
            created_by=request.user,
            issue_date=issue_date,
            due_date=due_date,
            status=invoice_status,
        )
        invoice.save()
        invoice.calculate_totals()
        
        # Send email if status is 'unpaid'
        if invoice.status == 'unpaid':
            send_invoice_email(invoice)
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

