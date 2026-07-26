from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InAppNotificationViewSet, AdminInAppNotificationViewSet

router = DefaultRouter()
router.register(r'admin', AdminInAppNotificationViewSet, basename='admin-in-app-notification')
router.register(r'', InAppNotificationViewSet, basename='in-app-notification')

urlpatterns = [
    path('', include(router.urls)),
]
