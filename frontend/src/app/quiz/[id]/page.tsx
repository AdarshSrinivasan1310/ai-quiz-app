'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quizApi, Quiz, Question } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './quiz.module.css';

type AnswerMap = Record<number, string>; // question_id -> selected option

export default function QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const quizId = parseInt(params.id as string);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'loading' | 'overview' | 'taking' | 'submitted'>('loading');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && quizId) {
      loadQuiz();
    }
  }, [user, quizId]);

  const loadQuiz = async () => {
    try {
      const data = await quizApi.get(quizId);
      setQuiz(data);
      setPhase('overview');
    } catch {
      setError('Quiz not found or failed to load.');
      setPhase('overview');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    try {
      const result = await quizApi.startAttempt(quizId);
      setAttemptId(result.attempt_id);
      setCurrentIndex(0);
      setAnswers({});
      setPhase('taking');
    } catch {
      setError('Failed to start attempt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || !quiz) return;

    const answersArray = Object.entries(answers).map(([qId, ans]) => ({
      question_id: parseInt(qId),
      selected_answer: ans,
    }));

    setSubmitting(true);
    try {
      await quizApi.submitAttempt(attemptId, answersArray);
      setPhase('submitted');
      router.push(`/quiz/${quizId}/results/${attemptId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, quiz, answers, quizId, router]);

  if (authLoading || (loading && phase === 'loading')) {
    return (
      <div className={styles.loadingPage}>
        <Navbar />
        <div className={styles.loadingCenter}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (error && !quiz) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.container}>
          <div className="alert-error">{error}</div>
          <Link href="/dashboard" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Overview screen
  if (phase === 'overview' && quiz) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.container}>
          <div className={`glass-card ${styles.overviewCard} animate-fade-up`}>
            <Link href="/dashboard" className={styles.backLink}>← Dashboard</Link>
            <div className={styles.overviewHeader}>
              <div className={styles.overviewIcon}>📚</div>
              <h1 className={styles.overviewTitle}>{quiz.topic}</h1>
              <div className={styles.overviewMeta}>
                <span className={`badge-${quiz.difficulty}`}>{quiz.difficulty}</span>
                <span className={styles.metaItem}>📝 {quiz.question_count} questions</span>
              </div>
              <p className={styles.overviewDesc}>
                Test your knowledge of <strong>{quiz.topic}</strong>. Answer all questions, then review your results.
              </p>
            </div>
            <button id="start-quiz-btn" className="btn-primary" onClick={startQuiz} style={{ width: '100%', padding: '14px', fontSize: '1rem' }} disabled={loading}>
              {loading ? <span className="spinner" /> : '🚀 Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Taking quiz
  if (phase === 'taking' && quiz?.questions) {
    const questions = quiz.questions;
    const currentQ = questions[currentIndex];
    const totalAnswered = Object.keys(answers).length;
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const OPTIONS: { key: string; label: string }[] = [
      { key: 'A', label: currentQ.option_a },
      { key: 'B', label: currentQ.option_b },
      { key: 'C', label: currentQ.option_c },
      { key: 'D', label: currentQ.option_d },
    ];

    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.quizContainer}>
          {/* Progress bar */}
          <div className={styles.progressWrapper}>
            <div className={styles.progressInfo}>
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{totalAnswered} answered</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question */}
          <div className={`glass-card ${styles.questionCard} animate-fade-up`} key={currentQ.id}>
            <div className={styles.questionNumber}>Q{currentIndex + 1}</div>
            <p className={styles.questionText}>{currentQ.question_text}</p>

            <div className={styles.options}>
              {OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  id={`option-${opt.key}`}
                  className={`${styles.optionBtn} ${answers[currentQ.id] === opt.key ? styles.optionSelected : ''}`}
                  onClick={() => handleAnswer(currentQ.id, opt.key)}
                >
                  <span className={styles.optionLetter}>{opt.key}</span>
                  <span className={styles.optionText}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className={styles.navigation}>
            <button
              className="btn-secondary"
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              id="prev-question"
            >
              ← Previous
            </button>

            {/* Question dots */}
            <div className={styles.questionDots}>
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''} ${answers[q.id] ? styles.dotAnswered : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  title={`Question ${i + 1}`}
                />
              ))}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                className="btn-primary"
                onClick={() => setCurrentIndex(i => i + 1)}
                id="next-question"
              >
                Next →
              </button>
            ) : (
              <button
                className="btn-primary"
                id="submit-quiz-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner" />
                    Submitting...
                  </span>
                ) : `Submit Quiz (${totalAnswered}/${questions.length})`}
              </button>
            )}
          </div>

          {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}
        </div>
      </div>
    );
  }

  return null;
}
