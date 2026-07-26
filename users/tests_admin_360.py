from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.test import TestCase

from clients.models import Client
from quotes.models import Quote

User = get_user_model()


class AdminUser360APITest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin360',
            email='admin360@example.com',
            password='password',
        )
        self.client_user = User.objects.create_user(
            username='clientuser',
            email='client360@example.com',
            password='password',
            first_name='Client',
            last_name='User',
        )
        self.client_profile = Client.objects.get(user=self.client_user)
        self.client_profile.name = 'Acme Corp'
        self.client_profile.save()
        Quote.objects.create(
            client=self.client_profile,
            client_email=self.client_user.email,
            project_title='Website rebuild',
            status='pending',
        )

    def test_superuser_can_fetch_user_360(self):
        self.api.force_authenticate(user=self.admin)
        url = reverse('user-admin-user-360', kwargs={'pk': self.client_user.pk})
        response = self.api.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'client360@example.com')
        self.assertEqual(response.data['client']['name'], 'Acme Corp')
        self.assertEqual(response.data['stats']['total_quotes'], 1)
        self.assertIn('threads', response.data)
        self.assertIn('activity', response.data)
        self.assertIn('payments', response.data)

    def test_non_superuser_denied_user_360(self):
        self.api.force_authenticate(user=self.client_user)
        url = reverse('user-admin-user-360', kwargs={'pk': self.client_user.pk})
        response = self.api.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
