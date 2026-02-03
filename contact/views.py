from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from PathyCodeback.permissions import IsSuperuser
from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    Contact form: anyone can POST. List/retrieve/update/delete are superuser-only.
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsSuperuser()]
