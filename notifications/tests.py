from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import InAppNotification
from .services import notify_user

User = get_user_model()


class NotificationServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u', email='u@test.com', password='pass')

    def test_notify_user_creates_notification(self):
        n = notify_user(
            self.user,
            title='Test',
            message='Hello',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
            link='/profile',
        )
        self.assertEqual(InAppNotification.objects.count(), 1)
        self.assertEqual(n.title, 'Test')


class NotificationAPITest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u2', email='u2@test.com', password='pass')
        self.api = APIClient()
        self.api.force_authenticate(user=self.user)
        InAppNotification.objects.create(
            user=self.user,
            title='Hi',
            message='Test msg',
            event_type=InAppNotification.EVENT_QUOTE_REVIEWED,
        )

    def test_list_notifications(self):
        response = self.api.get('/api/notifications/')
        self.assertEqual(response.status_code, 200)

    def test_unread_count(self):
        response = self.api.get('/api/notifications/unread_count/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
