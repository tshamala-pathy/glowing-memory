"""Tests for the local ``bootstrap_dev`` management command."""
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from users.management.commands.bootstrap_dev import (
    DEFAULT_EMAIL,
    DEFAULT_PASSWORD,
    DEFAULT_USERNAME,
)


User = get_user_model()


class BootstrapDevCommandTests(TestCase):
    def test_creates_superuser_on_empty_database(self):
        out = StringIO()
        call_command('bootstrap_dev', stdout=out)
        user = User.objects.get(username=DEFAULT_USERNAME)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertEqual(user.email, DEFAULT_EMAIL)
        self.assertTrue(user.check_password(DEFAULT_PASSWORD))
        self.assertIn(DEFAULT_USERNAME, out.getvalue())

    def test_skips_when_users_already_exist(self):
        User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='password',
        )
        call_command('bootstrap_dev', stdout=StringIO())
        self.assertFalse(User.objects.filter(username=DEFAULT_USERNAME).exists())
        self.assertEqual(User.objects.count(), 1)

    def test_force_creates_admin_when_other_users_exist(self):
        User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='password',
        )
        call_command('bootstrap_dev', '--force', stdout=StringIO())
        admin = User.objects.get(username=DEFAULT_USERNAME)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(User.objects.count(), 2)
