"""
Serializers for quiz-related models.
"""
from rest_framework import serializers
from .models import Quiz, Question, QuizAttempt, UserAnswer


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializes a Question for quiz-taking.
    NOTE: correct_answer is intentionally EXCLUDED here to prevent cheating.
    The frontend should never see the answer until after submission.
    """
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'option_a', 'option_b', 
                  'option_c', 'option_d', 'order']


class QuestionWithAnswerSerializer(serializers.ModelSerializer):
    """
    Serializes a Question WITH the correct answer.
    Used only for showing results after an attempt is completed.
    """
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'option_a', 'option_b', 
                  'option_c', 'option_d', 'correct_answer', 'explanation', 'order']


class QuizListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing quizzes (dashboard, history).
    Avoids loading all questions for performance.
    """
    question_count = serializers.IntegerField(read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'topic', 'num_questions', 'difficulty', 
                  'created_at', 'is_generated', 'question_count', 'attempt_count']


class QuizDetailSerializer(serializers.ModelSerializer):
    """
    Full quiz serializer including all questions.
    Questions are returned WITHOUT answers for quiz-taking.
    """
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'topic', 'num_questions', 'difficulty', 
                  'created_at', 'is_generated', 'questions', 'question_count']


class QuizCreateSerializer(serializers.Serializer):
    """
    Validates input for quiz creation. Not a ModelSerializer because
    creation involves calling the AI service, not just saving data.
    """
    topic = serializers.CharField(max_length=255, min_length=2)
    num_questions = serializers.IntegerField(min_value=5, max_value=20)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])

    def validate_topic(self, value):
        return value.strip()


class UserAnswerSerializer(serializers.ModelSerializer):
    """Serializes a single user answer record."""
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)
    explanation = serializers.CharField(source='question.explanation', read_only=True)
    option_a = serializers.CharField(source='question.option_a', read_only=True)
    option_b = serializers.CharField(source='question.option_b', read_only=True)
    option_c = serializers.CharField(source='question.option_c', read_only=True)
    option_d = serializers.CharField(source='question.option_d', read_only=True)

    class Meta:
        model = UserAnswer
        fields = ['id', 'question', 'question_text', 'selected_answer', 
                  'correct_answer', 'is_correct', 'explanation',
                  'option_a', 'option_b', 'option_c', 'option_d']


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializes a quiz attempt for listing in history."""
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)
    quiz_difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)
    percentage_score = serializers.FloatField(read_only=True)
    time_taken = serializers.IntegerField(read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_topic', 'quiz_difficulty', 'started_at', 
                  'completed_at', 'score', 'total_questions', 
                  'percentage_score', 'time_taken', 'is_completed']


class AttemptResultSerializer(serializers.ModelSerializer):
    """
    Full results serializer including all answers with correct answers revealed.
    Used only after an attempt is completed.
    """
    answers = UserAnswerSerializer(many=True, read_only=True)
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)
    quiz_difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)
    percentage_score = serializers.FloatField(read_only=True)
    time_taken = serializers.IntegerField(read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_topic', 'quiz_difficulty', 'started_at', 
                  'completed_at', 'score', 'total_questions', 
                  'percentage_score', 'time_taken', 'is_completed', 'answers']
