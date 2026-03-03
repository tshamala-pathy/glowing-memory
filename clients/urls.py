from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ProjectViewSet, CaseStudyViewSet, TaskViewSet

# ================================
# URL Configuration for Clients App
# ================================

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'case-studies', CaseStudyViewSet, basename='casestudy')

urlpatterns = [
    path('', include(router.urls)),
]
