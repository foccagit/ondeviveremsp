'use client';

import { useTheme } from '@/hooks/useTheme';
import styles from './styles.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const label = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={styles.toggle}
      aria-label="Alternar tema"
      suppressHydrationWarning
    >
      {mounted ? label : '—'}
    </button>
  );
}
