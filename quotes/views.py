"""
REST API for quote (estimate) lifecycle: submission, admin review, client decision,
proposal retrieval, PDF export, and CSV export.

Payment and invoice creation are triggered after the client approves and completes
payment — see ``get_quote_payment_url`` and the payments app.
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.http import HttpResponse
from PathyCodeback.permissions import IsSuperuser
from .models import Quote
from .serializers import QuoteSerializer
from users.activity import log_activity
from .utils import generate_quote_pdf
import logging
import csv

User = get_user_model()
logger = logging.getLogger(__name__)


def get_quote_payment_url(quote):
    """
    Build payment page URL for an approved quote.

    After client approves a quote they are redirected to the Payment page
    at /payment/{quote_id} to complete payment. Invoice and Project are
    created only after successful payment.

    Args:
        quote (Quote): Quote instance for which a payment link is needed.

    Returns:
        str: Absolute URL to payment page if FRONTEND_URL is set,
        otherwise relative path /payment/{quote.id}.
    """
    base = getattr(settings, 'FRONTEND_URL', '').strip().rstrip('/')
    path = f"/payment/{quote.id}"
    if base:
        return f"{base}{path}"
    return path


def send_quote_confirmation_email(quote):
    """
    Send confirmation email to client after quote submission.
    
    Args:
        quote: Quote instance that was just created
    """
    subject = "Quote Request Received - PathyCode"
    message = f"""
Hello {quote.client_name},

Thank you for your interest in our services! We have received your quote request for:

Project: {quote.project_title}

We will review your requirements and get back to you within 24-48 hours with a detailed estimate.

Your request details:
- Service Type: {quote.service_type or quote.project_type or 'Not specified'}
- Budget Range: {quote.budget_range or 'Not specified'}
- Timeline: {quote.timeline or 'Not specified'}

If you have any questions in the meantime, please don't hesitate to contact us.

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
            recipient_list=[quote.client_email],
            fail_silently=False,
        )
    except Exception as e:
        # Log error but don't fail the quote creation
        logger.error("Error sending quote confirmation email: %s", e, exc_info=True)


def send_admin_notification_email(quote):
    """
    Notify admin users of a new quote request.
    
    Args:
        quote: Quote instance that was just created
    """
    # Get all admin users (superusers or staff)
    admin_users = User.objects.filter(is_superuser=True, is_active=True)
    
    if not admin_users.exists():
        # If no admin users, try staff users
        admin_users = User.objects.filter(is_staff=True, is_active=True)
    
    if not admin_users.exists():
        logger.warning("No admin users found to notify about new quote request")
        return
    
    subject = f"New Quote Request: {quote.project_title}"
    message = f"""
A new quote request has been submitted:

Client: {quote.client_name} ({quote.client_email})
Project: {quote.project_title}
Service Type: {quote.service_type or quote.project_type or 'Not specified'}
Budget Range: {quote.budget_range or 'Not specified'}
Timeline: {quote.timeline or 'Not specified'}

Project Description:
{quote.project_description[:500]}{'...' if len(quote.project_description) > 500 else ''}

View and respond to this quote in the admin panel.

Quote ID: {quote.id}
"""
    
    admin_emails = [user.email for user in admin_users if user.email]
    
    if admin_emails:
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", "noreply@pathycodes.com"
                ),
                recipient_list=admin_emails,
                fail_silently=False,
            )
        except Exception as e:
            logger.error(
                "Error sending admin notification email: %s", e, exc_info=True
            )


def send_quote_response_email(quote):
    """
    Send admin's response to the client.
    
    Args:
        quote: Quote instance with admin_response filled
    """
    if not quote.admin_response:
        return
    
    subject = f"Response to Your Quote Request: {quote.project_title}"
    message = f"""
Hello {quote.client_name},

Thank you for your quote request. We have reviewed your project requirements and here is our response:

{quote.admin_response}

{'Estimated Amount: R ' + str(quote.estimated_amount) if quote.estimated_amount else ''}

If you have any questions or would like to discuss this further, please don't hesitate to contact us.

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
            recipient_list=[quote.client_email],
            fail_silently=False,
        )
        # Update responded_at timestamp
        quote.responded_at = timezone.now()
        quote.save(update_fields=["responded_at"])
    except Exception as e:
        logger.error("Error sending quote response email: %s", e, exc_info=True)


class QuoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quotes/estimates.

    Access control:
    - Clients never see other clients' quotes. get_queryset() restricts non-superusers
      to quotes where request.user is the owner (client FK or client_email match).
    - Superuser (admin) has full control: list all, retrieve any, update, delete,
      send_response, approve, reject.

    Quote workflow:
    1. Client submits quote (public POST) → confirmation email, admin notified
    2. Admin reviews → updates status, admin_response; marks "Replied" → response email
    3. Client approves/declines via decision action (owner-only)
    """
    queryset = Quote.objects.all().order_by('-created_at')
    serializer_class = QuoteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status']
    search_fields = ['project_title', 'client_name', 'client_email', 'company_name']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Restrict so clients never access other clients' quotes.
        Non-superusers: only quotes where client=request.user's client_profile, or
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
        """
        Create: public. List/retrieve: authenticated (clients see own only).
        decision: authenticated, owner-only (enforced by get_queryset).
        Update/delete/other actions: superuser only.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        elif self.action in ('list', 'retrieve', 'decision', 'pdf', 'proposal', 'approve', 'reject', 'request_changes'):
            permission_classes = [IsAuthenticated]
        elif self.action == 'export_csv':
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsSuperuser]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """
        Create a new quote request.
        
        Validates that requirements_accepted is True for public submissions.
        Sends confirmation email to client and notification to admin.
        """
        # Validate requirements acceptance for public submissions
        requirements_accepted = request.data.get('requirements_accepted', False)
        if not requirements_accepted:
            return Response(
                {'requirements_accepted': ['You must read and accept the requirements before submitting a quote request.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set requirements_accepted_at timestamp
        data = request.data.copy()
        data['requirements_accepted_at'] = timezone.now()
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        quote = serializer.save()
        if request.user.is_authenticated:
            profile = getattr(request.user, 'client_profile', None)
            if profile:
                quote.client = profile
                quote.save(update_fields=['client'])
            log_activity(request.user, 'quote_submitted', object_type='quote', object_id=quote.id, details=quote.project_title)
        
        # Send emails
        send_quote_confirmation_email(quote)
        send_admin_notification_email(quote)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """
        Update a quote (admin only).
        Enforces state machine: only pending → replied is allowed for admin.
        Status 'paid' is system-only (set when invoice is marked paid).
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        new_status = request.data.get('status', old_status)

        if new_status == 'paid':
            return Response(
                {'status': ['Quote status "paid" is set by the system after payment success, not by admin.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if old_status != new_status:
            try:
                Quote.validate_status_transition(old_status, new_status)
            except Exception as e:
                if hasattr(e, 'message_dict'):
                    return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
                return Response({'status': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        admin_response = request.data.get('admin_response', instance.admin_response)
        quote = serializer.save()

        # When admin sets status to reviewed, set responded_at and payment_url (for post-approval redirect)
        if new_status == 'reviewed' and admin_response and old_status != 'reviewed':
            quote.responded_at = timezone.now()
            quote.payment_url = get_quote_payment_url(quote)
            quote.save(update_fields=['responded_at', 'payment_url'])
            send_quote_response_email(quote)
            log_activity(request.user, 'quote_reviewed', object_type='quote', object_id=quote.id, details=quote.project_title)
        # Legacy: same for 'replied' for existing data
        if new_status == 'replied' and admin_response and old_status != 'replied':
            quote.responded_at = timezone.now()
            quote.payment_url = get_quote_payment_url(quote)
            quote.save(update_fields=['responded_at', 'payment_url'])
            send_quote_response_email(quote)
            log_activity(request.user, 'quote_reviewed', object_type='quote', object_id=quote.id, details=quote.project_title)

        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_response(self, request, pk=None):
        """
        Send admin response to client (admin only). Sets status to 'reviewed'.
        Requires: price (estimated_amount), timeline (proposal_timeline), scope, and admin_response.
        Client then sees the proposal and can Approve, Reject, or Request Changes.
        """
        quote = self.get_object()
        errors = []
        if not quote.admin_response:
            errors.append('Admin notes (admin_response) must be set.')
        if not quote.estimated_amount:
            errors.append('Price (estimated_amount) must be set.')
        if not quote.proposal_timeline or not str(quote.proposal_timeline).strip():
            errors.append('Timeline (proposal_timeline) must be set.')
        if not quote.scope or not str(quote.scope).strip():
            errors.append('Scope must be set.')
        if errors:
            return Response({'error': ' '.join(errors)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            Quote.validate_status_transition(quote.status, 'reviewed')
        except Exception as e:
            if hasattr(e, 'message_dict'):
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
            return Response({'status': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

        send_quote_response_email(quote)
        log_activity(request.user, 'quote_reviewed', object_type='quote', object_id=quote.id, details=quote.project_title)
        if quote.status != 'reviewed':
            quote.status = 'reviewed'
            quote.responded_at = timezone.now()
            quote.payment_url = get_quote_payment_url(quote)
            quote.save(update_fields=['status', 'responded_at', 'payment_url'])
        elif not quote.payment_url:
            quote.payment_url = get_quote_payment_url(quote)
            quote.save(update_fields=['payment_url'])

        serializer = self.get_serializer(quote)
        return Response({
            'message': 'Response sent successfully. Client can now view and approve/decline in their portal.',
            'quote': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def decision(self, request, pk=None):
        """
        Client decision endpoint: approve or decline a quote.

        Permission: Authenticated users only. Access is owner-only: get_object() uses
        get_queryset(), which restricts to quotes where request.user is the client
        (by client FK or client_email). Clients cannot access other clients' quotes;
        404 is returned for non-owner access.
        POST body: { "decision": "approve" } or { "decision": "decline" }
        """
        quote = self.get_object()
        decision = (request.data.get('decision') or '').strip().lower()
        if decision not in ('approve', 'decline'):
            return Response(
                {'decision': ['Must be "approve" or "decline".']},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Client can only approve/decline from 'reviewed' (or legacy 'replied')
        new_status = 'approved' if decision == 'approve' else 'rejected'
        try:
            Quote.validate_status_transition(quote.status, new_status)
        except Exception as e:
            if hasattr(e, 'message_dict'):
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
            return Response({'status': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        quote.client_decision_at = now
        if decision == 'approve':
            quote.status = 'approved'
            quote.approved_at = now
            quote.assigned_to = request.user
            quote.save(update_fields=['status', 'client_decision_at', 'approved_at', 'assigned_to'])
            log_activity(request.user, 'quote_approved', object_type='quote', object_id=quote.id, details=quote.project_title)
            # Payment URL for redirect to /payment/{quote_id}; Invoice is created only after payment success
            if not quote.payment_url:
                quote.payment_url = get_quote_payment_url(quote)
                quote.save(update_fields=['payment_url'])
            # Do NOT create invoice here — invoice is created automatically after successful payment
        else:
            quote.status = 'rejected'
            quote.save(update_fields=['status', 'client_decision_at'])
            log_activity(request.user, 'quote_declined', object_type='quote', object_id=quote.id, details=quote.project_title)
        serializer = self.get_serializer(quote)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='proposal')
    def proposal(self, request, pk=None):
        """
        GET /api/quotes/{id}/proposal/ — Full proposal details for client review.
        Owner-only (enforced by get_queryset). Returns full quote including scope, deliverables, timeline, terms.
        """
        quote = self.get_object()
        serializer = self.get_serializer(quote)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a quote. Client (owner) or admin. reviewed/replied → approved. Redirect client to payment."""
        quote = self.get_object()
        try:
            Quote.validate_status_transition(quote.status, 'approved')
        except Exception as e:
            if hasattr(e, 'message_dict'):
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
            return Response({'status': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
        quote.status = 'approved'
        quote.approved_at = timezone.now()
        quote.client_decision_at = timezone.now()
        quote.assigned_to = request.user
        if not quote.payment_url:
            quote.payment_url = get_quote_payment_url(quote)
        quote.save(update_fields=['status', 'approved_at', 'client_decision_at', 'assigned_to', 'payment_url'])
        log_activity(request.user, 'quote_approved', object_type='quote', object_id=quote.id, details=f'{quote.project_title} (admin)')
        # Invoice is created automatically when client completes payment at /payment/{quote_id}

        serializer = self.get_serializer(quote)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a quote. Client (owner) or admin. reviewed/replied → rejected."""
        quote = self.get_object()
        try:
            Quote.validate_status_transition(quote.status, 'rejected')
        except Exception as e:
            if hasattr(e, 'message_dict'):
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
            return Response({'status': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
        quote.status = 'rejected'
        quote.client_decision_at = timezone.now()
        quote.save(update_fields=['status', 'client_decision_at'])
        log_activity(request.user, 'quote_declined', object_type='quote', object_id=quote.id, details=f'{quote.project_title}')
        serializer = self.get_serializer(quote)
        return Response(serializer.data)

    def _is_quote_owner(self, user, quote):
        """True if user is the client who owns this quote (by client FK or client_email)."""
        profile = getattr(user, 'client_profile', None)
        if profile and quote.client_id and quote.client_id == profile.id:
            return True
        if quote.client_id is None and quote.client_email and user.email:
            return quote.client_email.strip().lower() == user.email.strip().lower()
        return False

    @action(detail=True, methods=['post'], url_path='request-changes')
    def request_changes(self, request, pk=None):
        """Request changes (client/quote owner only). reviewed/replied → changes_requested. Saves client_response."""
        quote = self.get_object()
        if not self._is_quote_owner(request.user, quote):
            return Response(
                {'error': 'Only the client can request changes. Admins should edit the proposal and mark as reviewed.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            Quote.validate_status_transition(quote.status, 'changes_requested')
        except Exception as e:
            if hasattr(e, 'message_dict'):
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
            return Response({'status': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
        client_response = (request.data.get('client_response') or '').strip()
        quote.client_response = client_response or 'Client requested changes.'
        quote.status = 'changes_requested'
        quote.save(update_fields=['status', 'client_response'])
        log_activity(request.user, 'quote_changes_requested', object_type='quote', object_id=quote.id, details=quote.project_title)
        serializer = self.get_serializer(quote)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """
        Generate and download a branded PDF for this quote.
        Permissions: same as retrieve; clients can only access their own quotes.
        """
        quote = self.get_object()
        pdf_content = generate_quote_pdf(quote)

        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="quote_{quote.id}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """
        Export all quotes as CSV.
        Admin/staff only.
        """
        if not (request.user and (request.user.is_staff or request.user.is_superuser)):
            return Response(status=status.HTTP_403_FORBIDDEN)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="quotes.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Client Name",
                "Client Email",
                "Project Title",
                "Service Type",
                "Status",
                "Estimated Amount",
                "Created At",
            ]
        )
        for quote in Quote.objects.all().order_by("id"):
            writer.writerow(
                [
                    quote.id,
                    quote.client_name,
                    quote.client_email,
                    quote.project_title,
                    quote.service_type,
                    quote.status,
                    float(quote.estimated_amount) if quote.estimated_amount else "",
                    quote.created_at.isoformat() if quote.created_at else "",
                ]
            )
        return response

