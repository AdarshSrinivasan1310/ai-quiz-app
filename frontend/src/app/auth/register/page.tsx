'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={`glass-card ${styles.card} animate-fade-up`}>
        <Link href="/" className={styles.backLink}>← Back to Home</Link>

        <div className={styles.header}>
          <span className={styles.emoji}>🎓</span>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Start generating AI-powered quizzes today</p>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className="form-label" htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className="input-field"
                placeholder="Jane"
                value={form.first_name}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className="form-label" htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className="input-field"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className="form-label" htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              type="text"
              className="input-field"
              placeholder="janedoe99"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className="form-label" htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input-field"
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className="form-label" htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input-field"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className="form-label" htmlFor="password2">Confirm Password *</label>
            <input
              id="password2"
              name="password2"
              type="password"
              className="input-field"
              placeholder="Repeat your password"
              value={form.password2}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            id="register-submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span className="spinner" />
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.switchLink}>Log in →</Link>
        </p>
      </div>
    </div>
  );
}
