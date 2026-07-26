from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

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
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.name = "ClientCo"
        self.client_profile.save()
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


class PublicClientProjectTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='public_client',
            email='public-client@example.com',
            password='password',
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.public_project = Project.objects.create(
            name='Public Delivery Project',
            description='Visible on the Projects page.',
            client=self.client_profile,
            status='development',
            tech_stack='React,Django',
            is_public=True,
        )
        self.private_project = Project.objects.create(
            name='Private Delivery Project',
            description='Not visible publicly.',
            client=self.client_profile,
            status='planning',
            is_public=False,
        )

    def test_public_list_includes_only_public_projects(self):
        api_client = APIClient()
        response = api_client.get(reverse('project-public'))
        self.assertEqual(response.status_code, 200)
        names = [item['name'] for item in response.data]
        self.assertIn(self.public_project.name, names)
        self.assertNotIn(self.private_project.name, names)

    def test_anonymous_can_retrieve_public_project(self):
        api_client = APIClient()
        url = reverse('project-detail', kwargs={'pk': self.public_project.pk})
        response = api_client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], self.public_project.name)

    def test_anonymous_cannot_retrieve_private_project(self):
        api_client = APIClient()
        url = reverse('project-detail', kwargs={'pk': self.private_project.pk})
        response = api_client.get(url)
        self.assertEqual(response.status_code, 404)
