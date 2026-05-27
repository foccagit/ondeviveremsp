'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatBRL } from '@/lib/format';
import styles from './styles.module.css';

const MODAL_LABEL = {
  carro: 'Carro',
  uber: 'Uber',
  metro: 'Metrô',
  onibus: 'Ônibus',
};

function Cell({ label, value, hint, nowrap }) {
  return (
    <div className={styles.cell}>
      <span className={styles.cellLabel}>{label}</span>
      <span className={`${styles.cellValue} ${nowrap ? styles.cellValueNowrap : ''}`}>
        {value}
        {hint && <span className={styles.cellHint}> {hint}</span>}
      </span>
    </div>
  );
}

function MesmoBairroBlock() {
  return (
    <div className={styles.transportBlock}>
      <div className={styles.mesmoBairroTopo}>
        <span className={styles.mesmoBairroLabel}>TRANSPORTE</span>
        <h4 className={styles.mesmoBairroModal}>A pé</h4>
        <p className={styles.mesmoBairroNote}>
          {'Você mora e trabalha no mesmo bairro.\nProvavelmente caminha.'}
        </p>
      </div>
      <div className={styles.transportGrid}>
        <Cell label="Tempo estimado" value="12 min de caminhada" />
        <Cell label="Distância" value="1 km ida" />
        <Cell label="Custo mensal" value="R$ 0" />
      </div>
    </div>
  );
}

function TransportBlock({ modal }) {
  if (modal.modal === 'carro') {
    return (
      <div className={styles.transportBlock}>
        <div className={styles.transportGridCarro}>
          <Cell label="Transporte" value={MODAL_LABEL[modal.modal]} />
          <Cell
            label="Tempo"
            value={`${modal.tempoIdaMinutos} min ida · ${modal.tempoVoltaMinutos} min volta`}
            nowrap
          />
          <Cell
            label="Tempo no mês"
            value={`${modal.tempoMensalHoras}h`}
            hint="(22 dias úteis)"
          />
          <Cell label="Distância" value={`${modal.distanciaMensalKm} km/mês`} />
          <Cell
            label="Consumo"
            value={`${modal.detalhes.litrosMes} L/mês`}
            hint={`(${modal.detalhes.consumoKmPorLitro} km/L)`}
          />
          <Cell label="Combustível" value={formatBRL(modal.breakdown.combustivel)} />
          <Cell label="Estacionamento" value={formatBRL(modal.breakdown.estacionamento)} />
          <Cell label="Custo mensal" value={formatBRL(modal.custoMensal)} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.transportBlock}>
      {modal.semMetro && modal.avisoTrajeto && (
        <p className={styles.avisoTrajeto}>
          <svg
            className={styles.avisoIcon}
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="8" fill="currentColor" />
            <rect x="7.25" y="3.5" width="1.5" height="6" fill="var(--color-bg)" />
            <rect x="7.25" y="10.75" width="1.5" height="1.75" fill="var(--color-bg)" />
          </svg>
          <span>{modal.avisoTrajeto}</span>
        </p>
      )}
      <div className={styles.transportGrid}>
        <Cell label="Transporte" value={modal.modalLabel || MODAL_LABEL[modal.modal]} />
        <Cell
          label="Tarifa"
          value={`${formatBRL(modal.breakdown.porViagem)}/viagem`}
          hint={`${modal.breakdown.viagensMes} viagens/mês`}
        />
        <Cell
          label="Tempo"
          value={`${modal.tempoIdaMinutos} min ida · ${modal.tempoVoltaMinutos} min volta`}
          nowrap
        />
        <Cell
          label="Tempo no mês"
          value={`${modal.tempoMensalHoras}h`}
          hint="(22 dias úteis)"
        />
        <Cell label="Custo mensal" value={formatBRL(modal.custoMensal)} />
      </div>
    </div>
  );
}

export default function NeighborhoodCard({
  bairro,
  resumo,
  tradeoff,
  isReference,
  isTrabalho,
  tamanhoImovel,
  trabalhoSlug,
  trabalhoNome,
  onHover,
  onOpenModal,
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  // Identidade do item da lista é `slug` (alias). Fallback pra `id` mantém
  // compat com possíveis chamadores antigos.
  const itemId = bairro.slug || bairro.id;

  const principal = resumo.modalPrincipal;

  const irParaComparacao = () => {
    if (!trabalhoSlug) return;
    router.push(`/comparar?ids=${itemId}&trabalho=${trabalhoSlug}`);
  };

  return (
    <article
      className={`${styles.card} ${expanded ? styles.cardExpanded : ''}`}
      onMouseEnter={() => onHover && onHover(bairro.distritoId || bairro.id)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={styles.row}
        aria-expanded={expanded}
      >
        <span className={styles.colName}>
          {bairro.nome}
          {isTrabalho && <span className={styles.workBadge}>seu trabalho</span>}
        </span>
        <span className={styles.colLocation}>
          Zona {bairro.zona} · {resumo.distanciaKm.toFixed(1)} km
          {bairro.ehAlias && (
            <> · <span className={styles.distritoPai}>distrito {bairro.distritoNome}</span></>
          )}
        </span>
        <span className={styles.colValue}>{formatBRL(resumo.total)}/mês</span>
      </button>

      {expanded && (
        <div className={styles.detail}>
          {bairro.bioCurta ? (
            <p className={styles.description}>{bairro.bioCurta}</p>
          ) : (
            <p className={styles.description}>{bairro.descricao}</p>
          )}

          <div className={styles.rentRow}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Aluguel ({tamanhoImovel}m²)</span>
              <span className={styles.metricValue}>{formatBRL(resumo.aluguel)}</span>
              {bairro.aluguelFonte === 'estimado' && (
                <span className={`${styles.badge} ${styles.metricBadge}`}>estimado</span>
              )}
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Condomínio</span>
              <span className={styles.metricValue}>{formatBRL(resumo.condominio)}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {resumo.mesmoBairro ? (
            <MesmoBairroBlock />
          ) : (
            <TransportBlock modal={principal} />
          )}

          <div className={styles.divider} />

          <div className={styles.totalBlock}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatBRL(resumo.total)}/mês</span>
            </div>
            {resumo.mesmoBairro ? (
              <p className={styles.totalContext}>
                Sem custo de transporte · 0h no trânsito
              </p>
            ) : (
              <p className={styles.totalContext}>
                Sendo {formatBRL(principal.custoMensal)} em transporte · {principal.tempoMensalHoras}h
                no trânsito
              </p>
            )}
          </div>

          {isReference || !tradeoff ? (
            <blockquote className={styles.narrativa}>
              {`Você mora e trabalha aqui.\nCusto mais alto, mas zero tempo no trânsito, máxima qualidade de vida.`}
            </blockquote>
          ) : (
            <ul className={styles.narrativaList}>
              {tradeoff.partes.map((parte, i) => (
                <li key={i} className={styles.narrativaItem}>
                  {parte.semantica === 'positivo' && (
                    <svg
                      className={`${styles.narrativaIcon} ${styles.narrativaIconUp}`}
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      aria-hidden="true"
                    >
                      <line x1="8" y1="13" x2="8" y2="3" />
                      <polyline points="3 8 8 3 13 8" />
                    </svg>
                  )}
                  {parte.semantica === 'negativo' && (
                    <svg
                      className={`${styles.narrativaIcon} ${styles.narrativaIconDown}`}
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      aria-hidden="true"
                    >
                      <line x1="8" y1="3" x2="8" y2="13" />
                      <polyline points="3 8 8 13 13 8" />
                    </svg>
                  )}
                  {parte.semantica === 'neutro' && (
                    <span className={styles.narrativaIconSpacer} aria-hidden="true" />
                  )}
                  <span>{parte.texto}</span>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.detailFooter}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal?.();
              }}
              className={`${styles.footerBtn} ${styles.footerBtnPrimary}`}
            >
              Saiba mais sobre {bairro.nome}
            </button>
            {!isTrabalho && trabalhoSlug && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  irParaComparacao();
                }}
                className={styles.footerBtn}
              >
                Comparar com {trabalhoNome}
              </button>
            )}
          </div>
          {(principal.modal === 'carro' || principal.modal === 'uber') && (
            <p className={styles.notaPico}>
              *Tempos em horário normal. Em pico (7-10h e 17-20h), pode aumentar 40-70%.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
