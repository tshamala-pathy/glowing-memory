from decimal import Decimal

from django.conf import settings
from django.db import models


class Payment(models.Model):
    """
    Generic external payment record for a specific quote and client.

    This model can be used with any payment provider (e.g. PayFast) and is not
    tied to Stripe.
    """

    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
    ]

    # Link to Client business entity (preferred) if it exists, otherwise to auth user.
    # Here we use the Client model, which already owns quotes/invoices/projects.
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="external_payments",
        help_text="Business client this external payment belongs to.",
        null=True,
        blank=True,
    )

    # Optional direct link to user who initiated the payment (for auditing).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments",
        null=True,
        blank=True,
        help_text="User who initiated the payment (if applicable).",
    )

    quote = models.ForeignKey(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="payments",
        help_text="Quote this payment is associated with.",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Amount to be charged in the smallest currency unit.",
    )

    currency = models.CharField(
        max_length=10,
        default="usd",
        help_text="Three-letter ISO currency code (e.g. usd, eur, zar).",
    )

    provider_reference = models.CharField(
        max_length=255,
        blank=True,
        help_text="Payment provider reference/transaction ID for this payment.",
    )

    payment_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Current status of the payment.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when the payment was confirmed as paid.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self) -> str:
        return f"Payment {self.id} - {self.quote} - {self.amount} {self.currency}"

