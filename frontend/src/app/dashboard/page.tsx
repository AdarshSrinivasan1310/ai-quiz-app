'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { quizApi, Quiz } from '@/lib/api';
import Navbar from '@/components/Navbar';
import styles from './dashboard.module.css';

function DifficultyBadge({ level }: { level: string }) {
  return <span className={`badge-${level}`}>{level}</span>;
}

function QuizCard({ quiz, onDelete }: { quiz: Quiz; onDelete: (id: number) => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this quiz?')) return;
    setDeleting(true);
    try {
      await quizApi.delete(quiz.id);
      onDelete(quiz.id);
    } catch {
      alert('Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={styles.quizCard}
      onClick={() => router.push(`/quiz/${quiz.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && router.push(`/quiz/${quiz.id}`)}
      id={`quiz-card-${quiz.id}`}
    >
      <div className={styles.quizCardTop}>
        <div className={styles.topicIcon}>📚</div>
        <DifficultyBadge level={quiz.difficulty} />
      </div>
      <h3 className={styles.quizTopic}>{quiz.topic}</h3>
      <div className={styles.quizMeta}>
        <span>📝 {quiz.question_count} questions</span>
        <span>🔄 {quiz.attempt_count} attempt{quiz.attempt_count !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.quizDate}>
        {new Date(quiz.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </div>
      <div className={styles.quizActions}>
        <Link
          href={`/quiz/${quiz.id}`}
          className="btn-primary"
          style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem', padding: '9px 16px' }}
          onClick={e => e.stopPropagation()}
          id={`take-quiz-${quiz.id}`}
        >
          Take Quiz
        </Link>
        <button
          className="btn-secondary"
          style={{ padding: '9px 14px', fontSize: '0.875rem' }}
          onClick={handleDelete}
          disabled={deleting}
          id={`delete-quiz-${quiz.id}`}
        >
          {deleting ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    try {
      const data = await quizApi.list();
      setQuizzes(data);
    } catch {
      setError('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setQuizzes(prev => prev.filter(q => q.id !== id));
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Welcome back, <span className="gradient-text">{user.first_name || user.username}</span> 👋
            </h1>
            <p className={styles.subtitle}>Your quiz dashboard — create, take, and track your progress</p>
          </div>
          <Link href="/quiz/create" className="btn-primary" id="create-quiz-btn" style={{ whiteSpace: 'nowrap' }}>
            + Create Quiz
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { label: 'Quizzes Created', value: quizzes.length, icon: '📚' },
            { label: 'Quizzes Taken', value: user.total_quizzes_taken, icon: '✅' },
            { label: 'Avg Score', value: `${user.average_score}%`, icon: '📊' },
          ].map((s, i) => (
            <div key={i} className={`glass-card ${styles.statCard}`}>
              <span className={styles.statIcon}>{s.icon}</span>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quizzes */}
        <div className={styles.quizzesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Quizzes</h2>
            <Link href="/history" className={styles.viewHistory}>View History →</Link>
          </div>

          {error && <div className="alert-error">{error}</div>}

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1, 2, 3].map(i => (
                <div key={i} className={`glass-card ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className={`glass-card ${styles.emptyState}`}>
              <div className={styles.emptyIcon}>🎯</div>
              <h3>No quizzes yet</h3>
              <p>Create your first AI-powered quiz to get started!</p>
              <Link href="/quiz/create" className="btn-primary" id="create-first-quiz">+ Create Your First Quiz</Link>
            </div>
          ) : (
            <div className={styles.quizGrid}>
              {quizzes.map(quiz => (
                <QuizCard key={quiz.id} quiz={quiz} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
