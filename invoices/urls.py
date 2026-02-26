from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, FinancialDashboardView

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('dashboard/', FinancialDashboardView.as_view(), name='financial-dashboard'),
    path('', include(router.urls)),
]

