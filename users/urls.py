from django.urls import path
from .views import RegisterView, ProfileView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ================================
# URL Configuration for User Authentication
# ================================

urlpatterns = [
    # Endpoint for user registration
    path('register/', RegisterView.as_view(), name='register'),

    # Endpoint to retrieve the currently authenticated user's profile
    path('profile/', ProfileView.as_view(), name='profile'),

    # Endpoint to obtain a JWT access and refresh token pair
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # Endpoint to refresh the JWT access token using a refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
# Note: The TokenObtainPairView and TokenRefreshView are provided by the
# `rest_framework_simplejwt` package, which must be installed and configured