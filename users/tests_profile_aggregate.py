from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase

from clients.models import Client
from contact.models import ContactMessage
from payments.models import Payment
from quotes.models import Quote

from .profile_aggregate import build_profile_aggregate

User = get_user_model()


class ProfileAggregateStatsTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.request = self.factory.get('/api/profile/')
        self.request.user = User.objects.create_superuser(
            username='adminagg',
            email='adminagg@example.com',
            password='password',
        )
        self.user = User.objects.create_user(
            username='aggregateuser',
            email='aggregate@example.com',
            password='password',
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.name = 'Aggregate Co'
        self.client_profile.save()
        self.quote = Quote.objects.create(
            client=self.client_profile,
            client_email=self.user.email,
            project_title='Test project',
            status='approved',
            estimated_amount=Decimal('500.00'),
        )

    def test_messages_count_not_capped_by_list_limit(self):
        list_limit = 5
        for i in range(list_limit + 3):
            ContactMessage.objects.create(
                name=self.user.get_full_name() or self.user.username,
                email=self.user.email,
                subject=f'Message {i}',
                message='Body',
                client=self.client_profile,
            )

        payload = build_profile_aggregate(
            self.user, self.request, admin_context=True, list_limit=list_limit
        )

        self.assertEqual(payload['stats']['total_messages'], list_limit + 3)
        self.assertEqual(len(payload['messages']), list_limit)

    def test_payments_count_matches_payments_list_scope(self):
        Payment.objects.create(
            client=self.client_profile,
            user=self.user,
            quote=self.quote,
            amount=Decimal('100.00'),
            payment_status=Payment.STATUS_PAID,
        )
        Payment.objects.create(
            client=self.client_profile,
            user=self.user,
            quote=self.quote,
            amount=Decimal('200.00'),
            payment_status=Payment.STATUS_PENDING,
        )

        payload = build_profile_aggregate(
            self.user, self.request, admin_context=True, list_limit=50
        )

        self.assertEqual(payload['stats']['total_payments'], 2)
        self.assertEqual(len(payload['payments']), 2)
        statuses = {p['payment_status'] for p in payload['payments']}
        self.assertEqual(statuses, {'paid', 'pending'})
