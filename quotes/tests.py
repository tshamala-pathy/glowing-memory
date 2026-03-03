from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client
from invoices.models import Invoice
from .models import Quote


User = get_user_model()


class QuoteInvoiceAutomationTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username="client",
            email="client@example.com",
            password="password",
        )
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="password",
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            name="ClientCo",
        )

    def _create_replied_quote(self):
        return Quote.objects.create(
            client=self.client_profile,
            client_name="Client Name",
            client_email="client@example.com",
            project_title="Automation Project",
            project_description="Test project for invoice automation",
            requirements_accepted=True,
            status="replied",
            estimated_amount=Decimal("1234.56"),
        )

    def test_client_approval_creates_draft_invoice_and_marks_quote_invoiced(self):
        quote = self._create_replied_quote()
        api_client = APIClient()
        api_client.force_authenticate(user=self.client_user)

        url = reverse("quote-decision", args=[quote.id])
        response = api_client.post(url, {"decision": "approve"}, format="json")
        self.assertEqual(response.status_code, 200)

        # Refresh instances from DB
        quote.refresh_from_db()
        invoices = Invoice.objects.filter(quote=quote)

        self.assertEqual(quote.status, "invoiced")
        self.assertEqual(invoices.count(), 1)

        invoice = invoices.first()
        self.assertEqual(invoice.status, "draft")
        self.assertEqual(invoice.client, self.client_profile)
        self.assertEqual(invoice.client_email, quote.client_email)
        self.assertEqual(invoice.subtotal, quote.estimated_amount)
        self.assertGreater(invoice.total_amount, invoice.subtotal)

    def test_admin_approve_creates_draft_invoice_and_marks_quote_invoiced(self):
        quote = self._create_replied_quote()
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin_user)

        url = reverse("quote-approve", args=[quote.id])
        response = api_client.post(url, {}, format="json")
        self.assertEqual(response.status_code, 200)

        quote.refresh_from_db()
        invoices = Invoice.objects.filter(quote=quote)

        self.assertEqual(quote.status, "invoiced")
        self.assertEqual(invoices.count(), 1)

        invoice = invoices.first()
        self.assertEqual(invoice.status, "draft")
        self.assertEqual(invoice.client, self.client_profile)
        self.assertEqual(invoice.client_email, quote.client_email)
        self.assertEqual(invoice.subtotal, quote.estimated_amount)
        self.assertGreater(invoice.total_amount, invoice.subtotal)
