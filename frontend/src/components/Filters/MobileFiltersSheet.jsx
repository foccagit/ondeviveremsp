'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFilters } from '@/hooks/useFilters';
import Filters from './index';
import styles from './mobile-sheet.module.css';

export default function MobileFiltersSheet({ isOpen, onClose }) {
  const { filters, update, togglePrioridade, toggleTransporte } = useFilters();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-filters-title"
      >
        <header className={styles.header}>
          <h2 id="mobile-filters-title" className={styles.title}>
            Filtros
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.close}
            aria-label="Fechar filtros"
          >
            ✕
          </button>
        </header>
        <div className={styles.content}>
          <Filters
            layout="mobile"
            filters={filters}
            onUpdate={update}
            onTogglePrioridade={togglePrioridade}
            onToggleTransporte={toggleTransporte}
          />
        </div>
        <footer className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.apply}>
            Ver resultados
          </button>
        </footer>
      </aside>
    </>,
    document.body
  );
}
