from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from PathyCodeback.permissions import IsSuperuser
from .models import AboutUs, Value, Solution
from .serializers import AboutUsSerializer, ValueSerializer, SolutionSerializer

class AboutUsView(generics.RetrieveAPIView):
    """
    Public API: retrieve About Us content. No authentication required.
    Returns the most recent About Us instance.
    """
    serializer_class = AboutUsSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        """
        Return the most recent About Us instance, or create a default one if none exists.
        """
        about_us = AboutUs.objects.first()
        if not about_us:
            # Create default instance if none exists
            about_us = AboutUs.objects.create()
        return about_us
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AboutUsViewSet(viewsets.ModelViewSet):
    """
    Admin API for full CRUD on About Us. Superuser only.
    """
    queryset = AboutUs.objects.all()
    serializer_class = AboutUsSerializer
    permission_classes = [IsSuperuser]
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """Return the first AboutUs instance (singleton pattern)."""
        instance = self.get_queryset().first()
        if not instance:
            instance = AboutUs.objects.create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ValueViewSet(viewsets.ModelViewSet):
    """
    Admin API for full CRUD on Values. Superuser only.
    """
    queryset = Value.objects.all()
    serializer_class = ValueSerializer
    permission_classes = [IsSuperuser]
    
    def get_queryset(self):
        """Filter values by about_us if provided."""
        queryset = super().get_queryset()
        about_us_id = self.request.query_params.get('about_us', None)
        if about_us_id:
            queryset = queryset.filter(about_us_id=about_us_id)
        return queryset


class SolutionViewSet(viewsets.ModelViewSet):
    """Admin API for CRUD on Solutions. Superuser only."""
    queryset = Solution.objects.all()
    serializer_class = SolutionSerializer
    permission_classes = [IsSuperuser]

    def get_queryset(self):
        queryset = super().get_queryset()
        about_us_id = self.request.query_params.get('about_us', None)
        if about_us_id:
            queryset = queryset.filter(about_us_id=about_us_id)
        return queryset
