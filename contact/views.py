from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from PathyCodeback.permissions import IsSuperuser
from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    Contact form: anyone can POST. List/retrieve/update/delete are superuser-only.
    Messages are linked to Client when submitted by authenticated user.
    my_messages: authenticated users see their own messages (by client or email).
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action == 'my_messages':
            return [IsAuthenticated()]
        return [IsSuperuser()]

    def perform_create(self, serializer):
        """Link message to Client when user is authenticated."""
        msg = serializer.save()
        if self.request.user.is_authenticated:
            profile = getattr(self.request.user, 'client_profile', None)
            if profile:
                msg.client = profile
                msg.save(update_fields=['client'])

    @action(detail=False, methods=['get'])
    def my_messages(self, request):
        """Return contact messages sent by the authenticated user (by client or email)."""
        profile = getattr(request.user, 'client_profile', None)
        if profile:
            messages = ContactMessage.objects.filter(client=profile).order_by('-created_at')[:20]
        else:
            messages = ContactMessage.objects.filter(
                email__iexact=request.user.email
            ).order_by('-created_at')[:20]
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
