from django.test import TestCase

# Create your tests here.
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Project


class ProjectModelTest(TestCase):
    def setUp(self):
        Project.objects.create(
            title='Test Project',
            description='This is a test project.',
            technologies='Django, React',
            tags='test,portfolio'
        )

    def test_project_creation(self):
        project = Project.objects.get(title='Test Project')
        self.assertEqual(project.description, 'This is a test project.')
        self.assertEqual(project.technologies, 'Django, React')


class ProjectAPITest(APITestCase):
    def setUp(self):
        self.project = Project.objects.create(
            title='API Test Project',
            description='Testing API',
            technologies='DRF',
            tags='api'
        )

    def test_list_projects(self):
        url = reverse('portfolio-list')  # projects app public list (not clients' project-list)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)  # paginated vs list
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'API Test Project')
