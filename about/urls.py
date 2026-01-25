from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AboutUsView, AboutUsViewSet, ValueViewSet

# Router for ViewSets (admin CRUD)
router = DefaultRouter()
router.register(r'admin', AboutUsViewSet, basename='aboutus-admin')
router.register(r'values', ValueViewSet, basename='value')

urlpatterns = [
    path('', AboutUsView.as_view(), name='about_us'),  # Public read-only endpoint
    path('', include(router.urls)),  # Admin CRUD endpoints
]

