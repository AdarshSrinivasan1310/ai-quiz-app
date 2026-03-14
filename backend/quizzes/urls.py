"""
URL patterns for the quizzes app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Quiz endpoints
    path('quizzes/generate/', views.generate_quiz, name='quiz-generate'),
    path('quizzes/', views.list_quizzes, name='quiz-list'),
    path('quizzes/<int:quiz_id>/', views.quiz_detail, name='quiz-detail'),
    path('quizzes/<int:quiz_id>/attempt/', views.start_attempt, name='quiz-attempt-start'),

    # Attempt endpoints
    path('attempts/<int:attempt_id>/submit/', views.submit_attempt, name='attempt-submit'),
    path('attempts/<int:attempt_id>/results/', views.attempt_results, name='attempt-results'),
    path('attempts/history/', views.attempt_history, name='attempt-history'),
]
