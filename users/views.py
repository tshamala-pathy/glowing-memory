from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from PathyCodeback.permissions import IsSuperuser
from .models import CustomUser
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer
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
        
        # Get user data and client profile (for portal: quotes, invoices, projects)
        email = request.data.get('email')
        user = CustomUser.objects.get(email=email)
        user_data = UserSerializer(user).data

        from clients.models import Client
        try:
            client_profile = user.client_profile
            client_data = {'id': client_profile.id, 'name': client_profile.name}
        except Client.DoesNotExist:
            # Auto-create Client for legacy users or if signal did not run
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
    Single endpoint /api/profile/ that returns all data needed for the Profile page:
    user, client, quotes, invoices, projects, messages, testimonials.
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from clients.models import Client
        from clients.serializers import ClientSerializer, ProjectSerializer
        from contact.models import ContactMessage
        from contact.serializers import ContactMessageSerializer
        from quotes.models import Quote
        from quotes.serializers import QuoteSerializer
        from invoices.models import Invoice
        from invoices.serializers import InvoiceSerializer
        from testimonials.models import Testimonial
        from testimonials.serializers import TestimonialSerializer
        from django.db.models import Q

        user = request.user
        user_data = UserSerializer(user).data

        # Client
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

        # Quotes (by client or email)
        quotes_qs = Quote.objects.filter(
            Q(client=profile) | Q(client__isnull=True, client_email__iexact=user.email)
        ).order_by('-created_at') if profile else Quote.objects.filter(
            client_email__iexact=user.email
        ).order_by('-created_at')
        quotes_data = QuoteSerializer(quotes_qs, many=True, context={'request': request}).data

        # Invoices (by client or email)
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

# View for updating the authenticated user's profile
class ProfileUpdateView(generics.UpdateAPIView):
    """
    API endpoint to update the profile of the currently authenticated user.
    Only accessible to logged-in users.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Return the current authenticated user.
        """
        return self.request.user

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
