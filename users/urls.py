from django.urls import path
from .views import RegisterView, ProfileView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

# ================================
# URL Configuration for User Authentication
# ================================

urlpatterns = [
    # Endpoint for user registration
    path('register/', RegisterView.as_view(), name='register'),

    # Endpoint to retrieve the currently authenticated user's profile
    path('profile/', ProfileView.as_view(), name='profile'),

    # Endpoint to obtain a JWT access and refresh token pair (email-based login)
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Alternative endpoint for login compatibility
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),

    # Endpoint to refresh the JWT access token using a refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]