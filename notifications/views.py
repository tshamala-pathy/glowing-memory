from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import InAppNotification
from .serializers import InAppNotificationSerializer


class InAppNotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """List, mark read, and delete notifications for the authenticated user."""

    serializer_class = InAppNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InAppNotification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'updated': updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_read_by_link(self, request):
        link = (request.data.get('link') or '').strip()
        if not link:
            return Response({'detail': 'link is required.'}, status=status.HTTP_400_BAD_REQUEST)
        from .services import mark_link_notifications_read
        limit = request.data.get('limit')
        if limit is not None:
            try:
                limit = int(limit)
            except (TypeError, ValueError):
                return Response({'detail': 'limit must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = mark_link_notifications_read(request.user, link, limit=limit)
        return Response({'updated': updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete selected notifications or all for the current user."""
        from .services import delete_notifications

        delete_all = bool(request.data.get('delete_all'))
        ids = request.data.get('ids')
        if delete_all:
            deleted = delete_notifications(request.user, delete_all=True)
            return Response({'deleted': deleted}, status=status.HTTP_200_OK)
        if not isinstance(ids, list) or not ids:
            return Response(
                {'detail': 'Provide ids (list) or delete_all: true.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted = delete_notifications(request.user, ids=ids)
        return Response({'deleted': deleted}, status=status.HTTP_200_OK)
