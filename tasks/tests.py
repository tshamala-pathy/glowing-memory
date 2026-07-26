from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client, Project
from .models import WorkTask

User = get_user_model()


class WorkTaskTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin_work',
            email='admin-work@example.com',
            password='password',
        )
        self.pm = User.objects.create_user(
            username='pm_user',
            email='pm@example.com',
            password='password',
            is_staff=True,
        )
        self.dev = User.objects.create_user(
            username='dev_user',
            email='dev@example.com',
            password='password',
            is_staff=True,
        )
        self.client_user = User.objects.create_user(
            username='client_work',
            email='client-work@example.com',
            password='password',
        )
        self.client_profile = Client.objects.get(user=self.client_user)
        self.project = Project.objects.create(
            name='Work Task Project',
            client=self.client_profile,
            status='development',
        )
        self.api = APIClient()

    def test_create_with_priority_and_due_date(self):
        self.api.force_authenticate(user=self.admin)
        response = self.api.post(
            reverse('work-task-list'),
            {
                'project': self.project.id,
                'title': 'Design review',
                'description': 'Review wireframes',
                'priority': 'high',
                'due_date': '2026-08-01',
                'status': 'pending',
                'progress': 0,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['priority'], 'high')
        self.assertEqual(response.data['description'], 'Review wireframes')
        self.assertEqual(response.data['created_by_name'], self.admin.email)

    def test_create_with_multiple_assignees(self):
        self.api.force_authenticate(user=self.admin)
        response = self.api.post(
            reverse('work-task-list'),
            {
                'project': self.project.id,
                'title': 'Sprint delivery',
                'assignees': [self.pm.id, self.dev.id],
                'status': 'active',
                'progress': 10,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(set(response.data['assignees']), {self.pm.id, self.dev.id})
        self.assertEqual(len(response.data['assignee_names']), 2)
        task = WorkTask.objects.get(pk=response.data['id'])
        self.assertEqual(task.assignees.count(), 2)

    def test_staff_sees_tasks_assigned_to_them(self):
        task = WorkTask.objects.create(
            project=self.project,
            title='PM task',
            created_by=self.admin,
        )
        task.assignees.add(self.pm)
        self.api.force_authenticate(user=self.pm)
        response = self.api.get(reverse('work-task-list'))
        self.assertEqual(response.status_code, 200)
        data = response.data.get('results', response.data)
        titles = [item['title'] for item in data]
        self.assertIn('PM task', titles)

    def test_completed_status_sets_completed_at(self):
        task = WorkTask.objects.create(
            project=self.project,
            title='Deploy',
            created_by=self.admin,
            status='active',
            progress=50,
        )
        self.api.force_authenticate(user=self.admin)
        response = self.api.patch(
            reverse('work-task-detail', kwargs={'pk': task.pk}),
            {'status': 'completed'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        task.refresh_from_db()
        self.assertEqual(task.status, 'completed')
        self.assertIsNotNone(task.completed_at)
        self.assertEqual(task.progress, 100)

    def test_export_csv_requires_staff(self):
        self.api.force_authenticate(user=self.client_user)
        response = self.api.get(reverse('work-task-export-csv'))
        self.assertEqual(response.status_code, 403)

    def test_client_sees_own_project_work_tasks(self):
        WorkTask.objects.create(
            project=self.project,
            title='Client visible task',
            created_by=self.admin,
        )
        self.api.force_authenticate(user=self.client_user)
        response = self.api.get(reverse('work-task-list'))
        self.assertEqual(response.status_code, 200)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        titles = [item['title'] for item in data]
        self.assertIn('Client visible task', titles)
