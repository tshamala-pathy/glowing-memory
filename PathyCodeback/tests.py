"""Tests for PathyCodeback root API views."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from blog.models import BlogPost
from projects.models import Project
from services.models import Service


class SearchAPITest(TestCase):
    def setUp(self):
        self.api = APIClient()
        Project.objects.create(
            title='E-commerce Platform',
            description='Online store with payments',
            technologies='Django, React',
        )
        Service.objects.create(name='Web Development', description='Custom websites')
        BlogPost.objects.create(title='Django Tips', body='Learn Django best practices')

    def test_search_requires_query(self):
        response = self.api.get(reverse('search'))
        self.assertEqual(response.status_code, 400)

    def test_search_returns_matches(self):
        response = self.api.get(reverse('search'), {'q': 'Django'})
        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data['total'], 0)
        types = {p['type'] for p in response.data['projects']}
        types |= {p['type'] for p in response.data['blog_posts']}
        types |= {p['type'] for p in response.data['services']}
        self.assertTrue(types)


class HealthCheckTest(TestCase):
    def test_health_endpoint_returns_ok(self):
        api = APIClient()
        response = api.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
