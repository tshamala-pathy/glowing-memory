from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from PathyCodeback.permissions import IsSuperuser
from .models import NewsletterSubscription
from .serializers import NewsletterSubscriptionSerializer

class NewsletterSubscriptionView(generics.CreateAPIView):
    """
    API endpoint for subscribing to newsletter.
    Allows anyone to subscribe (no authentication required).
    """
    queryset = NewsletterSubscription.objects.all()
    serializer_class = NewsletterSubscriptionSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        # Handle reactivation before serializer unique validation rejects duplicate emails
        raw_email = (request.data.get('email') or '').strip()
        if raw_email:
            existing = NewsletterSubscription.objects.filter(email__iexact=raw_email).first()
            if existing:
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
                if existing.is_active:
                    return Response(
                        {'detail': 'This email is already subscribed to our newsletter.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                existing.is_active = True
                existing.subscribed_ip = ip
                existing.save()
                return Response(
                    {'detail': 'Your subscription has been reactivated.'},
                    status=status.HTTP_200_OK
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

        serializer.save(is_active=True, subscribed_ip=ip)
        return Response(
            {'detail': 'Successfully subscribed to newsletter!'},
            status=status.HTTP_201_CREATED
        )

class NewsletterSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing newsletter subscriptions. Superuser-only.
    """
    queryset = NewsletterSubscription.objects.all().order_by('-subscribed_at')
    serializer_class = NewsletterSubscriptionSerializer
    permission_classes = [IsSuperuser]


class SendNewsletterView(APIView):
    """
    Send a newsletter email to all active subscribers. Superuser-only.
    POST body: { subject, body, html_body? (optional), test_mode? (bool) }
    - test_mode=True: send only to the authenticated user's email (for preview).
    """
    permission_classes = [IsSuperuser]

    def post(self, request):
        subject = request.data.get('subject', '').strip()
        body = request.data.get('body', '').strip()
        html_body = request.data.get('html_body', '').strip()
        test_mode = request.data.get('test_mode', False)

        if not subject:
            return Response(
                {'detail': 'Subject is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not body and not html_body:
            return Response(
                {'detail': 'Body or HTML body is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not body:
            body = html_body[:500] + '...' if len(html_body) > 500 else html_body  # fallback for non-HTML clients

        recipients = []
        if test_mode:
            user_email = getattr(request.user, 'email', None)
            if not user_email:
                return Response(
                    {'detail': 'Your account has no email. Add one in your profile to use test mode.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            recipients = [user_email]
        else:
            subs = NewsletterSubscription.objects.filter(is_active=True).values_list('email', flat=True)
            recipients = list(subs)
            if not recipients:
                return Response(
                    {'detail': 'No active subscribers to send to.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
        sent = 0
        errors = []

        for email in recipients:
            try:
                msg = EmailMessage(
                    subject=subject,
                    body=body,
                    from_email=from_email,
                    to=[email],
                )
                if html_body:
                    msg.content_subtype = 'html'
                    msg.body = html_body
                msg.send()
                sent += 1
            except Exception as e:
                errors.append(f'{email}: {str(e)}')

        if test_mode:
            return Response({
                'detail': f'Test email sent to {recipients[0]}.',
                'sent': sent,
            }, status=status.HTTP_200_OK)

        if errors and sent == 0:
            return Response({
                'detail': 'Failed to send newsletter.',
                'errors': errors[:10],  # limit response size
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'detail': f'Newsletter sent to {sent} subscriber{"s" if sent != 1 else ""}.',
            'sent': sent,
            'failed': len(errors),
            'errors': errors[:5] if errors else None,
        }, status=status.HTTP_200_OK)
