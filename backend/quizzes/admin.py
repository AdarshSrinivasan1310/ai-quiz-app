"""
Django admin registration for quiz models.
"""
from django.contrib import admin
from .models import Quiz, Question, QuizAttempt, UserAnswer


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    readonly_fields = ['order']


class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    extra = 0
    readonly_fields = ['is_correct', 'answered_at']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['topic', 'user', 'difficulty', 'num_questions', 'is_generated', 'created_at']
    list_filter = ['difficulty', 'is_generated']
    search_fields = ['topic', 'user__username']
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'quiz', 'correct_answer', 'order']
    list_filter = ['correct_answer', 'quiz__difficulty']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'quiz', 'score', 'total_questions', 'is_completed', 'started_at']
    list_filter = ['is_completed']
    inlines = [UserAnswerInline]


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_answer', 'is_correct']
    list_filter = ['is_correct']
