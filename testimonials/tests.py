from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client
from .models import Testimonial

User = get_user_model()


class TestimonialModelTest(TestCase):
    def test_str(self):
        t = Testimonial.objects.create(
            name='Alice', testimonial='Great work!', rating=5
        )
        self.assertEqual(str(t), 'Alice - 5 stars')

    def test_default_not_approved(self):
        t = Testimonial.objects.create(name='Bob', testimonial='Nice', rating=4)
        self.assertFalse(t.is_approved)


class TestimonialAPITest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user(
            username='client', email='client@example.com', password='password'
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.name = 'ClientCo'
        self.client_profile.save()
        Testimonial.objects.create(
            name='Public',
            testimonial='Approved review',
            rating=5,
            is_approved=True,
        )

    def test_public_list(self):
        url = reverse('testimonial-list')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        self.assertGreaterEqual(len(results), 1)

    def test_anonymous_can_create_testimonial(self):
        url = reverse('testimonial-list')
        response = self.api.post(
            url,
            {'name': 'Guest', 'testimonial': 'Good service', 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_authenticated_create_links_client(self):
        self.api.force_authenticate(user=self.user)
        url = reverse('testimonial-list')
        response = self.api.post(
            url,
            {'name': 'Client', 'testimonial': 'My review', 'rating': 4},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        t = Testimonial.objects.get(testimonial='My review')
        self.assertEqual(t.client_id, self.client_profile.id)

    def test_my_testimonials(self):
        Testimonial.objects.create(
            name='Client',
            testimonial='Mine',
            rating=5,
            client=self.client_profile,
        )
        self.api.force_authenticate(user=self.user)
        url = reverse('testimonial-my-testimonials')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
