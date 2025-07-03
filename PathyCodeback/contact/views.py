from django.shortcuts import render
from rest_framework import viewsets
from .models import ContactMessage
from .serializers import ContactMessageSerializer
from rest_framework.permissions import AllowAny

# Create your views here.

class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    📬 ContactMessageViewSet

    API endpoint that allows contact messages to be viewed or submitted.

    Features:
    - Supports GET, POST, PUT, PATCH, DELETE methods.
    - Orders messages by newest first (`created_at` descending).
    - Allows unauthenticated users to submit messages via the contact form.

    Attributes:
        queryset (QuerySet): All ContactMessage records ordered by creation date.
        serializer_class (Serializer): ContactMessageSerializer for transforming data.
        permission_classes (list): `AllowAny` — no authentication required.
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]  # Open for unauthenticated submissions
    def get_permissions(self):
        """
        Override to set permissions based on request method.
        Allows all methods for unauthenticated users.
        """
        if self.request.method in ['GET', 'POST']:
            return [AllowAny()]
        return super().get_permissions()