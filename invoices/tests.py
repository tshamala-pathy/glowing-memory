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

        # Active and completed projects
        Project.objects.create(
            name="Active Project",
            description="Desc",
            client=self.client_profile,
            quote=self.paid_invoice_current.quote,
            invoice=self.paid_invoice_current,
            status="in_progress",
        )
        Project.objects.create(
            name="Completed Project",
            description="Desc",
            client=self.client_profile,
            quote=self.paid_invoice_prev.quote,
            invoice=self.paid_invoice_prev,
            status="completed",
        )

    def test_financial_dashboard_metrics(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)
        url = reverse("financial-dashboard")

        response = api_client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Total revenue = sum of paid invoices
        expected_total_revenue = float(
            self.paid_invoice_current.total_amount
            + self.paid_invoice_prev.total_amount
        )
        self.assertEqual(data["total_revenue"], expected_total_revenue)

        # Yearly revenue = sum of paid invoices in current year
        today = timezone.now().date()
        expected_yearly = 0.0
        for inv in (self.paid_invoice_current, self.paid_invoice_prev):
            if inv.paid_date.year == today.year:
                expected_yearly += float(inv.total_amount)
        self.assertEqual(data["yearly_revenue"], expected_yearly)

        # Monthly revenue should have entries for current and previous month
        current_key = today.strftime("%Y-%m")
        prev_month = today.month - 1 or 12
        prev_year = today.year if today.month > 1 else today.year - 1
        prev_key = f"{prev_year}-{prev_month:02d}"

        self.assertIn(current_key, data["monthly_revenue"])
        self.assertIn(prev_key, data["monthly_revenue"])
        self.assertEqual(
            data["monthly_revenue"][current_key],
            float(self.paid_invoice_current.total_amount),
        )
        self.assertEqual(
            data["monthly_revenue"][prev_key],
            float(self.paid_invoice_prev.total_amount),
        )

        # Unpaid total and overdue totals
        self.assertGreater(data["unpaid_invoices_total"], 0.0)
        self.assertGreater(data["overdue_invoices_total"], 0.0)

        # Active projects count (pending + in_progress)
        self.assertEqual(data["active_projects_count"], 1)
