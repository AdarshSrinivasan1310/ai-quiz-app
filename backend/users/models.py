"""
User models - Using Django's built-in User model.

Design Decision: We leverage Django's robust built-in User model instead of
creating a custom one. This gives us password hashing, session management,
and admin integration for free. The built-in model has: id, username, email,
password, first_name, last_name, date_joined, is_active, etc.

If we needed extra fields (e.g., profile picture, bio), we'd add a
one-to-one Profile model here.
"""
from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """
    Optional extension of the built-in User model.
    Stores additional user metadata.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    total_quizzes_taken = models.IntegerField(default=0)
    total_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def average_score(self):
        if self.total_quizzes_taken == 0:
            return 0
        return round(self.total_score / self.total_quizzes_taken, 2)

    def __str__(self):
        return f"Profile of {self.user.username}"
