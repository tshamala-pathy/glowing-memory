from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import NewsletterSubscription

User = get_user_model()


class NewsletterSubscriptionModelTest(TestCase):
    def test_str_returns_email(self):
        sub = NewsletterSubscription.objects.create(email='user@example.com')
        self.assertEqual(str(sub), 'user@example.com')

    def test_email_must_be_unique(self):
        NewsletterSubscription.objects.create(email='dup@example.com')
        with self.assertRaises(Exception):
            NewsletterSubscription.objects.create(email='dup@example.com')


class NewsletterAPITest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.url = reverse('newsletter_subscribe')

    def test_subscribe_creates_subscription(self):
        response = self.api.post(
            self.url, {'email': 'new@example.com', 'name': 'New User'}, format='json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            NewsletterSubscription.objects.filter(email='new@example.com', is_active=True).exists()
        )

    def test_duplicate_active_email_returns_400(self):
        NewsletterSubscription.objects.create(email='exists@example.com', is_active=True)
        response = self.api.post(self.url, {'email': 'exists@example.com'}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_reactivate_inactive_subscription(self):
        NewsletterSubscription.objects.create(email='old@example.com', is_active=False)
        response = self.api.post(self.url, {'email': 'old@example.com'}, format='json')
        self.assertEqual(response.status_code, 200)
        sub = NewsletterSubscription.objects.get(email='old@example.com')
        self.assertTrue(sub.is_active)

    def test_admin_list_requires_superuser(self):
        url = reverse('newslettersubscription-list')
        response = self.api.get(url)
        self.assertIn(response.status_code, (401, 403))

    def test_send_newsletter_test_mode(self):
        admin = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='pass'
        )
        self.api.force_authenticate(user=admin)
        url = reverse('newsletter_send')
        response = self.api.post(
            url,
            {'subject': 'Test', 'body': 'Hello world', 'test_mode': True},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['sent'], 1)
