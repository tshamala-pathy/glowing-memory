from django.shortcuts import render
from rest_framework import viewsets
from .models import Service
from .serializers import ServiceSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

# ✅ ViewSet for handling Service model API endpoints.
class ServiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows services to be viewed or edited.

    This viewset provides full CRUD operations (Create, Read, Update, Delete)
    and uses IsAuthenticatedOrReadOnly permission, allowing read access to
    unauthenticated users and write access to authenticated users only.
    """
    queryset = Service.objects.all().order_by('-created_at')  # Fetch all services ordered by creation date (newest first)
    serializer_class = ServiceSerializer  # Use the custom serializer to control JSON structure
    permission_classes = [IsAuthenticatedOrReadOnly]  # Allow read access to everyone; write access only to authenticated users
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']  # Restrict to only standard CRUD HTTP methods
    """
    Metadata options for the ServiceViewSet.

    - `queryset`: Defines the set of objects to be operated on.
    - `serializer_class`: Specifies the serializer to use for input/output.
    - `permission_classes`: Lists the permission classes to apply to this viewset.
    - `http_method_names`: Restricts the allowed HTTP methods for this viewset.
    """