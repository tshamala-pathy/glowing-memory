from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Quote
from .serializers import QuoteSerializer


class QuoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quotes/estimates.
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

