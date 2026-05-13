'use client';

import Link from 'next/link';
import { useCompare } from '@/lib/CompareContext';
import { useFilters } from '@/hooks/useFilters';
import styles from './bar.module.css';

export default function CompareBar() {
  const { bairrosSelecionados, clear } = useCompare();
  const { filters } = useFilters();

  if (bairrosSelecionados.length < 2) return null;

  const params = new URLSearchParams();
  params.set('ids', bairrosSelecionados.join(','));
  if (filters.bairroTrabalho) params.set('trabalho', filters.bairroTrabalho);
  const href = `/comparar?${params.toString()}`;

  return (
    <div className={styles.bar}>
      <Link href={href} className={styles.cta}>
        Comparar ({bairrosSelecionados.length})
      </Link>
      <button type="button" onClick={clear} className={styles.clear} aria-label="Limpar">
        ×
      </button>
    </div>
  );
}
