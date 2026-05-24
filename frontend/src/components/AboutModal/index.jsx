'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';

export default function AboutModal({ onClose }) {
  // ESC fecha
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="about-title">
      <div className={styles.panel}>
        <button type="button" onClick={onClose} className={styles.close} aria-label="Fechar">
          ×
        </button>

        <div className={styles.content}>
          <span className={styles.eyebrow}>Sobre</span>

          <h1 id="about-title" className={styles.title}>
            96 distritos. Custo real de morar em cada um.
          </h1>

          <section className={styles.section}>
            <h2 className={styles.h2}>Por que esse site existe</h2>
            <p className={styles.p}>
              Morar em São Paulo envolve uma decisão complexa que ninguém faz sozinho: aluguel,
              transporte, tempo gasto no trânsito, qualidade de vida. A maioria das pessoas
              escolhe o bairro baseada em &quot;feeling&quot; ou no que outros recomendam — sem
              dado nenhum.
            </p>
            <p className={styles.p}>
              Este site cruza dados reais de 96 distritos oficiais de São Paulo pra mostrar o
              custo total de morar em cada um, considerando não só o aluguel mas o tempo perdido
              no deslocamento.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>Os 96 distritos</h2>
            <p className={styles.p}>
              São Paulo é dividida oficialmente em 96 distritos administrativos. Cada um tem suas
              características, perfil socioeconômico e relação com transporte público. Esse site
              cobre os 96.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>De onde vêm os dados</h2>

            <h3 className={styles.h3}>Distâncias e tempos</h3>
            <p className={styles.p}>
              Google Maps Distance Matrix API. Tempos calculados em horário normal de sábado de
              manhã. Em horário de pico (7-10h e 17-20h), podem aumentar 40-70%.
            </p>

            <h3 className={styles.h3}>Pontos de interesse</h3>
            <p className={styles.p}>
              Google Places API. 14 categorias por bairro: hospitais, escolas, mercados,
              padarias, farmácias, áreas verdes, shoppings, museus, estações de metrô, e mais.
            </p>

            <h3 className={styles.h3}>Aluguéis</h3>
            <p className={styles.p}>17 distritos com dados reais de mercado:</p>
            <ul className={styles.list}>
              <li>QuintoAndar/Imovelweb (Set/2025) — 10 bairros mais caros</li>
              <li>Loft Q2/2025 — 7 bairros com base em 152 mil anúncios reais</li>
            </ul>
            <p className={styles.p}>
              Os outros 79 distritos têm estimativas calibradas por zona, sempre marcadas com
              badge [estimado] no produto.
            </p>

            <h3 className={styles.h3}>Segurança</h3>
            <p className={styles.p}>
              Estimativa simplificada por enquanto. Versão com dados oficiais do SSP-SP
              (Secretaria da Segurança Pública) em desenvolvimento.
            </p>

            <h3 className={styles.h3}>População e renda</h3>
            <p className={styles.p}>
              IBGE Censo 2022 (estimativas baseadas em divisão administrativa).
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>Limitações conhecidas</h2>
            <ul className={styles.list}>
              <li>
                Sub-bairros (Vila Madalena, Higienópolis) são tratados como parte do
                distrito-pai oficial (Pinheiros, Consolação). Você pode buscar pelo nome do
                sub-bairro, mas os cálculos usam o distrito-pai.
              </li>
              <li>
                Condomínios são estimativas proporcionais ao aluguel — não há fonte pública
                confiável por bairro.
              </li>
              <li>
                Tempos de carro/Uber são de horário normal. Pico pode aumentar significativamente.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>Quem fez</h2>
            <p className={styles.p}>
              Projeto independente, sem fins lucrativos, sem ads. Código aberto em{' '}
              <a
                href="https://github.com/foccagit/ondeviveremsp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                github.com/foccagit/ondeviveremsp
              </a>
              .
            </p>
            <p className={styles.p}>
              Sugestões, correções ou descobriu um erro? Abre uma issue no GitHub.
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
