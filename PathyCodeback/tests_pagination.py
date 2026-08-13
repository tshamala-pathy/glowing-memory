"""Tests for StandardPagination (page_size query param for admin lists)."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from PathyCodeback.pagination import StandardPagination


User = get_user_model()


class StandardPaginationConfigTests(TestCase):
    def test_allows_client_page_size_up_to_max(self):
        pagination = StandardPagination()
        self.assertEqual(pagination.page_size, 20)
        self.assertEqual(pagination.page_size_query_param, 'page_size')
        self.assertEqual(pagination.max_page_size, 500)


class AdminUserPaginationTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin_pager',
            email='admin-pager@example.com',
            password='password',
        )
        for i in range(25):
            User.objects.create_user(
                username=f'client_{i}',
                email=f'client_{i}@example.com',
                password='password',
            )
        self.api = APIClient()
        self.api.force_authenticate(user=self.admin)

    def test_default_page_returns_twenty(self):
        response = self.api.get(reverse('user-admin-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 20)
        self.assertGreater(response.data['count'], 20)

    def test_page_size_returns_all_users(self):
        response = self.api.get(reverse('user-admin-list'), {'page_size': 500})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), response.data['count'])
        self.assertGreaterEqual(response.data['count'], 26)

    def test_anonymous_cannot_list_users(self):
        api = APIClient()
        response = api.get(reverse('user-admin-list'))
        self.assertEqual(response.status_code, 401)
