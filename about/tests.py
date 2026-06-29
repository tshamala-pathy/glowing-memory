from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import AboutUs, Solution, Value

User = get_user_model()


class AboutUsModelTest(TestCase):
    def test_str_returns_title(self):
        about = AboutUs.objects.create(title='Our Company')
        self.assertEqual(str(about), 'Our Company')

    def test_solution_str(self):
        about = AboutUs.objects.create()
        solution = Solution.objects.create(
            about_us=about, title='Web Apps', description='Custom web applications'
        )
        self.assertEqual(str(solution), 'Web Apps')

    def test_value_str(self):
        about = AboutUs.objects.create()
        value = Value.objects.create(
            about_us=about, title='Integrity', description='We do the right thing'
        )
        self.assertEqual(str(value), 'Integrity')


class AboutUsAPITest(TestCase):
    def setUp(self):
        self.about = AboutUs.objects.create(hero_title='PathyCode Story')
        self.api = APIClient()

    def test_public_about_us_endpoint(self):
        url = reverse('about_us')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['hero_title'], 'PathyCode Story')

    def test_public_about_creates_default_when_empty(self):
        AboutUs.objects.all().delete()
        url = reverse('about_us')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(AboutUs.objects.exists())

    def test_admin_crud_requires_superuser(self):
        user = User.objects.create_user(username='user', email='u@example.com', password='pass')
        self.api.force_authenticate(user=user)
        url = reverse('aboutus-admin-list')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 403)

    def test_superuser_can_list_about_us(self):
        admin = User.objects.create_superuser(username='admin', email='a@example.com', password='pass')
        self.api.force_authenticate(user=admin)
        url = reverse('aboutus-admin-list')
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['hero_title'], 'PathyCode Story')
