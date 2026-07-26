"""
Financial dashboard access — explicit grant required (superuser alone is not enough).

Grant access via Django Admin:
  User → Permissions → invoices | invoice | Can view financial dashboard
  or assign a group that includes that permission.

Optional bootstrap: set FINANCIAL_DASHBOARD_ALLOWED_EMAILS in .env (comma-separated).
"""
from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

PERMISSION_APP = 'invoices'
PERMISSION_CODENAME = 'view_financial_dashboard'


def _financial_dashboard_permission():
    """
    Load the Django permission row for financial dashboard access.

    Returns:
        Permission | None: The ``view_financial_dashboard`` permission on
        ``invoices.invoice``, or ``None`` if migrations have not created it yet.
    """
    try:
        content_type = ContentType.objects.get(app_label=PERMISSION_APP, model='invoice')
        return Permission.objects.get(content_type=content_type, codename=PERMISSION_CODENAME)
    except (ContentType.DoesNotExist, Permission.DoesNotExist):
        return None


def user_can_view_financial_dashboard(user):
    """
    Return whether *user* may open the Financial Dashboard and related exports.

    Requires staff or superuser status **and** an explicit grant via either:

    * ``FINANCIAL_DASHBOARD_ALLOWED_EMAILS`` (case-insensitive email match), or
    * Django permission ``invoices.view_financial_dashboard`` (direct or via group).

    Superuser status alone does **not** grant access.

    Args:
        user: Authenticated user instance, or ``None``/anonymous.

    Returns:
        bool: ``True`` when the user has an explicit financial dashboard grant.
    """
    if not user or not user.is_authenticated:
        return False
    if not user.is_staff and not user.is_superuser:
        return False

    allowed_emails = getattr(settings, 'FINANCIAL_DASHBOARD_ALLOWED_EMAILS', None) or []
    email = (user.email or '').strip().lower()
    if email and any(email == (entry or '').strip().lower() for entry in allowed_emails if entry):
        return True

    permission = _financial_dashboard_permission()
    if not permission:
        return False

    if user.user_permissions.filter(pk=permission.pk).exists():
        return True
    if user.groups.filter(permissions=permission).exists():
        return True
    return False
