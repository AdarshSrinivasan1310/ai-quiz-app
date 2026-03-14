'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { quizApi, AttemptResult, UserAnswer } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './results.module.css';

function ScoreCircle({ percentage }: { percentage: number }) {
  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className={styles.scoreCircle} style={{ borderColor: color }}>
      <span className={styles.scoreValue} style={{ color }}>{percentage}%</span>
      <span className={styles.scoreLabel}>Score</span>
    </div>
  );
}

function AnswerReview({ answer, index }: { answer: UserAnswer; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const options: { key: string; label: string }[] = [
    { key: 'A', label: answer.option_a },
    { key: 'B', label: answer.option_b },
    { key: 'C', label: answer.option_c },
    { key: 'D', label: answer.option_d },
  ];

  return (
    <div className={`${styles.answerCard} ${answer.is_correct ? styles.correct : styles.incorrect}`}>
      <div className={styles.answerHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.answerStatus}>
          <span className={answer.is_correct ? styles.checkIcon : styles.crossIcon}>
            {answer.is_correct ? '✓' : '✗'}
          </span>
          <span className={styles.questionNum}>Q{index + 1}</span>
        </div>
        <p className={styles.answerQuestion}>{answer.question_text}</p>
        <button className={styles.expandBtn}>{expanded ? '▲' : '▼'}</button>
      </div>

      {expanded && (
        <div className={styles.answerDetails}>
          <div className={styles.optionsList}>
            {options.map(opt => {
              const isCorrect = opt.key === answer.correct_answer;
              const isSelected = opt.key === answer.selected_answer;
              return (
                <div
                  key={opt.key}
                  className={`${styles.reviewOption} ${isCorrect ? styles.correctOption : ''} ${isSelected && !isCorrect ? styles.wrongOption : ''}`}
                >
                  <span className={styles.optionKey}>{opt.key}</span>
                  <span>{opt.label}</span>
                  {isCorrect && <span className={styles.correctTag}>✓ Correct</span>}
                  {isSelected && !isCorrect && <span className={styles.wrongTag}>Your answer</span>}
                </div>
              );
            })}
          </div>
          {answer.explanation && (
            <div className={styles.explanation}>
              <strong>💡 Explanation:</strong> {answer.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const quizId = parseInt(params.id as string);
  const attemptId = parseInt(params.attemptId as string);

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && attemptId) {
      quizApi.getResults(attemptId)
        .then(setResult)
        .catch(() => setError('Failed to load results.'))
        .finally(() => setLoading(false));
    }
  }, [user, attemptId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ padding: 40 }}>
        <div className="alert-error">{error || 'Results not found.'}</div>
        <Link href="/dashboard" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Dashboard
        </Link>
      </div>
    );
  }

  const { score, total_questions, percentage_score, quiz_topic, quiz_difficulty, answers, time_taken } = result;
  const grade = percentage_score >= 90 ? '🏆 Excellent!' : percentage_score >= 75 ? '🌟 Great Job!' : percentage_score >= 60 ? '👍 Good Effort!' : '📚 Keep Practicing!';

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        {/* Score card */}
        <div className={`glass-card ${styles.scoreCard} animate-fade-up`}>
          <h1 className={styles.gradeText}>{grade}</h1>
          <p className={styles.topicText}>{quiz_topic}</p>
          <span className={`badge-${quiz_difficulty}`}>{quiz_difficulty}</span>

          <ScoreCircle percentage={percentage_score} />

          <div className={styles.scoreStats}>
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatValue}>{score}/{total_questions}</span>
              <span className={styles.scoreStatLabel}>Correct</span>
            </div>
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatValue}>{total_questions - score}</span>
              <span className={styles.scoreStatLabel}>Wrong</span>
            </div>
            {time_taken && (
              <div className={styles.scoreStat}>
                <span className={styles.scoreStatValue}>
                  {Math.floor(time_taken / 60)}m {time_taken % 60}s
                </span>
                <span className={styles.scoreStatLabel}>Time</span>
              </div>
            )}
          </div>

          <div className={styles.scoreActions}>
            <Link href={`/quiz/${quizId}`} className="btn-primary" id="retake-quiz-btn">
              🔄 Retake Quiz
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Review */}
        <div className={styles.reviewSection}>
          <h2 className={styles.reviewTitle}>Answer Review</h2>
          <p className={styles.reviewSubtitle}>Click any question to see the detailed breakdown</p>
          <div className={styles.answerList}>
            {answers.map((ans, i) => (
              <AnswerReview key={ans.id} answer={ans} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
