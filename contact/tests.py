from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client
from .models import ContactMessage

User = get_user_model()


class ContactMessageModelTest(TestCase):
    def test_str(self):
        msg = ContactMessage.objects.create(
            name='Jane Doe',
            email='jane@example.com',
            subject='Hello',
            message='Test message body',
        )
        self.assertEqual(str(msg), 'Jane Doe - Hello')

    def test_default_status_is_new(self):
        msg = ContactMessage.objects.create(
            name='Jane', email='j@example.com', subject='Hi', message='Body'
        )
        self.assertEqual(msg.status, 'New')


class ContactMessageAPITest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user(
            username='client', email='client@example.com', password='password'
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.name = 'ClientCo'
        self.client_profile.save()

    def test_anonymous_can_submit_contact_form(self):
        url = reverse('contactmessage-list')
        response = self.api.post(
            url,
            {
                'name': 'Visitor',
                'email': 'visitor@example.com',
                'subject': 'Inquiry',
                'message': 'I need a quote',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_authenticated_user_links_to_client_profile(self):
        self.api.force_authenticate(user=self.user)
        url = reverse('contactmessage-list')
        response = self.api.post(
            url,
            {
                'name': 'Client',
                'email': 'client@example.com',
                'subject': 'Follow up',
                'message': 'Question about my project',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        msg = ContactMessage.objects.get()
        self.assertEqual(msg.client_id, self.client_profile.id)

    def test_list_requires_superuser(self):
        url = reverse('contactmessage-list')
        response = self.api.get(url)
        self.assertIn(response.status_code, (401, 403))

    def test_my_messages_returns_user_messages(self):
        ContactMessage.objects.create(
            name='Client',
            email='client@example.com',
            subject='Mine',
            message='My message',
            client=self.client_profile,
        )
        ContactMessage.objects.create(
            name='Other',
            email='other@example.com',
            subject='Theirs',
            message='Not mine',
        )
        self.api.force_authenticate(user=self.user)
        url = reverse('contactmessage-my-messages')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['subject'], 'Mine')
