'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: '🤖',
      title: 'AI-Generated Questions',
      desc: 'Gemini AI crafts unique, contextually relevant questions on any topic you choose.',
    },
    {
      icon: '🎯',
      title: 'Adaptive Difficulty',
      desc: 'Choose from Easy, Medium, or Hard — questions scale to challenge your current knowledge.',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      desc: 'Review every answer, see explanations, and track your improvement over time.',
    },
    {
      icon: '🔄',
      title: 'Unlimited Retakes',
      desc: 'Retake any quiz as many times as you want to master a topic.',
    },
  ];

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>✨</span>
            <span>Powered by Google Gemini AI</span>
          </div>
          <h1 className={styles.heroTitle}>
            Learn Anything with
            <br />
            <span className="gradient-text">AI-Powered Quizzes</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Generate custom quizzes on any topic in seconds. Track your progress,
            review your answers, and ace your next exam.
          </p>
          <div className={styles.heroCta}>
            {user ? (
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/register" className="btn-primary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
                  Start for Free →
                </Link>
                <Link href="/auth/login" className="btn-secondary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
                  Log in
                </Link>
              </>
            )}
          </div>
          <p className={styles.heroNote}>No credit card required • Free forever</p>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <div key={i} className={`glass-card ${styles.featureCard}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>
          How It <span className="gradient-text">Works</span>
        </h2>
        <div className={styles.steps}>
          {[
            { step: '01', title: 'Enter a Topic', desc: 'Type any subject you want to be quizzed on.' },
            { step: '02', title: 'AI Generates Questions', desc: 'Gemini creates unique MCQs tailored to your difficulty.' },
            { step: '03', title: 'Take the Quiz', desc: 'Answer at your own pace with progress tracking.' },
            { step: '04', title: 'Review & Improve', desc: 'See correct answers, explanations, and your score.' },
          ].map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNumber}>{s.step}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={`glass-card ${styles.ctaCard}`}>
          <h2 className={styles.ctaTitle}>Ready to test your knowledge?</h2>
          <p className={styles.ctaSubtitle}>Join thousands of learners using AI to study smarter.</p>
          {!user && (
            <Link href="/auth/register" className="btn-primary" style={{ fontSize: '1rem', padding: '13px 28px' }}>
              Create Your First Quiz →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Built with Next.js + Django + Gemini AI ·{' '}
          <span className="gradient-text">QuizGenius</span>
        </p>
      </footer>
    </div>
  );
}
