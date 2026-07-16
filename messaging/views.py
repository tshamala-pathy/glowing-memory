"""
Internal messaging API. Only participants can access:
- Client: threads where thread.client == request.user.client_profile
- Admin: all threads
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from django.http import FileResponse

from .models import MessageThread, Message
from .serializers import (
    MessageThreadSerializer,
    MessageThreadDetailSerializer,
    MessageThreadBackgroundSerializer,
    MessageSerializer,
)
from users.activity import log_activity
from .backgrounds import user_can_edit_thread_background


def _user_can_access_thread(user, thread):
    """True if user is participant: project's client or staff/superuser."""
    if not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    profile = getattr(user, 'client_profile', None)
    return profile and thread.client_id == profile.id


def _parse_truthy(value):
    return value in (True, 'true', '1', 1)


class MessageThreadViewSet(viewsets.ModelViewSet):
    """
    thread_list: GET /api/messaging/threads/ (only threads user can access)
    thread_detail: GET /api/messaging/threads/<id>/ (with messages)
    send_message: POST /api/messaging/threads/<id>/send_message/ (content, optional file)
    create: POST /api/messaging/threads/ (project required; creates thread for project if allowed)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MessageThreadSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = MessageThread.objects.all().select_related('project', 'client')
        # Prefetch messages (and senders) for thread detail so admin-added messages display on frontend
        if self.action == 'retrieve':
            qs = qs.prefetch_related('messages__sender')
        if self.request.user.is_staff or self.request.user.is_superuser:
            return qs
        profile = getattr(self.request.user, 'client_profile', None)
        if profile:
            return qs.filter(client=profile)
        return qs.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MessageThreadDetailSerializer
        return MessageThreadSerializer

    def create(self, request, *args, **kwargs):
        """Create a thread for a project (if user has access and no thread exists)."""
        project_id = request.data.get('project')
        if not project_id:
            return Response({'project': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        from clients.models import Project
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({'project': ['Project not found.']}, status=status.HTTP_404_NOT_FOUND)
        if MessageThread.objects.filter(project=project).exists():
            thread = MessageThread.objects.get(project=project)
            serializer = self.get_serializer(thread)
            return Response(serializer.data, status=status.HTTP_200_OK)
        if not project.client_id:
            return Response({'project': ['Project has no client.']}, status=status.HTTP_400_BAD_REQUEST)
        if not (request.user.is_staff or request.user.is_superuser) and getattr(request.user, 'client_profile', None) != project.client:
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        thread = MessageThread.objects.create(project=project, client=project.client)
        log_activity(request.user, 'thread_created', object_type='thread', object_id=thread.id, details=project.name)
        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """Thread detail with full message history (timeline)."""
        instance = self.get_object()
        if not _user_can_access_thread(request.user, instance):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance, context=self.get_serializer_context())
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Update sidebar cover and/or chat wallpaper (independent fields)."""
        thread = self.get_object()
        if not _user_can_access_thread(request.user, thread):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not user_can_edit_thread_background(request.user, thread):
            return Response(
                {'detail': 'You cannot update the chat appearance for this thread.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        if _parse_truthy(request.data.get('clear_background_image')):
            data['clear_background_image'] = True
        if _parse_truthy(request.data.get('clear_wallpaper_image')):
            data['clear_wallpaper_image'] = True

        serializer = MessageThreadBackgroundSerializer(
            thread, data=data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_activity(
            request.user,
            'thread_background_updated',
            object_type='thread',
            object_id=thread.id,
            details=thread.project.name if thread.project else '',
        )
        out = MessageThreadDetailSerializer(thread, context={'request': request})
        return Response(out.data)

    @action(detail=True, methods=['post'], url_path='send_message')
    def send_message(self, request, pk=None):
        """Send a message in this thread. Body: content (required), attachment (optional file)."""
        thread = self.get_object()
        if not _user_can_access_thread(request.user, thread):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        content = (request.data.get('content') or '').strip()
        if not content and not request.FILES.get('attachment'):
            return Response(
                {'content': ['Message must have content or an attachment.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = {'thread': thread.id, 'content': content or '(attachment)'}
        if request.FILES.get('attachment'):
            data['attachment'] = request.FILES['attachment']
        serializer = MessageSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
        thread.updated_at = msg.created_at
        thread.save(update_fields=['updated_at'])
        log_activity(request.user, 'message_sent', object_type='thread', object_id=thread.id, details=thread.project.name if thread.project else '')
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only messages; used for attachment download (participant-only)."""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Message.objects.all().select_related('thread', 'thread__project', 'thread__client', 'sender')
        if self.request.user.is_staff or self.request.user.is_superuser:
            return qs
        profile = getattr(self.request.user, 'client_profile', None)
        if profile:
            return qs.filter(thread__client=profile)
        return qs.none()

    @action(detail=True, methods=['get'], url_path='download_attachment')
    def download_attachment(self, request, pk=None):
        message = self.get_object()
        if not _user_can_access_thread(request.user, message.thread):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not message.attachment:
            return Response({'detail': 'No attachment.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            f = message.attachment.open('rb')
            response = FileResponse(f, content_type='application/octet-stream')
            name = message.attachment.name.split('/')[-1]
            response['Content-Disposition'] = f'attachment; filename="{name}"'
            return response
        except OSError:
            return Response({'detail': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
