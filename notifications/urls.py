from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InAppNotificationViewSet

router = DefaultRouter()
router.register(r'', InAppNotificationViewSet, basename='in-app-notification')

urlpatterns = [
    path('', include(router.urls)),
]
