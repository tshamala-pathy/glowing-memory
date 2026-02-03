from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    Contact form messages: anyone can POST (public form); list/retrieve/update/delete require auth.
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
