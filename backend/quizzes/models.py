"""
Quiz application models.

Database Design Decisions:
- Quiz: Each quiz belongs to a user, stores topic/config metadata
- Question: Each question belongs to one quiz, stores 4 options + correct answer
- QuizAttempt: Tracks each time a user starts taking a quiz (supports retakes)
- UserAnswer: Records individual answers within an attempt

This design separates quiz *definition* (Quiz + Question) from quiz 
*attempts* (QuizAttempt + UserAnswer), which allows retaking quizzes.
"""
from django.db import models
from django.contrib.auth.models import User


class Quiz(models.Model):
    """
    Represents a generated quiz. The 'blueprint' of the quiz.
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    topic = models.CharField(max_length=255)
    num_questions = models.IntegerField(default=10)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    # Track AI generation status
    is_generated = models.BooleanField(default=False)
    generation_error = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"'{self.topic}' quiz by {self.user.username}"

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def attempt_count(self):
        return self.attempts.count()


class Question(models.Model):
    """
    A single multiple-choice question belonging to a Quiz.
    
    Design: Store all 4 options as separate fields (option_a through option_d)
    rather than a JSON array. This is more explicit and easier to query/validate.
    The correct_answer stores the letter ('A', 'B', 'C', or 'D').
    """
    ANSWER_CHOICES = [
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    option_a = models.TextField()
    option_b = models.TextField()
    option_c = models.TextField()
    option_d = models.TextField()
    correct_answer = models.CharField(max_length=1, choices=ANSWER_CHOICES)
    explanation = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)  # Preserves question order from AI

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:60]}..."

    def get_option_text(self, letter):
        """Helper to get option text by letter."""
        mapping = {'A': self.option_a, 'B': self.option_b, 
                   'C': self.option_c, 'D': self.option_d}
        return mapping.get(letter, '')


class QuizAttempt(models.Model):
    """
    Represents one attempt at a quiz. Users can retake quizzes,
    which creates a new QuizAttempt each time.
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(default=0)  # Number of correct answers
    total_questions = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username}'s attempt on '{self.quiz.topic}'"

    @property
    def percentage_score(self):
        if self.total_questions == 0:
            return 0
        return round((self.score / self.total_questions) * 100, 1)

    @property
    def time_taken(self):
        if self.completed_at and self.started_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds())
        return None


class UserAnswer(models.Model):
    """
    Records a user's answer to a specific question within an attempt.
    This provides a detailed record for the results/review page.
    """
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='user_answers')
    selected_answer = models.CharField(max_length=1, null=True, blank=True)  # null = skipped
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['attempt', 'question']  # One answer per question per attempt

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.attempt.user.username} → Q{self.question.order}"
