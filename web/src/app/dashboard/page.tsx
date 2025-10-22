'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api('/api/auth/me')
      .then(data => {
        setMe(data.user);
        setLoading(false);
      })
      .catch(() => {
        setMe(null);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (!me) {
    return (
      <div className={styles.notSignedIn}>
        Not signed in. <Link href="/login">Login</Link>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.welcome}>
        Welcome, {me.name} ({me.role})
      </h2>

      {me.role === 'teacher' ? (
        <nav className={styles.nav}>
          <ul>
            <li><Link href="/teacher/courses">📚 Manage Courses</Link></li>
            <li><Link href="/teacher/assignments">📝 Manage Assignments</Link></li>
            <li><Link href="/teacher/submissions">📂 View Submissions</Link></li>
          </ul>
        </nav>
      ) : (
        <nav className={styles.nav}>
          <ul>
            <li><Link href="/student/courses">📚 Browse Courses</Link></li>
            <li><Link href="/student/assignments">📝 Assignments</Link></li>
            <li><Link href="/student/submissions">📂 My Submissions</Link></li>
          </ul>
        </nav>
      )}

      <button onClick={handleLogout} className={styles.logout}>
        Logout
      </button>
    </div>
  );
}
