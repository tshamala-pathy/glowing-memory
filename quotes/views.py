from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from .models import Quote
from .serializers import QuoteSerializer

User = get_user_model()


def send_quote_confirmation_email(quote):
    """
    Send confirmation email to client after quote submission.
    
    Args:
        quote: Quote instance that was just created
    """
    subject = 'Quote Request Received - PathyCode'
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
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pathycodes.com'),
            recipient_list=[quote.client_email],
            fail_silently=False,
        )
    except Exception as e:
        # Log error but don't fail the quote creation
        print(f"Error sending quote confirmation email: {e}")


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
        print("Warning: No admin users found to notify about new quote request")
        return
    
    subject = f'New Quote Request: {quote.project_title}'
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
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pathycodes.com'),
                recipient_list=admin_emails,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending admin notification email: {e}")


def send_quote_response_email(quote):
    """
    Send admin's response to the client.
    
    Args:
        quote: Quote instance with admin_response filled
    """
    if not quote.admin_response:
        return
    
    subject = f'Response to Your Quote Request: {quote.project_title}'
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
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pathycodes.com'),
            recipient_list=[quote.client_email],
            fail_silently=False,
        )
        # Update replied_at timestamp
        quote.replied_at = timezone.now()
        quote.save(update_fields=['replied_at'])
    except Exception as e:
        print(f"Error sending quote response email: {e}")


class QuoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quotes/estimates.
    
    Quote Request Workflow:
    1. Client submits quote (public POST) → Email confirmation sent to client, admin notified
    2. Admin reviews quote → Updates status, adds admin_response
    3. Admin marks as "Replied" → Response email sent to client
    
    Permissions:
    - Anyone can create a quote (public submission)
    - Only authenticated users can view/list quotes
    - Only authenticated users can update/delete quotes
    """
    queryset = Quote.objects.all().order_by('-created_at')
    serializer_class = QuoteSerializer
    
    def get_permissions(self):
        """
        Allow anyone to create quotes, but require authentication for other actions.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
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
        
        # Send emails
        send_quote_confirmation_email(quote)
        send_admin_notification_email(quote)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """
        Update a quote (admin only).
        
        If status is changed to 'Replied' and admin_response is provided,
        automatically sends response email to client.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Check if status is being changed to 'Replied' and admin_response exists
        old_status = instance.status
        new_status = request.data.get('status', old_status)
        admin_response = request.data.get('admin_response', instance.admin_response)
        
        quote = serializer.save()
        
        # Send response email if status changed to 'Replied' and response exists
        if new_status == 'Replied' and admin_response and old_status != 'Replied':
            send_quote_response_email(quote)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_response(self, request, pk=None):
        """
        Manually trigger sending of admin response email to client.
        Requires admin_response to be set.
        """
        quote = self.get_object()
        
        if not quote.admin_response:
            return Response(
                {'error': 'Admin response must be set before sending email.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        send_quote_response_email(quote)
        
        # Update status to 'Replied' if not already
        if quote.status != 'Replied':
            quote.status = 'Replied'
            quote.save(update_fields=['status'])
        
        serializer = self.get_serializer(quote)
        return Response({
            'message': 'Response email sent successfully.',
            'quote': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a quote."""
        quote = self.get_object()
        quote.status = 'Approved'
        quote.approved_at = timezone.now()
        quote.assigned_to = request.user
        quote.save()
        serializer = self.get_serializer(quote)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a quote."""
        quote = self.get_object()
        quote.status = 'Rejected'
        quote.save()
        serializer = self.get_serializer(quote)
        return Response(serializer.data)

