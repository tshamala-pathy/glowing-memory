from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from PathyCodeback.permissions import IsSuperuser
from .models import CustomUser, Notification
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
)
from rest_framework_simplejwt.tokens import RefreshToken

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
        user_data = UserSerializer(user).data

        from clients.models import Client
        try:
            client_profile = user.client_profile
            client_data = {'id': client_profile.id, 'name': client_profile.name}
        except Client.DoesNotExist:
            name = (user.get_full_name() or user.email or user.username or 'Client').strip() or 'Client'
            client_profile = Client.objects.create(user=user, name=name)
            client_data = {'id': client_profile.id, 'name': client_profile.name}

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
        
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
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
        from clients.models import Client
        from clients.serializers import ClientSerializer, ProjectSerializer
        from contact.models import ContactMessage
        from contact.serializers import ContactMessageSerializer
        from quotes.models import Quote
        from quotes.serializers import ProfileQuoteSerializer
        from invoices.models import Invoice
        from invoices.serializers import InvoiceSerializer
        from testimonials.models import Testimonial
        from testimonials.serializers import TestimonialSerializer
        from django.db.models import Q

        user = request.user
        user_data = UserSerializer(user).data

        profile = getattr(user, 'client_profile', None)
        client_data = None
        if profile:
            client_data = ClientSerializer(profile, context={'request': request}).data

        # Messages (by client or email)
        if profile:
            messages_qs = ContactMessage.objects.filter(client=profile).order_by('-created_at')[:20]
        else:
            messages_qs = ContactMessage.objects.filter(
                email__iexact=user.email
            ).order_by('-created_at')[:20]
        messages_data = ContactMessageSerializer(messages_qs, many=True).data

        # Quotes: only this user's quotes (client FK or client_email). No cross-client access.
        quotes_qs = Quote.objects.filter(
            Q(client=profile) | Q(client__isnull=True, client_email__iexact=user.email)
        ).order_by('-created_at') if profile else Quote.objects.filter(
            client_email__iexact=user.email
        ).order_by('-created_at')
        quotes_data = ProfileQuoteSerializer(quotes_qs, many=True, context={'request': request}).data

        # Invoices: only this user's invoices (client FK or client_email). No cross-client access.
        invoices_qs = Invoice.objects.filter(
            Q(client=profile) | Q(client__isnull=True, client_email__iexact=user.email)
        ).order_by('-created_at') if profile else Invoice.objects.filter(
            client_email__iexact=user.email
        ).order_by('-created_at')
        invoices_data = InvoiceSerializer(invoices_qs, many=True, context={'request': request}).data

        # Projects (by client)
        projects_data = []
        if profile:
            from clients.models import Project
            projects_qs = Project.objects.filter(client=profile).select_related(
                'client', 'quote', 'invoice'
            ).order_by('-created_at')
            projects_data = ProjectSerializer(projects_qs, many=True, context={'request': request}).data

        # Testimonials (by client)
        testimonials_data = []
        if profile:
            testimonials_qs = Testimonial.objects.filter(client=profile).order_by('-created_at')
            testimonials_data = TestimonialSerializer(
                testimonials_qs, many=True, context={'request': request}
            ).data

        return Response({
            'user': user_data,
            'client': client_data,
            'quotes': quotes_data,
            'invoices': invoices_data,
            'projects': projects_data,
            'messages': messages_data,
            'testimonials': testimonials_data,
        })


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
    http_method_names = ['put', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(UserSerializer(instance, context={'request': request}).data)

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
        
        return Response(
            result,
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
        result = serializer.save()
        
        return Response(
            result,
            status=status.HTTP_200_OK
        )
