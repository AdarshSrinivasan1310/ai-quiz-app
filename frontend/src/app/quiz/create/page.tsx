'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import styles from './create.module.css';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '🟢 Easy', desc: 'Beginner-friendly questions' },
  { value: 'medium', label: '🟡 Medium', desc: 'Some prior knowledge needed' },
  { value: 'hard', label: '🔴 Hard', desc: 'Advanced expertise required' },
];

export default function CreateQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  if (!authLoading && !user) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('🤖 Generating your quiz with AI...');
    setGenerating(true);

    try {
      const result = await quizApi.generate({
        topic: topic.trim(),
        num_questions: numQuestions,
        difficulty,
      });
      setStatus('✅ Quiz generated! Redirecting...');
      router.push(`/quiz/${result.quiz.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.');
      setStatus('');
    } finally {
      setGenerating(false);
    }
  };

  const topicSuggestions = [
    'React.js', 'Python Basics', 'World History', 'Machine Learning',
    'Algebra', 'Shakespeare', 'Astronomy', 'SQL Databases',
  ];

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <div className={`glass-card ${styles.card} animate-fade-up`}>
          <Link href="/dashboard" className={styles.backLink}>← Dashboard</Link>

          <div className={styles.header}>
            <h1 className={styles.title}>Create a New Quiz</h1>
            <p className={styles.subtitle}>
              Tell our AI what to quiz you on — it&apos;ll generate unique questions instantly.
            </p>
          </div>

          {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
          {status && !error && (
            <div className="alert-success" style={{ marginBottom: '20px' }}>
              <span className="animate-pulse-slow">{status}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Topic */}
            <div className={styles.field}>
              <label className="form-label" htmlFor="topic">Topic *</label>
              <input
                id="topic"
                type="text"
                className="input-field"
                placeholder="e.g. Python Data Structures, World War II, Calculus..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                required
                disabled={generating}
                minLength={2}
                maxLength={255}
              />
              {/* Quick suggestions */}
              <div className={styles.suggestions}>
                {topicSuggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={styles.suggestionChip}
                    onClick={() => setTopic(s)}
                    disabled={generating}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of questions */}
            <div className={styles.field}>
              <label className="form-label" htmlFor="num-questions">
                Number of Questions: <span className="gradient-text">{numQuestions}</span>
              </label>
              <input
                id="num-questions"
                type="range"
                min={5}
                max={20}
                step={1}
                value={numQuestions}
                onChange={e => setNumQuestions(parseInt(e.target.value))}
                className={styles.slider}
                disabled={generating}
              />
              <div className={styles.sliderLabels}>
                <span>5 (Quick)</span>
                <span>20 (Thorough)</span>
              </div>
            </div>

            {/* Difficulty */}
            <div className={styles.field}>
              <label className="form-label">Difficulty Level</label>
              <div className={styles.difficultyGrid}>
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    id={`difficulty-${opt.value}`}
                    className={`${styles.difficultyBtn} ${difficulty === opt.value ? styles.difficultySelected : ''}`}
                    onClick={() => setDifficulty(opt.value)}
                    disabled={generating}
                  >
                    <span className={styles.difficultyLabel}>{opt.label}</span>
                    <span className={styles.difficultyDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="generate-quiz-btn"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
              disabled={generating || !topic.trim()}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <span className="spinner" />
                  AI is generating {numQuestions} questions...
                </span>
              ) : (
                `⚡ Generate ${numQuestions} Questions on "${topic || 'your topic'}"`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
