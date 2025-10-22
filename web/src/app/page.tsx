'use client';
import Link from "next/link";
import styles from "./hero.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.hero}>
        <h1 className={styles.title}>Welcome to InnodeedClass</h1>
        <p className={styles.subtitle}>
          A platform to <span>learn</span>, <span>teach</span>, and <span>grow</span>.
        </p>
        <div className={styles.actions}>
          <Link href="/login" className={styles.button}>Login</Link>
          <Link href="/register" className={styles.buttonOutline}>Register</Link>
        </div>
      </main>
    </div>
  );
}
