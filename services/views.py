from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from PathyCodeback.permissions import IsSuperuser
from .models import Service
from .serializers import ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    Public read: list and retrieve services (no auth). Create/update/delete: superuser only.
    """
    queryset = Service.objects.all().order_by('sort_order', '-created_at')
    serializer_class = ServiceSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsSuperuser()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context