from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from clients.models import Client, Project, Task as ClientTask
from notifications.models import InAppNotification
from notifications.services import notify_user
from quotes.models import Quote
from tasks.models import WorkTask

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

    def test_mark_read_by_link(self):
        from notifications.models import InAppNotification

        InAppNotification.objects.filter(user=self.user).delete()
        InAppNotification.objects.create(
            user=self.user,
            title='Quote',
            message='New quote',
            event_type=InAppNotification.EVENT_QUOTE_SUBMITTED,
            link='/admin/quotes',
            is_read=False,
        )
        response = self.api.post('/api/notifications/mark_read_by_link/', {'link': '/admin/quotes'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['updated'], 1)
        self.assertEqual(
            InAppNotification.objects.filter(user=self.user, is_read=False).count(),
            0,
        )

    def test_mark_read_by_link_limit_one(self):
        from notifications.models import InAppNotification

        InAppNotification.objects.filter(user=self.user).delete()
        InAppNotification.objects.create(
            user=self.user,
            title='First',
            message='One',
            event_type=InAppNotification.EVENT_CONTACT_SUBMITTED,
            link='/admin/contact',
            is_read=False,
        )
        InAppNotification.objects.create(
            user=self.user,
            title='Second',
            message='Two',
            event_type=InAppNotification.EVENT_CONTACT_SUBMITTED,
            link='/admin/contact',
            is_read=False,
        )
        response = self.api.post(
            '/api/notifications/mark_read_by_link/',
            {'link': '/admin/contact', 'limit': 1},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['updated'], 1)
        self.assertEqual(
            InAppNotification.objects.filter(user=self.user, is_read=False).count(),
            1,
        )

    def test_delete_notification(self):
        notification = InAppNotification.objects.get(user=self.user)
        response = self.api.delete(f'/api/notifications/{notification.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(InAppNotification.objects.filter(pk=notification.id).exists())

    def test_cannot_delete_other_users_notification(self):
        other = User.objects.create_user(username='other', email='other@test.com', password='pass')
        n = InAppNotification.objects.create(
            user=other,
            title='Private',
            message='Not yours',
            event_type=InAppNotification.EVENT_NEW_MESSAGE,
        )
        response = self.api.delete(f'/api/notifications/{n.id}/')
        self.assertEqual(response.status_code, 404)
        self.assertTrue(InAppNotification.objects.filter(pk=n.id).exists())

    def test_bulk_delete_by_ids(self):
        InAppNotification.objects.filter(user=self.user).delete()
        first = InAppNotification.objects.create(
            user=self.user, title='One', message='A', event_type=InAppNotification.EVENT_QUOTE_SUBMITTED,
        )
        second = InAppNotification.objects.create(
            user=self.user, title='Two', message='B', event_type=InAppNotification.EVENT_NEW_MESSAGE,
        )
        third = InAppNotification.objects.create(
            user=self.user, title='Three', message='C', event_type=InAppNotification.EVENT_CONTACT_SUBMITTED,
        )
        response = self.api.post(
            '/api/notifications/bulk_delete/',
            {'ids': [first.id, second.id]},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['deleted'], 2)
        self.assertFalse(InAppNotification.objects.filter(pk=first.id).exists())
        self.assertFalse(InAppNotification.objects.filter(pk=second.id).exists())
        self.assertTrue(InAppNotification.objects.filter(pk=third.id).exists())

    def test_bulk_delete_all(self):
        InAppNotification.objects.filter(user=self.user).delete()
        InAppNotification.objects.create(
            user=self.user, title='One', message='A', event_type=InAppNotification.EVENT_QUOTE_SUBMITTED,
        )
        InAppNotification.objects.create(
            user=self.user, title='Two', message='B', event_type=InAppNotification.EVENT_NEW_MESSAGE,
        )
        response = self.api.post('/api/notifications/bulk_delete/', {'delete_all': True}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(InAppNotification.objects.filter(user=self.user).count(), 0)


class NotificationSignalTest(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='client', email='client@test.com', password='pass', first_name='Client'
        )
        self.staff = User.objects.create_user(
            username='admin', email='admin@test.com', password='pass', is_staff=True
        )
        self.client_profile = Client.objects.get(user=self.client_user)

    def test_quote_submitted_notifies_client_and_staff(self):
        Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@test.com',
            project_title='Website',
            project_description='Build a site',
        )
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_QUOTE_SUBMITTED
            ).exists()
        )
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.staff, event_type=InAppNotification.EVENT_QUOTE_SUBMITTED
            ).exists()
        )

    def test_quote_reviewed_only_on_status_change(self):
        quote = Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@test.com',
            project_title='Website',
            project_description='Build a site',
        )
        InAppNotification.objects.filter(user=self.client_user).delete()

        quote.status = 'reviewed'
        quote.save()
        self.assertEqual(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_QUOTE_REVIEWED
            ).count(),
            1,
        )

        quote.admin_response = 'Updated notes'
        quote.save()
        self.assertEqual(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_QUOTE_REVIEWED
            ).count(),
            1,
        )

    def test_quote_approved_notifies_client(self):
        quote = Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@test.com',
            project_title='Website',
            project_description='Build a site',
            status='reviewed',
        )
        InAppNotification.objects.all().delete()
        quote.status = 'approved'
        quote.save()
        n = InAppNotification.objects.get(user=self.client_user, event_type=InAppNotification.EVENT_QUOTE_APPROVED)
        self.assertIn('/payment/', n.link)

    def test_payment_completed_only_on_transition(self):
        quote = Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@test.com',
            project_title='Website',
            project_description='Build a site',
            status='approved',
        )
        from payments.models import Payment

        payment = Payment.objects.create(
            client=self.client_profile,
            user=self.client_user,
            quote=quote,
            amount=Decimal('100.00'),
            payment_status='pending',
        )
        InAppNotification.objects.all().delete()

        payment.payment_status = 'paid'
        payment.save()
        self.assertEqual(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_PAYMENT_COMPLETED
            ).count(),
            1,
        )
        payment.save()
        self.assertEqual(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_PAYMENT_COMPLETED
            ).count(),
            1,
        )

    def test_project_created_notifies_client(self):
        Project.objects.create(
            name='My Project',
            description='Desc',
            client=self.client_profile,
        )
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_PROJECT_CREATED
            ).exists()
        )

    def test_work_task_assigned_notifies_assignee(self):
        project = Project.objects.create(
            name='My Project',
            description='Desc',
            client=self.client_profile,
        )
        InAppNotification.objects.all().delete()
        WorkTask.objects.create(
            project=project,
            title='Design mockups',
            assigned_to=self.client_user,
            created_by=self.staff,
        )
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_TASK_ASSIGNED
            ).exists()
        )

    def test_client_task_created_notifies_client(self):
        project = Project.objects.create(
            name='My Project',
            description='Desc',
            client=self.client_profile,
        )
        InAppNotification.objects.all().delete()
        ClientTask.objects.create(project=project, title='Review deliverable')
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.client_user, event_type=InAppNotification.EVENT_TASK_UPDATED
            ).exists()
        )

    def test_client_message_notifies_staff(self):
        from messaging.models import Message, MessageThread

        project = Project.objects.create(
            name='Msg Project',
            description='Desc',
            client=self.client_profile,
        )
        thread = MessageThread.objects.get(project=project)
        InAppNotification.objects.all().delete()
        Message.objects.create(thread=thread, sender=self.client_user, content='Hello team')
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.staff, event_type=InAppNotification.EVENT_NEW_MESSAGE
            ).exists()
        )

    def test_contact_form_notifies_staff(self):
        from contact.models import ContactMessage

        InAppNotification.objects.all().delete()
        ContactMessage.objects.create(
            name='Jane',
            email='jane@example.com',
            subject='Need help',
            message='Please call me back.',
        )
        self.assertTrue(
            InAppNotification.objects.filter(
                user=self.staff, event_type=InAppNotification.EVENT_CONTACT_SUBMITTED
            ).exists()
        )
