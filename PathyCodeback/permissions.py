"""
Custom REST framework permissions for strict access control.

- IsSuperuser: Only superusers can access (admin-only APIs).
  Use for quotes, invoices, contact list, newsletter list, user admin, etc.
"""
from rest_framework import permissions


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
