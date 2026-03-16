from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "quote", "client", "amount", "currency", "payment_status", "created_at", "paid_at")
    list_filter = ("payment_status", "currency", "created_at")
    search_fields = ("quote__project_title", "client__name", "provider_reference")

