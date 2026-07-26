"""
REST API for personal and admin-assigned calendar events.

Staff may create or update events on behalf of another user by passing
``user`` in the request body; clients always receive events scoped to
their own account.
"""
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import CalendarEvent
from .serializers import CalendarEventSerializer


def _resolve_event_owner(request):
    """
    Determine which user should own a calendar event on create/update.

    Staff and superusers may assign ``request.data['user']`` to another
    account; everyone else receives their own user instance.

    Args:
        request: DRF request with ``user`` and optional ``data['user']`` pk.

    Returns:
        User: Target owner for ``serializer.save(user=...)``.
    """
    user = request.user
    if user.is_staff or user.is_superuser:
        target_id = request.data.get('user')
        if target_id:
            target = get_user_model().objects.filter(pk=target_id).first()
            if target:
                return target
    return user


class CalendarEventViewSet(viewsets.ModelViewSet):
    """
    CRUD for calendar events scoped per user.

    * Clients see and manage only their own events.
    * Staff/superusers see all events and may assign events to a client via
      the ``user`` field on create/update.
    """

    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CalendarEvent.objects.select_related('project')
        if user.is_staff or user.is_superuser:
            return qs
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=_resolve_event_owner(self.request))

    def perform_update(self, serializer):
        user = self.request.user
        if (user.is_staff or user.is_superuser) and self.request.data.get('user'):
            serializer.save(user=_resolve_event_owner(self.request))
        else:
            serializer.save()
