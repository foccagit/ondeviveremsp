'use client';

import { useState } from 'react';
import AboutModal from '@/components/AboutModal';
import styles from './styles.module.css';

export default function AboutButton() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={styles.button}
        aria-label="Sobre o projeto"
      >
        sobre
      </button>
      {aberto && <AboutModal onClose={() => setAberto(false)} />}
    </>
  );
}
