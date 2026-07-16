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
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='password'
        )
        self.user = User.objects.create_user(
            username='client', email='client@example.com', password='password'
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.name = 'ClientCo'
        self.client_profile.save()
        self.approved = Testimonial.objects.create(
            name='Public',
            testimonial='Approved review',
            rating=5,
            is_approved=True,
        )
        self.pending = Testimonial.objects.create(
            name='Hidden',
            testimonial='Pending review',
            rating=4,
            is_approved=False,
        )

    def test_public_list_only_shows_approved(self):
        url = reverse('testimonial-list')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        ids = {item['id'] for item in results}
        self.assertIn(self.approved.id, ids)
        self.assertNotIn(self.pending.id, ids)

    def test_admin_list_shows_all(self):
        self.api.force_authenticate(user=self.admin)
        response = self.api.get(reverse('testimonial-list'))
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        ids = {item['id'] for item in results}
        self.assertIn(self.approved.id, ids)
        self.assertIn(self.pending.id, ids)

    def test_admin_can_approve_testimonial(self):
        self.api.force_authenticate(user=self.admin)
        url = reverse('testimonial-detail', args=[self.pending.id])
        response = self.api.patch(url, {'is_approved': True}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_approved'])
        self.pending.refresh_from_db()
        self.assertTrue(self.pending.is_approved)

    def test_public_cannot_set_approved_on_create(self):
        url = reverse('testimonial-list')
        response = self.api.post(
            url,
            {
                'name': 'Guest',
                'testimonial': 'Good service',
                'rating': 5,
                'is_approved': True,
                'is_featured': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data['is_approved'])
        self.assertFalse(response.data['is_featured'])
        t = Testimonial.objects.get(testimonial='Good service')
        self.assertFalse(t.is_approved)
        self.assertFalse(t.is_featured)

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

    def test_image_falls_back_to_client_profile_avatar(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        avatar = SimpleUploadedFile(
            'avatar.jpg', b'fake-image-bytes', content_type='image/jpeg'
        )
        self.user.avatar = avatar
        self.user.save()

        self.api.force_authenticate(user=self.user)
        response = self.api.post(
            reverse('testimonial-list'),
            {'name': 'Client', 'testimonial': 'Great team', 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get('image'))
        self.assertTrue(response.data.get('client_avatar_url'))

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
