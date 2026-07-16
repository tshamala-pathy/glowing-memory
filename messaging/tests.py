from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client, Project
from invoices.models import Invoice
from quotes.models import Quote
from .models import Message, MessageThread

User = get_user_model()


class MessagingTestCase(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='client', email='client@example.com', password='password'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='password'
        )
        self.client_profile = Client.objects.get(user=self.client_user)
        self.client_profile.name = 'ClientCo'
        self.client_profile.save()
        quote = Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@example.com',
            project_title='Chat Project',
            project_description='Desc',
            requirements_accepted=True,
            status='approved',
            estimated_amount=Decimal('500.00'),
        )
        invoice = Invoice.objects.create(quote=quote, created_by=self.client_user, status='paid')
        self.project = Project.objects.create(
            name='Chat Project',
            description='Desc',
            client=self.client_profile,
            quote=quote,
            invoice=invoice,
            status='development',
        )
        # Signal auto-creates one thread per project
        self.thread = MessageThread.objects.get(project=self.project)
        self.api = APIClient()

    def test_thread_model_str(self):
        self.assertIn('Chat Project', str(self.thread))

    def test_client_creates_thread_returns_existing(self):
        self.api.force_authenticate(user=self.client_user)
        url = reverse('messaging-thread-list')
        response = self.api.post(url, {'project': self.project.id}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(MessageThread.objects.filter(project=self.project).count(), 1)

    def test_client_can_send_message(self):
        self.api.force_authenticate(user=self.client_user)
        url = reverse('messaging-thread-send-message', args=[self.thread.id])
        response = self.api.post(url, {'content': 'Hello admin'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.filter(thread=self.thread).count(), 1)

    def test_other_user_cannot_access_thread(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.api.force_authenticate(user=other)
        url = reverse('messaging-thread-detail', args=[self.thread.id])
        response = self.api.get(url)
        self.assertEqual(response.status_code, 404)

    def test_admin_can_list_all_threads(self):
        self.api.force_authenticate(user=self.admin_user)
        url = reverse('messaging-thread-list')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_client_can_update_background_preset(self):
        self.api.force_authenticate(user=self.client_user)
        url = reverse('messaging-thread-detail', args=[self.thread.id])
        response = self.api.patch(url, {'background_preset': 'creative'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['background_preset'], 'creative')
        self.assertFalse(response.data['has_custom_background'])
        self.assertEqual(response.data['wallpaper_preset'], 'workspace')
        self.assertTrue(response.data['can_edit_background'])
        self.assertIn('unsplash.com', response.data['background_display_url'])

    def test_client_can_update_wallpaper_separately(self):
        self.api.force_authenticate(user=self.client_user)
        url = reverse('messaging-thread-detail', args=[self.thread.id])
        self.api.patch(url, {'background_preset': 'minimal'}, format='json')
        response = self.api.patch(url, {'wallpaper_preset': 'collaboration'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['background_preset'], 'minimal')
        self.assertEqual(response.data['wallpaper_preset'], 'collaboration')
        self.assertIn('unsplash.com', response.data['wallpaper_display_url'])

    def test_admin_can_update_thread_background(self):
        self.api.force_authenticate(user=self.admin_user)
        url = reverse('messaging-thread-detail', args=[self.thread.id])
        detail = self.api.get(url)
        self.assertTrue(detail.data['can_edit_background'])
        response = self.api.patch(url, {'background_preset': 'minimal'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['background_preset'], 'minimal')

    def test_staff_client_owner_can_update_background(self):
        self.client_user.is_staff = True
        self.client_user.save(update_fields=['is_staff'])
        self.api.force_authenticate(user=self.client_user)
        url = reverse('messaging-thread-detail', args=[self.thread.id])
        detail = self.api.get(url)
        self.assertTrue(detail.data['can_edit_background'])
        response = self.api.patch(url, {'background_preset': 'minimal'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['background_preset'], 'minimal')

    def test_viewing_thread_marks_one_message_notification_read(self):
        from notifications.models import InAppNotification
        from notifications.services import notify_user, mark_link_notifications_read

        notify_user(
            self.client_user,
            title='New message',
            message='Hello 1',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
            link=f'/messages/{self.thread.id}',
        )
        notify_user(
            self.client_user,
            title='New message',
            message='Hello 2',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
            link=f'/messages/{self.thread.id}',
        )
        other_n = notify_user(
            self.client_user,
            title='Quote reviewed',
            message='Unrelated',
            event_type=InAppNotification.EVENT_QUOTE_REVIEWED,
            link='/profile',
        )

        updated = mark_link_notifications_read(
            self.client_user,
            f'/messages/{self.thread.id}',
            event_types=[
                InAppNotification.EVENT_NEW_MESSAGE,
                InAppNotification.EVENT_THREAD_CREATED,
            ],
            limit=1,
        )
        self.assertEqual(updated, 1)

        other_n.refresh_from_db()
        read_count = InAppNotification.objects.filter(
            user=self.client_user,
            link=f'/messages/{self.thread.id}',
            is_read=True,
        ).count()
        self.assertEqual(read_count, 1)
        self.assertFalse(other_n.is_read)
