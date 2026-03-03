from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProjectViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='portfolio')

urlpatterns = [
    path('', include(router.urls)),
]
# This file defines the URL routing for the projects app, allowing access to the ProjectViewSet.
# The DefaultRouter automatically creates the necessary routes for the viewset, including list, create,