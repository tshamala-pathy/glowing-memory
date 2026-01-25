from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from .models import ContactMessage
from .serializers import ContactMessageSerializer

# Create your views here.

class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations for ContactMessage.
    Allows anyone to POST (submit contact form from homepage) but requires authentication for viewing/list operations.
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        """
        Allow anyone to create contact messages (POST) - needed for homepage contact form.
        Require authentication for viewing/list/update/delete operations.
        """
        if self.action == 'create':
            return [AllowAny()]  # Public form submission (may be on homepage)
        return [IsAuthenticated()]  # Require authentication for all other operations
