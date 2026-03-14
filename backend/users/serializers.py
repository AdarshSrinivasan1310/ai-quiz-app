"""
Serializers for user authentication and registration.
"""
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration with password confirmation.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        # create_user handles password hashing automatically
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning user data (safe - no password).
    """
    average_score = serializers.SerializerMethodField()
    total_quizzes_taken = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'date_joined', 'average_score', 'total_quizzes_taken']

    def get_average_score(self, obj):
        try:
            return obj.profile.average_score()
        except UserProfile.DoesNotExist:
            return 0

    def get_total_quizzes_taken(self, obj):
        try:
            return obj.profile.total_quizzes_taken
        except UserProfile.DoesNotExist:
            return 0
