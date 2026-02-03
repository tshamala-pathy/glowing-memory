from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Service
from .serializers import ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for services (CRUD). Requires authentication.
    Queryset ordered by created_at (newest first). Only standard HTTP methods allowed.
    """
    queryset = Service.objects.all().order_by('-created_at')
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']