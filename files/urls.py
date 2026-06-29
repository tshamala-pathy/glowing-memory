from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SharedFileViewSet

router = DefaultRouter()
router.register(r'', SharedFileViewSet, basename='shared-file')

urlpatterns = [
    path('', include(router.urls)),
]
