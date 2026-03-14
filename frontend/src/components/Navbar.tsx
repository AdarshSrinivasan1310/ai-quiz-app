'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={`gradient-text ${styles.logoText}`}>QuizGenius</span>
        </Link>

        <div className={styles.navLinks}>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/quiz/create" className={styles.navLink}>Create Quiz</Link>
              <Link href="/history" className={styles.navLink}>History</Link>
              <div className={styles.userSection}>
                <span className={styles.username}>👋 {user.first_name || user.username}</span>
                <button onClick={handleLogout} className={`btn-secondary ${styles.logoutBtn}`}>
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.navLink}>Log in</Link>
              <Link href="/auth/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
