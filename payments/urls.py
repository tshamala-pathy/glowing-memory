"""
PayFast payment URL configuration.

Routes:
  - pay/<quote_id>/     : Start payment (session auth), redirect to PayFast
  - notify/              : ITN callback (PayFast server-to-server POST)
  - success/             : User redirect after payment (may show simulate button in DEBUG)
  - cancel/              : User redirect if payment cancelled
  - simulate-itn/        : Local dev only (DEBUG): simulate ITN when notify_url unreachable
"""
from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    path("pay/<int:quote_id>/", views.create_payfast_payment, name="payfast-pay"),
    path("notify/", views.payfast_notify, name="payfast-notify"),
    path("success/", views.payment_success, name="payfast-success"),
    path("cancel/", views.payment_cancel, name="payfast-cancel"),
    path("simulate-itn/", views.simulate_itn, name="payfast-simulate-itn"),
]

