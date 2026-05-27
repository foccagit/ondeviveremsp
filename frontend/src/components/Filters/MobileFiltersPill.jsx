'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './mobile-pill.module.css';

export default function MobileFiltersPill({ onOpen }) {
  const [visible, setVisible] = useState(true);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastYRef.current || currentY < 50) {
        setVisible(true);
      } else if (currentY > lastYRef.current && currentY > 100) {
        setVisible(false);
      }
      lastYRef.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${styles.pill} ${visible ? styles.pillVisible : styles.pillHidden}`}
      aria-label="Abrir filtros"
    >
      FILTROS
    </button>
  );
}
