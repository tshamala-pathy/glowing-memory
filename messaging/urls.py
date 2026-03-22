from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageThreadViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'threads', MessageThreadViewSet, basename='messaging-thread')
router.register(r'messages', MessageViewSet, basename='messaging-message')

urlpatterns = [
    path('', include(router.urls)),
]
