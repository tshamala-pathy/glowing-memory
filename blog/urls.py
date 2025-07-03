from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import BlogPostViewSet

router = DefaultRouter()
router.register(r'', BlogPostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
# This file defines the URL routing for the blog app.
# It uses Django REST Framework's DefaultRouter to automatically generate the URL patterns for the BlogPost API.