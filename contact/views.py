from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from .models import ContactMessage
from .serializers import ContactMessageSerializer

# Create your views here.

class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations for ContactMessage.
    Allows anyone to POST (submit contact form) but requires authentication for other operations.
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        """
        Allow anyone to create contact messages (POST),
        but require authentication for other operations.
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticatedOrReadOnly()]
