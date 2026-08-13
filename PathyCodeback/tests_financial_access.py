"""Tests for explicit financial-dashboard grants."""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase, override_settings

from PathyCodeback.financial_access import user_can_view_financial_dashboard
from PathyCodeback.permissions import CanViewFinancialDashboard


User = get_user_model()


def _dashboard_permission():
    content_type = ContentType.objects.get(app_label='invoices', model='invoice')
    return Permission.objects.get(content_type=content_type, codename='view_financial_dashboard')


class FinancialAccessTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='plain_client',
            email='plain@example.com',
            password='password',
        )
        self.superuser = User.objects.create_superuser(
            username='super_no_grant',
            email='super@example.com',
            password='password',
        )
        self.staff = User.objects.create_user(
            username='staff_user',
            email='staff@example.com',
            password='password',
            is_staff=True,
        )

    def test_anonymous_and_client_denied(self):
        self.assertFalse(user_can_view_financial_dashboard(None))
        self.assertFalse(user_can_view_financial_dashboard(self.client_user))

    def test_superuser_alone_is_not_enough(self):
        self.assertFalse(user_can_view_financial_dashboard(self.superuser))

    def test_permission_grant_allows_staff(self):
        self.staff.user_permissions.add(_dashboard_permission())
        self.assertTrue(user_can_view_financial_dashboard(self.staff))

    def test_group_permission_allows_superuser(self):
        group = Group.objects.create(name='Finance')
        group.permissions.add(_dashboard_permission())
        self.superuser.groups.add(group)
        self.assertTrue(user_can_view_financial_dashboard(self.superuser))

    @override_settings(FINANCIAL_DASHBOARD_ALLOWED_EMAILS=['STAFF@example.com'])
    def test_allowed_email_list_is_case_insensitive(self):
        self.assertTrue(user_can_view_financial_dashboard(self.staff))

    def test_drf_permission_matches_helper(self):
        class FakeRequest:
            def __init__(self, user):
                self.user = user

        perm = CanViewFinancialDashboard()
        self.assertFalse(perm.has_permission(FakeRequest(self.superuser), None))
        self.staff.user_permissions.add(_dashboard_permission())
        self.assertTrue(perm.has_permission(FakeRequest(self.staff), None))
