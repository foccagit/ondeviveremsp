'use client';

import { useState, useEffect } from 'react';
import styles from './stats.module.css';

const FRASES = [
  'Você quer mais espaço no apartamento ou mais tempo no seu dia?',
  'Quanto tempo da sua vida você aceita gastar no caminho de casa?',
  'Morar perto custa caro. Morar longe custa tempo. O que vale mais pra você?',
];

export default function Stats() {
  // Sorteia no client após o mount pra evitar mismatch de hidratação
  // (server renderiza sempre a primeira; client troca por uma aleatória).
  const [frase, setFrase] = useState(FRASES[0]);

  useEffect(() => {
    setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]);
  }, []);

  return (
    <section className={styles.stats}>
      <h1 className={styles.headline}>{frase}</h1>
    </section>
  );
}
