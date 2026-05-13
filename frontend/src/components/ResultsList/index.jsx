'use client';

import NeighborhoodCard from '@/components/NeighborhoodCard';
import styles from './styles.module.css';

export default function ResultsList({ entries, total }) {
  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhum bairro cabe nos seus parâmetros.</p>
        <p className={styles.hint}>
          Tente aumentar o salário ou trocar o modo de transporte.
        </p>
      </div>
    );
  }

  return (
    <section className={styles.results}>
      <header className={styles.header}>
        <h2 className={styles.title}>Bairros recomendados</h2>
        <span className={styles.count}>
          {entries.length} de {total}
        </span>
      </header>
      <div className={styles.list}>
        {entries.map(({ bairro, custo, score }) => (
          <NeighborhoodCard key={bairro.id} bairro={bairro} custo={custo} score={score} />
        ))}
      </div>
    </section>
  );
}
