from rest_framework import generics, permissions
from .models import AboutUs
from .serializers import AboutUsSerializer

class AboutUsView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve About Us content.
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
