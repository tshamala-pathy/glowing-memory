from rest_framework import viewsets, status, filters
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
from PathyCodeback.permissions import IsSuperuser, CanViewFinancialDashboard
from .models import Invoice, Payment
from .serializers import InvoiceSerializer
from .utils import generate_invoice_pdf
from quotes.models import Quote
from clients.models import Project, Client
from django.contrib.auth import get_user_model
from users.activity import log_activity
import logging
User = get_user_model()


logger = logging.getLogger(__name__)


def send_invoice_email(invoice):
    """
    Send an invoice notification email to the client.

    The email summarises key invoice details (project title, amount, due date)
    and is typically called after an invoice is created or its status changes
    to ``unpaid``.

    Args:
        invoice (Invoice): Invoice instance to send to the client.
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
    Financial dashboard metrics for explicitly authorized staff/superusers.

    Query params:
        period — month | quarter | year | all | custom
        start, end — YYYY-MM-DD when period=custom
        upcoming_days — 7 or 14 (default 14)
        export — pdf | csv
    """
    permission_classes = [IsAuthenticated, CanViewFinancialDashboard]

    def get(self, request):
        from .financial_dashboard import (
            build_financial_dashboard,
            financial_dashboard_csv,
            financial_dashboard_pdf,
        )

        period = request.query_params.get('period', 'month')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        try:
            upcoming_days = int(request.query_params.get('upcoming_days', 14) or 14)
        except (TypeError, ValueError):
            upcoming_days = 14
        export = request.query_params.get('export')

        if export == 'csv':
            return financial_dashboard_csv(
                period=period,
                start_str=start,
                end_str=end,
                upcoming_days=upcoming_days,
            )
        if export == 'pdf':
            data = build_financial_dashboard(
                period=period,
                start_str=start,
                end_str=end,
                upcoming_days=upcoming_days,
            )
            return financial_dashboard_pdf(data)

        data = build_financial_dashboard(
            period=period,
            start_str=start,
            end_str=end,
            upcoming_days=upcoming_days,
        )
        return Response(data)


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
        Staff/superusers see all invoices; clients see own only.
        """
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.is_staff):
            return qs
        if user.is_authenticated:
            profile = getattr(user, 'client_profile', None)
            if profile:
                return qs.filter(Q(client=profile) | Q(client__isnull=True, client_email__iexact=user.email))
            return qs.filter(client_email__iexact=user.email)
        return qs

    def get_permissions(self):
        """List, retrieve, pdf: authenticated (own only). Staff follow-up actions: IsAdminUser. Else: superuser."""
        if self.action in ('list', 'retrieve', 'pdf'):
            return [IsAuthenticated()]
        if self.action in ('send_reminder', 'mark_contacted'):
            return [IsAdminUser()]
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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """
        Export all invoices as CSV.
        Admin/staff only.
        """
        from PathyCodeback.csv_export import branded_csv_response

        response, writer = branded_csv_response(
            'invoices.csv',
            'Invoices Export',
            'Complete export of invoice records including billing status, amounts, and due dates.',
        )
        writer.writerow(
            [
                "ID",
                "Invoice Number",
                "Client Name",
                "Client Email",
                "Status",
                "Issue Date",
                "Due Date",
                "Subtotal",
                "VAT Rate",
                "VAT Amount",
                "Total Amount",
                "Amount Paid",
                "Amount Due",
            ]
        )
        for inv in Invoice.objects.all().order_by("id"):
            writer.writerow(
                [
                    inv.id,
                    inv.invoice_number,
                    inv.client_name,
                    inv.client_email,
                    inv.status,
                    inv.issue_date.isoformat() if inv.issue_date else "",
                    inv.due_date.isoformat() if inv.due_date else "",
                    float(inv.subtotal),
                    float(inv.vat_rate),
                    float(inv.vat_amount),
                    float(inv.total_amount),
                    float(inv.amount_paid),
                    float(inv.amount_due),
                ]
            )
        return response
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """
        Mark an invoice as fully paid and trigger follow-up workflow.

        This action:

        * Sets invoice status to ``paid`` and updates payment timestamps/amounts.
        * Attempts to move the linked quote status from ``approved``/``invoiced``
          to ``paid`` using the quote state machine.
        * Relies on signals in ``clients.signals`` to auto-create a corresponding
          project for the paid invoice.

        Args:
            request (Request): DRF request instance.
            pk (int | str): Primary key of the invoice being marked as paid.

        Returns:
            Response: Serialized invoice data after the update.
        """
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.amount_paid = invoice.total_amount
        invoice.amount_due = Decimal('0.00')
        invoice.paid_date = timezone.now().date()
        invoice.paid_at = timezone.now()
        invoice.save()
        log_activity(request.user, 'invoice_marked_paid', object_type='invoice', object_id=invoice.id, details=invoice.invoice_number)

        # Optional: update quote to legacy 'paid' if transition is allowed (e.g. invoiced → paid).
        # In the main workflow, quote stays 'approved'; invoice/project track payment.
        if invoice.quote_id and getattr(invoice.quote, 'status', None) in ('invoiced',):
            from quotes.models import Quote
            old_status = invoice.quote.status
            try:
                Quote.validate_status_transition(old_status, 'paid')
                invoice.quote.status = 'paid'
                invoice.quote.save(update_fields=['status'])
            except Exception as e:
                logger.debug(
                    "Quote %s not moved to 'paid' (allowed): %s",
                    getattr(invoice.quote, "id", None),
                    e,
                )

        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def send_reminder(self, request, pk=None):
        """Send a payment reminder email for an open invoice."""
        invoice = self.get_object()
        if invoice.status in ('paid', 'cancelled'):
            return Response(
                {'detail': 'Cannot send reminder for a closed invoice.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        subject = f'Payment reminder — Invoice {invoice.invoice_number}'
        message = f"""
Hello {invoice.client_name},

This is a friendly reminder that invoice {invoice.invoice_number} has an outstanding balance.

Amount due: R {invoice.amount_due:.2f}
Due date: {invoice.due_date.strftime('%B %d, %Y') if invoice.due_date else 'As soon as possible'}

Once payment is received, we can proceed with your project.

Please arrange payment at your earliest convenience. If you have already paid, please disregard this message.

Best regards,
{getattr(settings, 'BRAND_NAME', 'PathyCode')} Team
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
            logger.error('Error sending invoice reminder: %s', e, exc_info=True)
            return Response({'detail': 'Failed to send reminder email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        from notifications.helpers import notify_invoice_payment_reminder

        notify_invoice_payment_reminder(invoice)
        log_activity(
            request.user,
            'invoice_reminder_sent',
            object_type='invoice',
            object_id=invoice.id,
            details=invoice.invoice_number,
        )
        return Response({'detail': 'Payment reminder sent.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_contacted(self, request, pk=None):
        """Log that staff contacted the client about this invoice."""
        invoice = self.get_object()
        log_activity(
            request.user,
            'invoice_contacted',
            object_type='invoice',
            object_id=invoice.id,
            details=invoice.invoice_number,
        )
        return Response({'detail': 'Marked as contacted.'})
    
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
        log_activity(request.user, 'invoice_created', object_type='invoice', object_id=invoice.id, details=invoice.invoice_number)
        
        # Send email if status is 'unpaid'
        if invoice.status == 'unpaid':
            send_invoice_email(invoice)
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ================================
# Payment page: Quote → Payment → Invoice → Project
# ================================
def _get_quote_client(quote):
    """Resolve Client for quote: quote.client or User by quote.client_email -> client_profile."""
    if quote.client_id:
        return quote.client
    try:
        user = User.objects.get(email__iexact=quote.client_email)
        return getattr(user, 'client_profile', None) or Client.objects.filter(user=user).first()
    except User.DoesNotExist:
        return None


def _user_can_access_quote(request, quote):
    """True if request.user is the quote owner (client or client_email match)."""
    if not request.user.is_authenticated:
        return False
    profile = getattr(request.user, 'client_profile', None)
    if profile and quote.client_id == profile.id:
        return True
    if quote.client_email and quote.client_email.lower() == (request.user.email or '').lower():
        return True
    return False


class PaymentQuoteView(APIView):
    """
    GET  /api/payment/quote/<quote_id>/ — Payment page data (only if quote.status == approved and user is owner).
    POST /api/payment/quote/<quote_id>/complete/ — Record payment success: create Payment(paid), Invoice(paid), then Project is auto-created via signal.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, quote_id):
        try:
            quote = Quote.objects.get(pk=quote_id)
        except Quote.DoesNotExist:
            return Response({'error': 'Quote not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _user_can_access_quote(request, quote):
            return Response({'error': 'You do not have access to this quote.'}, status=status.HTTP_403_FORBIDDEN)
        # Idempotent: if invoice already exists (payment already completed), return success with invoice info
        existing = Invoice.objects.filter(quote=quote).first()
        if existing:
            return Response({
                'quote_id': quote.id,
                'project_title': quote.project_title,
                'quote_amount': float(quote.estimated_amount or 0),
                'amount': float(quote.estimated_amount or 0),
                'invoice_amount': float(existing.total_amount or quote.estimated_amount or 0),
                'payment_method': 'PayFast',
                'payment_status': 'paid',
                'already_paid': True,
                'invoice_id': existing.id,
                'invoice_number': existing.invoice_number,
            })
        if quote.status != 'approved':
            return Response(
                {'error': 'Payment is only available for approved quotes.', 'quote_status': quote.status},
                status=status.HTTP_400_BAD_REQUEST
            )
        amount = quote.estimated_amount or Decimal('0.00')
        from payments.models import Payment as ExternalPayment
        latest_payment = ExternalPayment.objects.filter(quote=quote).order_by('-created_at').first()
        payment_status = latest_payment.payment_status if latest_payment else 'awaiting_payment'
        return Response({
            'quote_id': quote.id,
            'project_title': quote.project_title,
            'service_type': quote.service_type,
            'client_name': quote.client_name,
            'quote_amount': float(amount),
            'amount': float(amount),
            'invoice_amount': float(amount),
            'payment_method': 'PayFast',
            'payment_status': payment_status,
            'already_paid': False,
        })

    def post(self, request, quote_id):
        """Record payment success: create Payment(paid), then Invoice(paid). Project is auto-created by clients.signals."""
        try:
            quote = Quote.objects.get(pk=quote_id)
        except Quote.DoesNotExist:
            return Response({'error': 'Quote not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _user_can_access_quote(request, quote):
            return Response({'error': 'You do not have access to this quote.'}, status=status.HTTP_403_FORBIDDEN)
        if quote.status != 'approved':
            return Response(
                {'error': 'Only approved quotes can be paid.', 'quote_status': quote.status},
                status=status.HTTP_400_BAD_REQUEST
            )
        if Invoice.objects.filter(quote=quote).exists():
            invoice = Invoice.objects.get(quote=quote)
            return Response({
                'message': 'Payment already recorded for this quote.',
                'invoice_id': invoice.id,
                'invoice_number': invoice.invoice_number,
            }, status=status.HTTP_200_OK)
        client = _get_quote_client(quote)
        if not client:
            return Response(
                {'error': 'Could not determine client for this quote. Please ensure you are logged in as the quote owner.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        amount = quote.estimated_amount or Decimal('0.00')
        now = timezone.now()
        payment = Payment.objects.create(
            client=client,
            quote=quote,
            amount=amount,
            payment_status='paid',
            payment_date=now,
        )
        invoice = Invoice(
            quote=quote,
            created_by=request.user,
            status='draft',
        )
        invoice.save()
        invoice.status = 'paid'
        invoice.amount_paid = invoice.total_amount
        invoice.amount_due = Decimal('0.00')
        invoice.paid_date = now.date()
        invoice.paid_at = now
        invoice.save()
        log_activity(request.user, 'payment_completed', object_type='invoice', object_id=invoice.id, details=f'{quote.project_title} - {invoice.invoice_number}')
        serializer = InvoiceSerializer(invoice)
        return Response({
            'message': 'Payment recorded. Invoice created and project will appear in your portal.',
            'invoice': serializer.data,
        }, status=status.HTTP_201_CREATED)


class AdminPaymentsView(APIView):
    """List all payment records (invoice + PayFast) for admin."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from payments.models import Payment as PayFastPayment

        invoice_payments = Payment.objects.select_related('client', 'quote').order_by('-created_at')[:500]
        payfast_payments = PayFastPayment.objects.select_related('client', 'quote', 'user').order_by('-created_at')[:500]

        def client_label(client):
            return client.name if client else ''

        return Response({
            'invoice_payments': [
                {
                    'id': p.id,
                    'source': 'invoice',
                    'quote_id': p.quote_id,
                    'quote_title': p.quote.project_title if p.quote else '',
                    'client': client_label(p.client),
                    'amount': float(p.amount),
                    'status': p.payment_status,
                    'payment_date': p.payment_date.isoformat() if p.payment_date else None,
                    'created_at': p.created_at.isoformat() if p.created_at else None,
                }
                for p in invoice_payments
            ],
            'payfast_payments': [
                {
                    'id': p.id,
                    'source': 'payfast',
                    'quote_id': p.quote_id,
                    'quote_title': p.quote.project_title if p.quote else '',
                    'client': client_label(p.client),
                    'user': (p.user.get_full_name() or p.user.email) if p.user else '',
                    'amount': float(p.amount),
                    'currency': p.currency,
                    'status': p.payment_status,
                    'provider_reference': p.provider_reference or '',
                    'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                    'created_at': p.created_at.isoformat() if p.created_at else None,
                }
                for p in payfast_payments
            ],
        })

