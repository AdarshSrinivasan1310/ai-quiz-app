'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { quizApi, QuizAttempt } from '@/lib/api';
import Navbar from '@/components/Navbar';
import styles from './history.module.css';

function ScoreBadge({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'easy' : pct >= 60 ? 'medium' : 'hard';
  return <span className={`badge-${color}`}>{pct}%</span>;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      quizApi.history()
        .then(setAttempts)
        .catch(() => setError('Failed to load history.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading) return null;
  if (!user) return null;

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage_score, 0) / attempts.length)
    : 0;

  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map(a => a.percentage_score))
    : 0;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quiz History</h1>
            <p className={styles.subtitle}>All your past quiz attempts</p>
          </div>
          <Link href="/quiz/create" className="btn-primary">+ New Quiz</Link>
        </div>

        {attempts.length > 0 && (
          <div className={styles.statsRow}>
            <div className={`glass-card ${styles.miniStat}`}>
              <div className={styles.miniStatValue}>{attempts.length}</div>
              <div className={styles.miniStatLabel}>Total Attempts</div>
            </div>
            <div className={`glass-card ${styles.miniStat}`}>
              <div className={styles.miniStatValue}>{avgScore}%</div>
              <div className={styles.miniStatLabel}>Average Score</div>
            </div>
            <div className={`glass-card ${styles.miniStat}`}>
              <div className={styles.miniStatValue}>{bestScore}%</div>
              <div className={styles.miniStatLabel}>Best Score</div>
            </div>
          </div>
        )}

        {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : attempts.length === 0 ? (
          <div className={`glass-card ${styles.emptyState}`}>
            <div>📋</div>
            <h3>No attempts yet</h3>
            <p>Take a quiz to see your history here!</p>
            <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
          </div>
        ) : (
          <div className={styles.attemptList}>
            {attempts.map((attempt, i) => (
              <div key={attempt.id} className={`glass-card ${styles.attemptCard}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={styles.attemptInfo}>
                  <div className={styles.attemptTopic}>{attempt.quiz_topic}</div>
                  <div className={styles.attemptMeta}>
                    <span className={`badge-${attempt.quiz_difficulty}`}>{attempt.quiz_difficulty}</span>
                    <span className={styles.metaText}>
                      {attempt.score}/{attempt.total_questions} correct
                    </span>
                    {attempt.time_taken && (
                      <span className={styles.metaText}>
                        ⏱ {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s
                      </span>
                    )}
                    <span className={styles.dateText}>
                      {new Date(attempt.started_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className={styles.attemptRight}>
                  <ScoreBadge pct={attempt.percentage_score} />
                  <Link
                    href={`/quiz/${attempt.quiz}/results/${attempt.id}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                    id={`view-result-${attempt.id}`}
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
