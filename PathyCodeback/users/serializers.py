from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password

# ================================
# Serializer for User Registration
# ================================

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering a new user.
    Includes password confirmation and validation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        help_text="Password must meet Django's default validation rules."
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Enter the password again for confirmation."
    )

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        """
        Ensure both passwords match.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def create(self, validated_data):
        """
        Create a new user with the validated data and hashed password.
        """
        user = CustomUser.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
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
        fields = ('id', 'username', 'email', 'bio')
    read_only_fields = ('id', 'username', 'email')  # Make these fields read-only