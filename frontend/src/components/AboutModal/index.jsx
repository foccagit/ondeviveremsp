'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';

export default function AboutModal({ onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

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
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <line x1="4" y1="4" x2="20" y2="20" />
            <line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </button>

        <div className={styles.content}>

          <div className={styles.row}>
            <p className={styles.rowLabel}>Sobre</p>
            <div className={styles.rowContent}>
              <h1 id="about-title" className={styles.title}>
                96 distritos. Milhões de rotinas diferentes. E uma pergunta simples que quase
                ninguém consegue responder direito: quanto custa, de verdade, morar em cada
                lugar de São Paulo?
              </h1>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>Por que esse projeto existe?</p>
            <div className={styles.rowContent}>
              <div className={styles.bodyGroup}>
                <p className={styles.p}>
                  Toda conversa sobre morar em São Paulo acaba igual. &ldquo;Esse bairro é
                  bom.&rdquo; &ldquo;Ali é mais barato.&rdquo; &ldquo;Perto do metrô vale a
                  pena.&rdquo; &ldquo;Mas o trânsito mata.&rdquo;
                </p>
                <p className={styles.p}>
                  Só que quase sempre essas decisões são feitas no feeling. Ou baseadas apenas
                  no valor do aluguel. Mas morar longe pode significar 3 horas perdidas por
                  dia. Morar perto pode custar o dobro. E às vezes o barato sai caro em tempo,
                  transporte, cansaço e rotina. Esse projeto nasceu para transformar essa
                  escolha em algo mais visível, comparável e racional.
                </p>
                <p className={styles.p}>
                  A ideia é cruzar dados reais dos 96 distritos oficiais de São Paulo para
                  mostrar o custo total de morar em cada região considerando aluguel,
                  deslocamento, acesso a transporte, serviços e qualidade prática de vida.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>O projeto ainda está em beta</p>
            <div className={styles.rowContent}>
              <div className={styles.bodyGroup}>
                <p className={styles.p}>
                  O site ainda está em desenvolvimento e vários recursos estão sendo testados.
                </p>
                <p className={styles.p}>
                  Algumas informações são estimadas, outras ainda estão sendo calibradas, e
                  novos dados estão sendo adicionados aos poucos. A proposta nunca foi criar um
                  &ldquo;ranking dos melhores bairros&rdquo;, porque isso muda dependendo da
                  rotina, renda, prioridades e tempo de cada pessoa.
                </p>
                <p className={styles.p}>
                  A ideia é construir uma forma mais honesta de comparar escolhas urbanas. Não
                  é um guia definitivo. É uma ferramenta para ajudar pessoas a pensarem melhor
                  sobre a cidade onde vivem.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>O que os dados consideram</p>
            <div className={styles.rowContent}>
              <div className={styles.subSection}>
                <p className={styles.subLabel}>Tempo de deslocamento</p>
                <p className={styles.p}>
                  Os tempos são calculados usando a Google Maps Distance Matrix API. Os
                  valores atuais usam horários normais de sábado pela manhã como referência
                  base. Em horários de pico (7h–10h e 17h–20h), o tempo pode aumentar entre
                  40% e 70%.
                </p>
              </div>
              <div className={styles.subSection}>
                <p className={styles.subLabel}>Pontos de interesse</p>
                <p className={styles.p}>
                  O sistema considera categorias como hospitais, mercados, farmácias,
                  escolas, padarias, áreas verdes, shoppings, museus, estações de metrô,
                  academias, restaurantes, entre outros.
                </p>
              </div>
              <div className={styles.subSection}>
                <p className={styles.subLabel}>Aluguéis</p>
                <p className={styles.p}>
                  Atualmente existem distritos com dados reais de mercado e outros com
                  estimativas calibradas por zona da cidade. Sempre que um valor for
                  estimado, isso aparece sinalizado no produto. As fontes utilizadas são
                  QuintoAndar, Imovelweb e Loft.
                </p>
              </div>
              <div className={styles.subSection}>
                <p className={styles.subLabel}>Segurança</p>
                <p className={styles.p}>
                  A parte de segurança ainda está em desenvolvimento. A próxima versão
                  utilizará dados oficiais da Secretaria da Segurança Pública do Estado de
                  São Paulo.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>Limitações conhecidas</p>
            <div className={styles.rowContent}>
              <div className={styles.bodyGroup}>
                <p className={styles.p}>
                  Sub-bairros como Vila Madalena e Higienópolis são tratados dentro dos
                  distritos oficiais correspondentes.
                </p>
                <p className={styles.p}>
                  Valores de condomínio ainda são estimativas proporcionais ao aluguel.
                </p>
                <p className={styles.p}>
                  Tempos de carro e Uber podem variar bastante dependendo do horário e clima.
                </p>
                <p className={styles.p}>
                  Alguns distritos ainda possuem menos dados do que outros.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>Contato</p>
            <div className={styles.rowContent}>
              <p className={styles.p}>
                Para qualquer dúvida ou sugestão, entre em contato:{' '}
                <a href="mailto:focca@foccaland.com.br" className={styles.link}>
                  focca@foccaland.com.br
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
