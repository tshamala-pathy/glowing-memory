from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    ProfileView,
    ProfileUpdateView,
    ChangePasswordView,
    ChangeEmailView,
    CustomTokenObtainPairView,
    UserListViewSet,
    UserAdminViewSet,
    ForgotPasswordView,
    ResetPasswordView,
    NotificationViewSet,
)
from rest_framework_simplejwt.views import TokenRefreshView

# ================================
# URL Configuration for User Authentication
# ================================
# Note: /api/profile/ (aggregated) is defined in PathyCodeback/urls.py

router = DefaultRouter()
router.register(r'list', UserListViewSet, basename='user-list')
router.register(r'admin', UserAdminViewSet, basename='user-admin')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    # Endpoint for user registration
    path('register/', RegisterView.as_view(), name='register'),

    # Endpoint to retrieve the currently authenticated user's profile
    path('profile/', ProfileView.as_view(), name='profile'),
    # Endpoint to update profile (first name, last name, bio, avatar)
    path('profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    # Change password (current + new + confirm)
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    # Change email (new email + password)
    path('change-email/', ChangeEmailView.as_view(), name='change_email'),

    # Endpoint to obtain a JWT access and refresh token pair (email-based login)
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Alternative endpoint for login compatibility
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),

    # Endpoint to refresh the JWT access token using a refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password recovery endpoints
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Include router URLs for user list (admin only)
    path('', include(router.urls)),
]