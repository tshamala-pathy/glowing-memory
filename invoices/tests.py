from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal

from rest_framework.test import APIClient

from clients.models import Client, Project
from quotes.models import Quote
from .models import Invoice


User = get_user_model()


def grant_financial_dashboard_access(user):
    from django.contrib.auth.models import Permission
    from django.contrib.contenttypes.models import ContentType

    content_type = ContentType.objects.get(app_label='invoices', model='invoice')
    permission = Permission.objects.get(content_type=content_type, codename='view_financial_dashboard')
    user.user_permissions.add(permission)


class InvoiceModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin", email="admin@example.com", password="password"
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.name = "ACME Corp"
        self.client_profile.save()
        self.quote = Quote.objects.create(
            client=self.client_profile,
            client_name="John Doe",
            client_email="john@example.com",
            project_title="Test Project",
            project_description="Test project description",
            requirements_accepted=True,
            status="approved",
            estimated_amount=Decimal("1000.00"),
        )

    def test_invoice_created_from_approved_quote_populates_fields(self):
        invoice = Invoice.objects.create(
            quote=self.quote,
            created_by=self.user,
        )

        self.assertIsNotNone(invoice.invoice_number)
        self.assertEqual(invoice.client, self.client_profile)
        self.assertEqual(invoice.client_name, self.quote.client_name)
        self.assertEqual(invoice.client_email, self.quote.client_email)
        self.assertEqual(invoice.subtotal, self.quote.estimated_amount)
        self.assertGreater(invoice.total_amount, invoice.subtotal)
        self.assertEqual(invoice.amount_paid, Decimal("0.00"))
        self.assertEqual(invoice.amount_due, invoice.total_amount)
        self.assertIsNotNone(invoice.due_date)
        issue = invoice.issue_date.date() if hasattr(invoice.issue_date, 'date') else invoice.issue_date
        due = invoice.due_date.date() if hasattr(invoice.due_date, 'date') else invoice.due_date
        self.assertEqual((due - issue).days, 30)

    def test_invoice_overdue_status_set_when_due_past_and_unpaid(self):
        invoice = Invoice.objects.create(
            quote=self.quote,
            created_by=self.user,
            status="unpaid",
        )
        invoice.due_date = timezone.now().date() - timezone.timedelta(days=7)
        invoice.amount_paid = Decimal("0.00")
        invoice.calculate_totals()
        invoice.save()

        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "overdue")


class InvoiceWorkflowTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="superadmin",
            email="admin@example.com",
            password="password",
        )
        self.client_profile = Client.objects.get(user=self.admin)
        self.client_profile.name = "Client Ltd"
        self.client_profile.save()
        self.quote = Quote.objects.create(
            client=self.client_profile,
            client_name="Client User",
            client_email="client@example.com",
            project_title="Workflow Project",
            project_description="Workflow project description",
            requirements_accepted=True,
            status="approved",
            estimated_amount=Decimal("2000.00"),
        )
        self.invoice = Invoice.objects.create(
            quote=self.quote,
            created_by=self.admin,
            status="unpaid",
        )

    def test_mark_paid_action_sets_fields_and_creates_project(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("invoice-mark-paid", args=[self.invoice.id])

        response = api_client.post(url)
        self.assertEqual(response.status_code, 200)

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")
        self.assertEqual(self.invoice.amount_paid, self.invoice.total_amount)
        self.assertEqual(self.invoice.amount_due, Decimal("0.00"))
        self.assertIsNotNone(self.invoice.paid_date)
        self.assertIsNotNone(self.invoice.paid_at)

        self.assertTrue(Project.objects.filter(invoice=self.invoice).exists())

        project = Project.objects.get(invoice=self.invoice)
        self.assertEqual(project.client, self.client_profile)
        self.assertEqual(project.quote, self.quote)
        self.assertEqual(project.status, "planning")


class FinancialDashboardTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="dashboard_admin",
            email="dash@example.com",
            password="password",
        )
        grant_financial_dashboard_access(self.admin)
        self.client_profile = Client.objects.get(user=self.admin)
        self.client_profile.name = "Dashboard Client"
        self.client_profile.save()

        today = timezone.now().date()
        # Current month paid invoice
        self.paid_invoice_current = Invoice.objects.create(
            quote=Quote.objects.create(
                client=self.client_profile,
                client_name="Client One",
                client_email="one@example.com",
                project_title="Current Month Project",
                project_description="Desc",
                requirements_accepted=True,
                status="approved",
                estimated_amount=Decimal("1500.00"),
            ),
            created_by=self.admin,
            status="paid",
            total_amount=Decimal("1500.00"),
            amount_paid=Decimal("1500.00"),
            amount_due=Decimal("0.00"),
            issue_date=today,
            paid_date=today,
        )

        # Previous month paid invoice
        prev_month = today.month - 1 or 12
        prev_year = today.year if today.month > 1 else today.year - 1
        prev_month_date = today.replace(year=prev_year, month=prev_month, day=1)

        self.paid_invoice_prev = Invoice.objects.create(
            quote=Quote.objects.create(
                client=self.client_profile,
                client_name="Client Two",
                client_email="two@example.com",
                project_title="Previous Month Project",
                project_description="Desc",
                requirements_accepted=True,
                status="approved",
                estimated_amount=Decimal("500.00"),
            ),
            created_by=self.admin,
            status="paid",
            total_amount=Decimal("500.00"),
            amount_paid=Decimal("500.00"),
            amount_due=Decimal("0.00"),
            issue_date=prev_month_date,
            paid_date=prev_month_date,
        )

        # Unpaid, not overdue invoice
        Invoice.objects.create(
            quote=Quote.objects.create(
                client=self.client_profile,
                client_name="Client Three",
                client_email="three@example.com",
                project_title="Unpaid Project",
                project_description="Desc",
                requirements_accepted=True,
                status="approved",
                estimated_amount=Decimal("800.00"),
            ),
            created_by=self.admin,
            status="unpaid",
            total_amount=Decimal("800.00"),
            amount_paid=Decimal("0.00"),
            amount_due=Decimal("800.00"),
            issue_date=today,
            due_date=today + timezone.timedelta(days=7),
        )

        # Overdue invoice
        overdue_invoice = Invoice.objects.create(
            quote=Quote.objects.create(
                client=self.client_profile,
                client_name="Client Four",
                client_email="four@example.com",
                project_title="Overdue Project",
                project_description="Desc",
                requirements_accepted=True,
                status="approved",
                estimated_amount=Decimal("300.00"),
            ),
            created_by=self.admin,
            status="unpaid",
            total_amount=Decimal("300.00"),
            amount_paid=Decimal("0.00"),
            amount_due=Decimal("300.00"),
            issue_date=today - timezone.timedelta(days=30),
            due_date=today - timezone.timedelta(days=7),
        )
        overdue_invoice.calculate_totals()
        overdue_invoice.save()

        # Active and completed projects (clients.Project uses planning, design, development, testing, completed)
        Project.objects.create(
            name="Active Project",
            description="Desc",
            client=self.client_profile,
            quote=self.paid_invoice_current.quote,
            invoice=self.paid_invoice_current,
            status="development",
        )
        Project.objects.create(
            name="Completed Project",
            description="Desc",
            client=self.client_profile,
            quote=self.paid_invoice_prev.quote,
            invoice=self.paid_invoice_prev,
            status="completed",
        )

        # Approved quote with no invoice yet (awaiting PayFast / client payment)
        self.approved_awaiting_payment = Quote.objects.create(
            client=self.client_profile,
            client_name="Client Five",
            client_email="five@example.com",
            project_title="Awaiting Payment Project",
            project_description="Desc",
            requirements_accepted=True,
            status="approved",
            estimated_amount=Decimal("1200.00"),
            approved_at=timezone.now(),
        )

    def test_superuser_without_financial_grant_denied(self):
        denied_admin = User.objects.create_superuser(
            username="locked_financial_admin",
            email="locked@example.com",
            password="password",
        )
        api_client = APIClient()
        api_client.force_authenticate(user=denied_admin)
        response = api_client.get(reverse("financial-dashboard"))
        self.assertEqual(response.status_code, 403)

    def test_financial_dashboard_metrics(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("financial-dashboard")

        response = api_client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Default period is month — only current month paid invoice counts
        self.assertEqual(data["total_revenue"], float(self.paid_invoice_current.total_amount))
        self.assertIn("period_label", data)
        self.assertIn("vat_summary", data)
        self.assertIn("quote_funnel", data)
        self.assertIn("upcoming_due", data)
        self.assertIn("revenue_by_service_type", data)
        self.assertIn("reconciliation", data)
        self.assertIn("smart_metrics", data)
        self.assertIn("client_health", data)
        self.assertIn("cash_forecast", data)
        self.assertIn("vat_ytd", data["vat_summary"])

        today = timezone.now().date()
        current_key = today.strftime("%Y-%m")
        self.assertIn(current_key, data["monthly_revenue"])
        self.assertEqual(
            data["monthly_revenue"][current_key],
            float(self.paid_invoice_current.total_amount),
        )

        self.assertGreater(data["unpaid_invoices_total"], 0.0)
        self.assertGreater(data["overdue_invoices_total"], 0.0)
        self.assertEqual(data["active_projects_count"], 1)

        self.assertIn("yearly_revenue", data)
        self.assertIn("unpaid_invoices_count", data)
        self.assertIn("overdue_invoices_count", data)
        self.assertIn("overdue_aging", data)
        self.assertIn("payments", data)
        self.assertIn("pipeline", data)
        self.assertIn("needs_attention", data)
        self.assertIn("payment_followups", data)
        self.assertIn("finance_activity", data)
        self.assertIn("recent_collections", data)
        self.assertGreaterEqual(data["unpaid_invoices_count"], 1)
        self.assertGreaterEqual(data["overdue_invoices_count"], 1)
        self.assertGreater(len(data["needs_attention"]), 0)
        self.assertGreater(len(data["payment_followups"]), 0)
        pending = [p for p in data["payment_followups"] if p["type"] == "pending_invoice"]
        self.assertGreater(len(pending), 0)
        for item in data["payment_followups"]:
            action_keys = [a["key"] for a in item.get("actions", [])]
            if item["type"] == "approved_quote":
                self.assertIn("send_payment_reminder", action_keys)
                self.assertIn("mark_quote_contacted", action_keys)
            else:
                self.assertIn("send_reminder", action_keys)
                self.assertIn("mark_contacted", action_keys)
        if data["upcoming_due"]:
            self.assertIn("actions", data["upcoming_due"][0])
            self.assertIn("send_reminder", [a["key"] for a in data["upcoming_due"][0]["actions"]])

        approved_quotes = [p for p in data["payment_followups"] if p["type"] == "approved_quote"]
        self.assertGreater(len(approved_quotes), 0)
        self.assertIn("send_payment_reminder", [a["key"] for a in approved_quotes[0]["actions"]])
        self.assertIn("awaiting_payment", data["pipeline"])
        self.assertGreater(len(data["pipeline"]["awaiting_payment"]), 0)

        self.assertGreater(len(data["recent_collections"]), 0)

        # Upcoming due invoice (due in 7 days)
        self.assertGreaterEqual(len(data["upcoming_due"]), 1)

        funnel = data["quote_funnel"]
        stage_keys = [s["key"] for s in funnel["stages"]]
        self.assertEqual(stage_keys, ["pending", "reviewed", "approved", "paid"])
        self.assertIn("pending_to_reviewed", funnel["conversion_rates"])

    def test_financial_dashboard_upcoming_7_days(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("financial-dashboard")

        response = api_client.get(url, {"upcoming_days": 7})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upcoming_days"], 7)

    def test_financial_dashboard_csv_export(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("financial-dashboard")

        response = api_client.get(url, {"period": "month", "export": "csv"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response["Content-Type"])
        content = response.content.decode("utf-8-sig")
        self.assertIn("Paid invoices", content)
        self.assertIn("Outstanding invoices", content)
        self.assertIn("VAT summary", content)
        self.assertIn("PayFast payment log", content)

    def test_financial_dashboard_all_time(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("financial-dashboard")

        response = api_client.get(url, {"period": "all"})
        self.assertEqual(response.status_code, 200)
        data = response.json()

        expected_total_revenue = float(
            self.paid_invoice_current.total_amount + self.paid_invoice_prev.total_amount
        )
        self.assertEqual(data["total_revenue"], expected_total_revenue)

        today = timezone.now().date()
        prev_month = today.month - 1 or 12
        prev_year = today.year if today.month > 1 else today.year - 1
        prev_key = f"{prev_year}-{prev_month:02d}"
        self.assertIn(prev_key, data["monthly_revenue"])

    def test_financial_dashboard_pdf_export(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("financial-dashboard")

        response = api_client.get(url, {"period": "month", "export": "pdf"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))
        self.assertIn("financial-dashboard.pdf", response["Content-Disposition"])

    def test_invoice_send_reminder(self):
        from notifications.models import InAppNotification

        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        open_invoice = Invoice.objects.exclude(status__in=('paid', 'cancelled')).first()
        self.assertIsNotNone(open_invoice)
        url = reverse("invoice-send-reminder", kwargs={"pk": open_invoice.pk})
        with patch("invoices.views.send_mail") as mock_mail:
            response = api_client.post(url)
        self.assertEqual(response.status_code, 200)
        mock_mail.assert_called_once()
        self.assertTrue(
            InAppNotification.objects.filter(
                event_type=InAppNotification.EVENT_INVOICE_PAYMENT_REMINDER,
                user=self.admin,
            ).exists()
        )

    def test_reminder_and_contact_recorded_in_dashboard_activity(self):
        from users.models import ActivityLog

        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        open_invoice = Invoice.objects.exclude(status__in=('paid', 'cancelled')).first()
        self.assertIsNotNone(open_invoice)

        with patch("invoices.views.send_mail"):
            api_client.post(reverse("invoice-send-reminder", kwargs={"pk": open_invoice.pk}))
        api_client.post(reverse("invoice-mark-contacted", kwargs={"pk": open_invoice.pk}))

        self.assertTrue(
            ActivityLog.objects.filter(action='invoice_reminder_sent', object_id=open_invoice.pk).exists()
        )
        self.assertTrue(
            ActivityLog.objects.filter(action='invoice_contacted', object_id=open_invoice.pk).exists()
        )

        dash = api_client.get(reverse("financial-dashboard")).json()
        actions = {entry["action"] for entry in dash.get("finance_activity", [])}
        self.assertIn("invoice_reminder_sent", actions)
        self.assertIn("invoice_contacted", actions)

    def test_quote_send_payment_reminder(self):
        from notifications.models import InAppNotification

        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("quote-send-payment-reminder", kwargs={"pk": self.approved_awaiting_payment.pk})
        with patch("quotes.views.send_mail") as mock_mail:
            response = api_client.post(url)
        self.assertEqual(response.status_code, 200)
        mock_mail.assert_called_once()
        notification = InAppNotification.objects.filter(
            event_type=InAppNotification.EVENT_QUOTE_PAYMENT_REMINDER,
            user=self.admin,
            link=f'/payment/{self.approved_awaiting_payment.pk}',
        ).first()
        self.assertIsNotNone(notification)
        self.assertIn('Payment required', notification.title)

    def test_staff_user_can_send_quote_payment_reminder(self):
        staff = User.objects.create_user(
            username="dashboard_staff",
            email="staff@example.com",
            password="password",
            is_staff=True,
            is_superuser=False,
        )
        api_client = APIClient()
        api_client.force_authenticate(user=staff)
        url = reverse("quote-send-payment-reminder", kwargs={"pk": self.approved_awaiting_payment.pk})
        with patch("quotes.views.send_mail") as mock_mail:
            response = api_client.post(url)
        self.assertEqual(response.status_code, 200, response.data if hasattr(response, "data") else response.content)
        mock_mail.assert_called_once()
