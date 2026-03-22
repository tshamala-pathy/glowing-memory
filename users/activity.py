"""
Activity logging utility.
Call log_activity() from views/signals to record user actions.
"""
from .models import ActivityLog


def log_activity(user, action, object_type=None, object_id=None, details=None):
    """
    Record a user action in the activity log.

    Args:
        user: User instance (required)
        action: str - e.g. 'login', 'logout', 'register', 'profile_update',
                'password_change', 'email_change', 'password_reset_requested',
                'password_reset_completed', 'quote_submitted', 'quote_reviewed',
                'quote_approved', 'quote_declined', 'invoice_created', 'invoice_marked_paid',
                'payment_started', 'payment_completed', 'project_created', 'project_updated',
                'project_completed', 'thread_created', 'message_sent', 'client_created',
                'client_updated', 'contact_submitted', 'testimonial_submitted'
        object_type: Optional - 'quote', 'project', 'invoice', etc.
        object_id: Optional - PK of related object
        details: Optional - JSON string or plain text for extra context
    """
    if not user or not user.pk:
        return
    ActivityLog.objects.create(
        user=user,
        action=action,
        object_type=object_type or '',
        object_id=object_id,
        details=details or '',
    )
