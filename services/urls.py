from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet

router = DefaultRouter()
router.register(r'', ServiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
# This file defines the URL routing for the services app, allowing access to the ServiceViewSet.
# It uses Django REST Framework's DefaultRouter to automatically generate the necessary routes for CRUD operations.