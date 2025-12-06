from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

User = get_user_model()

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
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'bio', 'is_superuser', 'is_staff')
        read_only_fields = ('id', 'username', 'email', 'is_superuser', 'is_staff')  # Make these fields read-only


# ================================
# Custom Token Serializer for Email-based Login
# ================================

class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Custom token serializer that allows login with email instead of username.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
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
        
        if not user.check_password(password):
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