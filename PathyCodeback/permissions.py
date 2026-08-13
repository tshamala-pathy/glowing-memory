"""
Custom REST framework permissions for strict access control.

- IsSuperuser: Only superusers can access (admin-only APIs).
  Use for quotes, invoices, contact list, newsletter list, user admin, etc.
- CanViewFinancialDashboard: Staff/superuser with an explicit financial grant only.
"""
from rest_framework import permissions

from PathyCodeback.financial_access import user_can_view_financial_dashboard


class IsSuperuser(permissions.BasePermission):
    """
    Allows access only to superusers.
    Used for admin-only routes: quotes management, invoices, contact messages,
    newsletter list, user CRUD, and other sensitive operations.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class CanViewFinancialDashboard(permissions.BasePermission):
    """
    Financial dashboard and exports — requires staff/superuser plus explicit grant.

    Superuser status alone does not grant access. Delegates to
    :func:`PathyCodeback.financial_access.user_can_view_financial_dashboard`.
    """

    message = 'You do not have permission to view the financial dashboard.'

    def has_permission(self, request, view):
        return user_can_view_financial_dashboard(request.user)
