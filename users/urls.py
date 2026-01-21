from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, ProfileView, CustomTokenObtainPairView, UserListViewSet
from rest_framework_simplejwt.views import TokenRefreshView

# ================================
# URL Configuration for User Authentication
# ================================

router = DefaultRouter()
router.register(r'list', UserListViewSet, basename='user-list')

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
    
    # Include router URLs for user list (admin only)
    path('', include(router.urls)),
]