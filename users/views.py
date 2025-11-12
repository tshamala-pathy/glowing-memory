from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

# ================================
# User Authentication Views
# ================================

# Custom Token View for email-based login
class CustomTokenObtainPairView(generics.GenericAPIView):
    """
    Custom token view that accepts email instead of username for login.
    Returns JWT access and refresh tokens along with user data.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get user data
        email = request.data.get('email')
        user = CustomUser.objects.get(email=email)
        user_data = UserSerializer(user).data
        
        return Response({
            'access': serializer.validated_data['access'],
            'refresh': serializer.validated_data['refresh'],
            'user': user_data
        }, status=status.HTTP_200_OK)

# View for user registration
class RegisterView(generics.CreateAPIView):
    """
    API endpoint that allows new users to register.
    Returns JWT tokens upon successful registration.
    Accessible to anyone (no authentication required).
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data
        }, status=status.HTTP_201_CREATED)

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