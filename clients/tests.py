from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import Client, Project
from invoices.models import Invoice
from quotes.models import Quote


User = get_user_model()


class ProjectCompletionAutomationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="client",
            email="client@example.com",
            password="password",
        )
        self.client_profile = Client.objects.create(
            user=self.user,
            name="ClientCo",
        )
        self.quote = Quote.objects.create(
            client=self.client_profile,
            client_name="Client Name",
            client_email="client@example.com",
            project_title="Completion Project",
            project_description="Project for completion automation",
            requirements_accepted=True,
            status="approved",
        )
        self.invoice = Invoice.objects.create(
            quote=self.quote,
            created_by=self.user,
            status="paid",
        )
        self.project = Project.objects.create(
            name="Completion Project",
            description="Desc",
            client=self.client_profile,
            quote=self.quote,
            invoice=self.invoice,
            status="in_progress",
        )

    def test_project_completion_sets_timestamp(self):
        self.assertIsNone(self.project.completed_at)
        self.project.status = "completed"
        self.project.save()

        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "completed")
        self.assertIsNotNone(self.project.completed_at)
        # completed_at should be recent
        self.assertLess(
            abs(
                (self.project.completed_at - timezone.now()).total_seconds()
            ),
            10,
        )
