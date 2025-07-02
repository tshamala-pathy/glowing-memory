from django.shortcuts import render
from rest_framework import generics, permissions
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer

# ================================
# User Authentication Views
# ================================

# View for user registration
class RegisterView(generics.CreateAPIView):
    """
    API endpoint that allows new users to register.
    Accessible to anyone (no authentication required).
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

# View for retrieving the authenticated user's profile
class ProfileView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve the profile of the currently authenticated user.
    Only accessible to logged-in users.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Return the current authenticated user.
        """
        return self.request.user
# View for updating the authenticated user's profile
class ProfileUpdateView(generics.UpdateAPIView):
    """
    API endpoint to update the profile of the currently authenticated user.
    Only accessible to logged-in users.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Return the current authenticated user.
        """
        return self.request.user