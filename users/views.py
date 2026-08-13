from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from PathyCodeback.permissions import IsSuperuser
from .models import CustomUser, Notification, ActivityLog
from .activity import log_activity
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    ChangeEmailSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    NotificationSerializer,
    ActivityLogSerializer,
    AdminActivityLogSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from notifications.models import InAppNotification
from notifications.services import notify_user

# ================================
# User Authentication Views
# ================================

# Custom Token View for email-based login
class CustomTokenObtainPairView(generics.GenericAPIView):
    """
    Custom token view that accepts email instead of username for login.
    Returns JWT access and refresh tokens along with user data.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = request.data.get('email')
        user = CustomUser.objects.get(email=email)
        user_data = UserSerializer(user, context={'request': request}).data

        from clients.models import Client
        try:
            client_profile = user.client_profile
            client_data = {'id': client_profile.id, 'name': client_profile.name}
        except Client.DoesNotExist:
            name = (user.get_full_name() or user.email or user.username or 'Client').strip() or 'Client'
            client_profile = Client.objects.create(user=user, name=name)
            client_data = {'id': client_profile.id, 'name': client_profile.name}

        log_activity(user, 'login')
        return Response({
            'access': serializer.validated_data['access'],
            'refresh': serializer.validated_data['refresh'],
            'user': user_data,
            'client_profile': client_data,
        }, status=status.HTTP_200_OK)

# View for user registration
class RegisterView(generics.CreateAPIView):
    """
    API endpoint that allows new users to register.
    Returns JWT tokens upon successful registration.
    Accessible to anyone (no authentication required).
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Client profile is auto-created by clients.signals.create_client_profile_for_user.
        # Fallback: ensure Client exists if signal did not run.
        from clients.models import Client
        try:
            client_profile = user.client_profile
        except Client.DoesNotExist:
            name = (user.get_full_name() or user.email or user.username or 'Client').strip() or 'Client'
            client_profile = Client.objects.create(user=user, name=name)

        client_data = {'id': client_profile.id, 'name': client_profile.name}
        log_activity(user, 'register')
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
            'client_profile': client_data,
        }, status=status.HTTP_201_CREATED)

# View for aggregated profile data (user, client, quotes, invoices, projects, messages, testimonials)
class ProfileAggregateView(generics.GenericAPIView):
    """
    GET /api/profile/ — Aggregated data for the logged-in user's Profile page.

    Returns: user, client, quotes, invoices, projects, messages, testimonials.

    Permission: IsAuthenticated. Data is strictly scoped to the requesting user:
    - Quotes: only those where client=user's client_profile or client_email=user.email
    - Invoices: same rule (client or client_email match)
    - Projects: only those for user's client_profile
    - Messages: only those for user's client or email
    - Testimonials: only those for user's client_profile
    Clients never receive other clients' data. Admin (superuser) with no client_profile
    receives only data keyed by their user email (typically empty).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .profile_aggregate import build_profile_aggregate
        return Response(build_profile_aggregate(request.user, request, list_limit=500))


# View for retrieving the authenticated user's profile (lightweight, for AuthContext)
class ProfileView(generics.RetrieveAPIView):
    """
    GET /api/users/profile/ — Returns user data only (id, email, first_name, etc.).
    Used by AuthContext for auth state. For full profile data (client, quotes, etc.),
    use GET /api/profile/ instead.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Return the current authenticated user.
        """
        return self.request.user

# View for updating the authenticated user's profile (first name, last name, bio, avatar)
class ProfileUpdateView(generics.UpdateAPIView):
    """
    PATCH/PUT /api/users/profile/update/ — Update current user's profile.
    Allowed fields: first_name, last_name, bio, avatar. Only the authenticated user can update their own profile.
    """
    queryset = CustomUser.objects.all()
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['put', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_activity(request.user, 'profile_update')
        notify_user(
            request.user,
            title='Profile updated',
            message='Your profile information was saved successfully.',
            event_type=InAppNotification.EVENT_PROFILE_UPDATED,
            link='/profile',
        )
        user.refresh_from_db()
        return Response(UserSerializer(user, context={'request': request}).data)

# Change password (requires current password)
class ChangePasswordView(generics.GenericAPIView):
    """
    POST /api/users/change-password/ — Change authenticated user's password.
    Body: current_password, new_password, confirm_new_password.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        log_activity(user, 'password_change')
        notify_user(
            user,
            title='Password changed',
            message='Your account password was changed successfully.',
            event_type=InAppNotification.EVENT_PASSWORD_CHANGED,
            link='/profile',
        )
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


# Change email (requires password)
class ChangeEmailView(generics.GenericAPIView):
    """
    POST /api/users/change-email/ — Change authenticated user's email.
    Body: new_email, password. Validates password and new email uniqueness.
    """
    serializer_class = ChangeEmailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.email = serializer.validated_data['new_email']
        user.save(update_fields=['email'])
        log_activity(user, 'email_change')
        notify_user(
            user,
            title='Email changed',
            message=f'Your sign-in email is now {user.email}.',
            event_type=InAppNotification.EVENT_EMAIL_CHANGED,
            link='/profile',
        )
        return Response({'detail': 'Email updated successfully.', 'email': user.email}, status=status.HTTP_200_OK)


# ViewSet for listing users (superuser only)
class UserListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows superusers to view the list of all users.
    """
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsSuperuser]


# ViewSet for full CRUD operations on users (superuser only)
class UserAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows superusers to perform full CRUD operations on users.
    """
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsSuperuser]
    
    def get_serializer_class(self):
        """Use AdminUserSerializer for create/update operations."""
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import AdminUserSerializer
            return AdminUserSerializer
        return UserSerializer

    @action(detail=True, methods=['get'], url_path='360')
    def user_360(self, request, pk=None):
        """
        GET /api/users/admin/{id}/360/ — Full support view for a user (superuser only).

        Returns client profile, quotes, invoices, projects, messages, testimonials,
        payments, message threads, case studies, and recent activity in one payload.
        """
        from .profile_aggregate import build_profile_aggregate

        target = self.get_object()
        return Response(build_profile_aggregate(target, request, admin_context=True))


class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for listing and updating notifications for the current user.

    - GET /api/users/notifications/ — list current user's notifications
    - PATCH /api/users/notifications/{id}/ — mark a single notification as read
    - POST /api/users/notifications/mark_all_read/ — mark all as read
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Not used by frontend, but keep safe default
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        qs = self.get_queryset().filter(is_read=False)
        updated = qs.update(is_read=True)
        return Response({'updated': updated}, status=status.HTTP_200_OK)


# Logout — logs activity before client clears tokens
class LogoutView(generics.GenericAPIView):
    """
    POST /api/users/logout/ — Log logout activity.
    Call before clearing tokens on the frontend. Returns 200.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        log_activity(request.user, 'logout')
        return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)


# Activity log — user's own activity history
class ActivityLogView(generics.ListAPIView):
    """
    GET /api/users/activity-log/ — List current user's activity logs.
    Authenticated users only. Returns most recent first.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user).order_by('-timestamp')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = ActivityLogSerializer(qs[:100], many=True)  # Last 100 entries
        return Response(serializer.data)


class AdminActivityLogView(generics.ListAPIView):
    """GET /api/users/admin/activity-log/ — All activity logs (superuser)."""

    permission_classes = [IsSuperuser]
    serializer_class = AdminActivityLogSerializer

    def get_queryset(self):
        qs = ActivityLog.objects.select_related('user').order_by('-timestamp')
        action_filter = (self.request.query_params.get('action') or '').strip()
        user_id = self.request.query_params.get('user')
        if action_filter:
            qs = qs.filter(action=action_filter)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()[:500]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ================================
# Password Recovery Views
# ================================

class ForgotPasswordView(generics.GenericAPIView):
    """
    API endpoint for password reset request (forgot password).
    Sends email with password reset link.
    Accessible to anyone (no authentication required).
    """
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result.get('user') if isinstance(result, dict) else None
        if user:
            log_activity(user, 'password_reset_requested')
        return Response(
            {k: v for k, v in result.items() if k != 'user'},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(generics.GenericAPIView):
    """
    API endpoint for password reset confirmation.
    Validates token and sets new password.
    Accessible to anyone (no authentication required).
    """
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get('user')
        result = serializer.save()
        if user:
            log_activity(user, 'password_reset_completed')
        return Response(
            result,
            status=status.HTTP_200_OK
        )
