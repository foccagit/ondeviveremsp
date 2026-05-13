import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img src="/data/avoa.svg" alt="" className={styles.logo} aria-hidden="true" />
          <span className={styles.brandText}>
            onde<span className={styles.brandMuted}>viver</span>em<span className={styles.brandMuted}>sp</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
