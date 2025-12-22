from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NewsletterSubscriptionView, NewsletterSubscriptionViewSet

router = DefaultRouter()
router.register(r'subscriptions', NewsletterSubscriptionViewSet, basename='newslettersubscription')

urlpatterns = [
    path('subscribe/', NewsletterSubscriptionView.as_view(), name='newsletter_subscribe'),
    path('', include(router.urls)),
]

