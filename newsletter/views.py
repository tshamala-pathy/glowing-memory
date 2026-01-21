from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Check if email already exists
        email = serializer.validated_data.get('email')
        if NewsletterSubscription.objects.filter(email=email).exists():
            subscription = NewsletterSubscription.objects.get(email=email)
            if subscription.is_active:
                return Response(
                    {'detail': 'This email is already subscribed to our newsletter.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Reactivate subscription
                subscription.is_active = True
                subscription.subscribed_ip = ip
                subscription.save()
                return Response(
                    {'detail': 'Your subscription has been reactivated.'},
                    status=status.HTTP_200_OK
                )
        
        # Create new subscription
        subscription = serializer.save(is_active=True, subscribed_ip=ip)
        return Response(
            {'detail': 'Successfully subscribed to newsletter!'},
            status=status.HTTP_201_CREATED
        )

class NewsletterSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing newsletter subscriptions (admin only).
    Allows authenticated users to list, retrieve, update, and delete subscriptions.
    """
    queryset = NewsletterSubscription.objects.all().order_by('-subscribed_at')
    serializer_class = NewsletterSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        # Allow updating all fields for admin operations
        return NewsletterSubscriptionSerializer
