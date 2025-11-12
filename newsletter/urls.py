from django.urls import path
from .views import NewsletterSubscriptionView

urlpatterns = [
    path('subscribe/', NewsletterSubscriptionView.as_view(), name='newsletter_subscribe'),
]

