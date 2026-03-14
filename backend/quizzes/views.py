"""
Views for quiz management: creation (with AI), taking, submitting, and results.
"""
from django.utils import timezone
from django.db import transaction
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Quiz, Question, QuizAttempt, UserAnswer
from .serializers import (
    QuizListSerializer, QuizDetailSerializer, QuizCreateSerializer,
    QuizAttemptSerializer, AttemptResultSerializer
)
from .ai_service import generate_quiz_questions


# ─────────────────────────────────────────────────────────────────────────────
# Quiz Views
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    """
    POST /api/quizzes/generate/
    
    Creates a quiz, calls Gemini AI to generate questions, saves them to DB.
    Uses @transaction.atomic to ensure either all questions save or none do.
    
    Expected body: { topic, num_questions, difficulty }
    """
    serializer = QuizCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid input', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    topic = serializer.validated_data['topic']
    num_questions = serializer.validated_data['num_questions']
    difficulty = serializer.validated_data['difficulty']

    # Create the quiz record first (even before AI generation)
    quiz = Quiz.objects.create(
        user=request.user,
        topic=topic,
        num_questions=num_questions,
        difficulty=difficulty,
        is_generated=False,
    )

    try:
        # Call AI service to generate questions
        questions_data = generate_quiz_questions(topic, num_questions, difficulty)

        if not questions_data:
            raise ValueError("AI failed to generate any questions for this topic.")

        # Save questions in an atomic transaction
        with transaction.atomic():
            for i, q_data in enumerate(questions_data):
                Question.objects.create(
                    quiz=quiz,
                    question_text=q_data['question_text'],
                    option_a=q_data['option_a'],
                    option_b=q_data['option_b'],
                    option_c=q_data['option_c'],
                    option_d=q_data['option_d'],
                    correct_answer=q_data['correct_answer'],
                    explanation=q_data.get('explanation', ''),
                    order=i + 1,
                )
            quiz.is_generated = True
            quiz.generation_error = None
            quiz.save()

        return Response(
            {'message': 'Quiz generated successfully!', 'quiz': QuizDetailSerializer(quiz).data},
            status=status.HTTP_201_CREATED
        )

    except ValueError as e:
        # AI response parsing error
        quiz.generation_error = str(e)
        quiz.save()
        return Response(
            {'error': 'AI generation failed', 'message': str(e), 'quiz_id': quiz.id},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    except Exception as e:
        # Network errors, API key issues, etc.
        quiz.generation_error = str(e)
        quiz.save()
        return Response(
            {'error': 'Failed to generate quiz', 'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_quizzes(request):
    """
    GET /api/quizzes/
    Returns all quizzes created by the current user.
    """
    quizzes = Quiz.objects.filter(user=request.user, is_generated=True)
    serializer = QuizListSerializer(quizzes, many=True)
    return Response(serializer.data)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def quiz_detail(request, quiz_id):
    """
    GET  /api/quizzes/:id/  - Get quiz with questions (no answers)
    DELETE /api/quizzes/:id/ - Delete quiz
    """
    try:
        quiz = Quiz.objects.get(id=quiz_id, user=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = QuizDetailSerializer(quiz)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        quiz.delete()
        return Response({'message': 'Quiz deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# Attempt Views
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_attempt(request, quiz_id):
    """
    POST /api/quizzes/:id/attempt/
    Starts a new quiz attempt. Allows retakes (creates a new attempt record).
    """
    try:
        quiz = Quiz.objects.get(id=quiz_id, is_generated=True)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not ready.'}, status=status.HTTP_404_NOT_FOUND)

    attempt = QuizAttempt.objects.create(
        quiz=quiz,
        user=request.user,
        total_questions=quiz.question_count,
        is_completed=False,
    )

    return Response({
        'message': 'Attempt started.',
        'attempt_id': attempt.id,
        'quiz': QuizDetailSerializer(quiz).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_attempt(request, attempt_id):
    """
    POST /api/attempts/:id/submit/
    
    Submits all answers for an attempt and calculates the score.
    Expected body: { "answers": [{ "question_id": 1, "selected_answer": "A" }, ...] }
    
    Design: We accept all answers at once rather than one-by-one, simplifying
    the API and avoiding partial state issues. The frontend collects all answers
    then submits the entire attempt.
    """
    try:
        attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
    except QuizAttempt.DoesNotExist:
        return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

    if attempt.is_completed:
        return Response({'error': 'This attempt has already been submitted.'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    answers_data = request.data.get('answers', [])
    if not isinstance(answers_data, list):
        return Response({'error': 'answers must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    # Get all questions for this quiz
    questions = {q.id: q for q in attempt.quiz.questions.all()}
    
    correct_count = 0
    valid_choices = {'A', 'B', 'C', 'D'}

    with transaction.atomic():
        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected = str(answer_data.get('selected_answer', '')).upper()

            if question_id not in questions:
                continue  # Skip invalid question IDs

            question = questions[question_id]
            
            # Skip if selected_answer is invalid (treat as unanswered)
            if selected not in valid_choices:
                selected = None
                is_correct = False
            else:
                is_correct = (selected == question.correct_answer)
                if is_correct:
                    correct_count += 1

            # Use update_or_create to handle duplicate submissions gracefully
            UserAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    'selected_answer': selected,
                    'is_correct': is_correct,
                }
            )

        # Mark attempt as complete
        attempt.score = correct_count
        attempt.completed_at = timezone.now()
        attempt.is_completed = True
        attempt.save()

        # Update user's profile stats
        try:
            profile = request.user.profile
            profile.total_quizzes_taken += 1
            profile.total_score += attempt.percentage_score
            profile.save()
        except Exception:
            pass  # Non-critical, don't fail the submission

    return Response({
        'message': 'Quiz submitted successfully!',
        'attempt_id': attempt.id,
        'score': attempt.score,
        'total_questions': attempt.total_questions,
        'percentage_score': attempt.percentage_score,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attempt_results(request, attempt_id):
    """
    GET /api/attempts/:id/results/
    Returns full results with correct answers revealed.
    Only the user who made the attempt can view it.
    """
    try:
        attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
    except QuizAttempt.DoesNotExist:
        return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not attempt.is_completed:
        return Response({'error': 'This attempt is not yet completed.'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    serializer = AttemptResultSerializer(attempt)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attempt_history(request):
    """
    GET /api/attempts/history/
    Returns all completed attempts by the current user.
    """
    attempts = QuizAttempt.objects.filter(
        user=request.user, 
        is_completed=True
    ).select_related('quiz')

    serializer = QuizAttemptSerializer(attempts, many=True)
    return Response(serializer.data)
