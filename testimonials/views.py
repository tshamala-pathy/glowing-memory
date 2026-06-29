from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from PathyCodeback.permissions import IsSuperuser
from users.activity import log_activity
from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialViewSet(viewsets.ModelViewSet):
    """
    Public read: list and retrieve (no auth). Create: anyone (linked to Client when authenticated).
    Update/delete: superuser only.
    my_testimonials: authenticated users see their own testimonials.
    """
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    ordering = ['-is_featured', '-created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'create'):
            return [permissions.AllowAny()]
        if self.action == 'my_testimonials':
            return [permissions.IsAuthenticated()]
        return [IsSuperuser()]

    def perform_create(self, serializer):
        """Link testimonial to Client when user is authenticated."""
        testimonial = serializer.save()
        if self.request.user.is_authenticated:
            profile = getattr(self.request.user, 'client_profile', None)
            if profile:
                testimonial.client = profile
                testimonial.save(update_fields=['client'])
            log_activity(self.request.user, 'testimonial_submitted', object_type='testimonial', object_id=testimonial.id, details=(testimonial.testimonial or '')[:50])

    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def my_testimonials(self, request):
        """Return testimonials submitted by the authenticated user's client."""
        profile = getattr(request.user, 'client_profile', None)
        if not profile:
            return Response([])
        testimonials = Testimonial.objects.filter(client=profile).order_by('-created_at')
        serializer = self.get_serializer(testimonials, many=True)
        return Response(serializer.data)
