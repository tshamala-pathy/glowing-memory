import logging
from rest_framework import serializers
from .models import CustomUser, Notification, ActivityLog
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)

# ================================
# Serializer for User Registration
# ================================

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering a new user.
    Accepts first_name, last_name, email, and password.
    Automatically generates username from email.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        help_text="Password must meet Django's default validation rules."
    )
    first_name = serializers.CharField(required=True, write_only=True)
    last_name = serializers.CharField(required=True, write_only=True)

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'password')

    def validate_email(self, value):
        """
        Validate that email is unique.
        """
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        """
        Create a new user with the validated data and hashed password.
        Generates username from email if not provided.
        """
        # Generate username from email (take part before @)
        email = validated_data['email']
        base_username = email.split('@')[0]
        username = base_username
        
        # Ensure username is unique
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = CustomUser.objects.create(
            username=username,
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])  # Hash the password
        user.save()
        return user


# ================================
# Serializer for User Profile
# ================================

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving user profile information.
    """
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'bio', 'avatar', 'avatar_url', 'email_verified', 'is_superuser', 'is_staff', 'is_active', 'date_joined', 'last_login')
        read_only_fields = ('id', 'username', 'email', 'is_superuser', 'is_staff', 'date_joined', 'last_login', 'email_verified')

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for authenticated user profile update (first name, last name, bio, avatar).
    """
    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'bio', 'avatar')
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'bio': {'required': False, 'allow_blank': True},
            'avatar': {'required': False, 'allow_null': True},
        }


class ChangePasswordSerializer(serializers.Serializer):
    """Change password: requires current password, new password, and confirmation."""
    current_password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context.get('request').user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': ['New password and confirmation do not match.']})
        return attrs


class ChangeEmailSerializer(serializers.Serializer):
    """Change email: requires password and new email (validated for uniqueness)."""
    new_email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)

    def validate_new_email(self, value):
        user = self.context.get('request').user
        if value.lower() == user.email.lower():
            raise serializers.ValidationError('New email is the same as your current email.')
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_password(self, value):
        user = self.context.get('request').user
        if not user.check_password(value):
            raise serializers.ValidationError('Password is incorrect.')
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for admin CRUD operations on users.
    Allows editing more fields including is_active, is_staff, is_superuser.
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, validators=[validate_password])
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'bio', 'is_superuser', 'is_staff', 'is_active', 'date_joined', 'password')
        read_only_fields = ('id', 'date_joined')  # Only id and date_joined are read-only
    
    def validate_email(self, value):
        """Validate email uniqueness (excluding current user on update)."""
        user = self.instance
        if user and user.email == value:
            return value
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness (excluding current user on update)."""
        user = self.instance
        if user and user.username == value:
            return value
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create a new user with hashed password."""
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': ['Password is required when creating a user.']})
        
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update user, handling password separately."""
        password = validated_data.pop('password', None)
        
        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for in-app notifications.
    """
    class Meta:
        model = Notification
        fields = ['id', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """
    Serializer for activity log entries.
    """
    action_display = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ['id', 'action', 'action_display', 'timestamp', 'object_type', 'object_id', 'details']
        read_only_fields = ['id', 'timestamp']

    def get_action_display(self, obj):
        labels = {
            'login': 'Signed in',
            'logout': 'Signed out',
            'register': 'Account created',
            'profile_update': 'Profile updated',
            'password_change': 'Password changed',
            'email_change': 'Email changed',
            'quote_submitted': 'Quote request submitted',
            'quote_approved': 'Quote approved',
            'quote_declined': 'Quote declined',
            'quote_reviewed': 'Quote reviewed by admin',
            'project_created': 'Project created',
        }
        return labels.get(obj.action, obj.action.replace('_', ' ').title())


# ================================
# Custom Token Serializer for Email-based Login
# ================================

class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Custom token serializer that allows login with email instead of username.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, attrs):
        """
        Validate email and password, then generate JWT tokens.
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError(
                {'detail': 'Both email and password are required.'}
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {'email': ['No active account found with the given credentials.']}
            )

        # Registration stores the trimmed password (CharField trim_whitespace=True).
        # Use stripped value for check so login matches.
        password_to_check = password.strip() if password else ''

        _check_ok = user.check_password(password_to_check)
        _usable = getattr(user, 'has_usable_password', lambda: True)()

        if not _check_ok:
            if not _usable:
                raise serializers.ValidationError(
                    {'password': ['This account has no password set. Please use “Forgot password” to set one.']}
                )
            raise serializers.ValidationError(
                {'password': ['Invalid password.']}
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                {'email': ['User account is disabled.']}
            )
        
        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return {
            'email': email,
            'password': password,  # Not returned, just for validation
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


# ================================
# Password Recovery Serializers
# ================================

class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset request (forgot password).
    Sends email with password reset link.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Validate that email exists in the system."""
        if not User.objects.filter(email=value, is_active=True).exists():
            # Don't reveal if email exists for security
            # Still return success to prevent email enumeration
            return value
        return value

    def save(self):
        """
        Generate password reset token and send email.
        """
        email = self.validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Return success even if user doesn't exist (security best practice)
            return {'message': 'If an account exists with this email, a password reset link has been sent.'}
        
        # Generate token using Django's default token generator
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Build reset URL
        # In production, this should be your frontend URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"
        
        # Send email
        subject = 'Password Reset Request'
        message = f"""
Hello {user.first_name or user.email},

You requested a password reset for your account.

Click the following link to reset your password:
{reset_url}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
PathyCode Team
"""
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pathycodes.com'),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            logger.exception("Error sending password reset email")
        
        return {'message': 'If an account exists with this email, a password reset link has been sent.', 'user': user}


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    Validates token and sets new password.
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        help_text="New password must meet Django's validation rules."
    )

    def validate(self, attrs):
        """
        Validate token and user.
        """
        uid = attrs.get('uid')
        token = attrs.get('token')
        
        try:
            # Decode user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({
                'token': ['Invalid or expired reset token.']
            })
        
        # Validate token
        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({
                'token': ['Invalid or expired reset token.']
            })
        
        attrs['user'] = user
        return attrs

    def save(self):
        """
        Set new password for user.
        """
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return {'message': 'Password has been reset successfully.'}
