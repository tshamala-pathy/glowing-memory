from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkTaskViewSet

router = DefaultRouter()
router.register(r'', WorkTaskViewSet, basename='work-task')

urlpatterns = [
    path('', include(router.urls)),
]
