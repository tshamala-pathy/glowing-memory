from rest_framework import viewsets, permissions, filters
from .models import Testimonial
from .serializers import TestimonialSerializer

class TestimonialViewSet(viewsets.ModelViewSet):
    """
    API endpoint for testimonials.
    Requires authentication for all operations.
    """
    queryset = Testimonial.objects.all()  # Show all testimonials to authenticated users
    serializer_class = TestimonialSerializer
    permission_classes = [permissions.IsAuthenticated]  # Require authentication for all operations
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    ordering = ['-is_featured', '-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
