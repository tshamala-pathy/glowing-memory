"""Tests for calendar event ownership and staff assignment."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import CalendarEvent


User = get_user_model()


class CalendarEventOwnerTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='cal_client',
            email='cal-client@example.com',
            password='password',
        )
        self.other_user = User.objects.create_user(
            username='cal_other',
            email='cal-other@example.com',
            password='password',
        )
        self.staff = User.objects.create_user(
            username='cal_staff',
            email='cal-staff@example.com',
            password='password',
            is_staff=True,
            is_superuser=True,
        )
        self.start = timezone.now() + timezone.timedelta(days=1)

    def test_client_creates_event_for_self(self):
        api = APIClient()
        api.force_authenticate(user=self.client_user)
        response = api.post(
            reverse('calendar-event-list'),
            {
                'title': 'Client deadline',
                'start_at': self.start.isoformat(),
                'event_type': 'deadline',
                'user': self.other_user.pk,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        event = CalendarEvent.objects.get(pk=response.data['id'])
        self.assertEqual(event.user_id, self.client_user.pk)

    def test_staff_can_assign_event_to_another_user(self):
        api = APIClient()
        api.force_authenticate(user=self.staff)
        response = api.post(
            reverse('calendar-event-list'),
            {
                'title': 'Assigned meeting',
                'start_at': self.start.isoformat(),
                'event_type': 'meeting',
                'user': self.client_user.pk,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        event = CalendarEvent.objects.get(pk=response.data['id'])
        self.assertEqual(event.user_id, self.client_user.pk)

    def test_client_only_lists_own_events(self):
        CalendarEvent.objects.create(
            user=self.client_user,
            title='Mine',
            start_at=self.start,
        )
        CalendarEvent.objects.create(
            user=self.other_user,
            title='Theirs',
            start_at=self.start,
        )
        api = APIClient()
        api.force_authenticate(user=self.client_user)
        response = api.get(reverse('calendar-event-list'))
        self.assertEqual(response.status_code, 200)
        titles = [item['title'] for item in response.data['results']]
        self.assertIn('Mine', titles)
        self.assertNotIn('Theirs', titles)
