'use client';

import { useState } from 'react';
import { useCompare } from '@/lib/CompareContext';
import { formatBRL } from '@/lib/format';
import NeighborhoodModal from '@/components/NeighborhoodModal';
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
      <div className={styles.transportGrid}>
        <Cell label="Transporte" value={MODAL_LABEL[modal.modal]} />
        <Cell
          label="Tarifa"
          value={`${formatBRL(modal.breakdown.porViagem)}/viagem`}
          hint={`· ${modal.breakdown.viagensMes} viagens/mês`}
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
  onHover,
}) {
  const { bairrosSelecionados, toggleBairro, max } = useCompare();
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const isSelected = bairrosSelecionados.includes(bairro.id);
  const isFull = bairrosSelecionados.length >= max && !isSelected;

  const principal = resumo.modalPrincipal;

  return (
    <article
      className={`${styles.card} ${expanded ? styles.cardExpanded : ''}`}
      onMouseEnter={() => onHover && onHover(bairro.id)}
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
        </span>
        <span className={styles.colValue}>{formatBRL(resumo.total)}/mês</span>
      </button>

      {expanded && (
        <div className={styles.detail}>
          <p className={styles.description}>{bairro.descricao}</p>

          <div className={styles.rentRow}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Aluguel ({tamanhoImovel}m²)</span>
              <span className={styles.metricValue}>{formatBRL(resumo.aluguel)}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Condomínio</span>
              <span className={styles.metricValue}>{formatBRL(resumo.condominio)}</span>
            </div>
          </div>

          <div className={styles.divider} />

          <TransportBlock modal={principal} />

          <div className={styles.divider} />

          <div className={styles.totalBlock}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatBRL(resumo.total)}/mês</span>
            </div>
            <p className={styles.totalContext}>
              Sendo {formatBRL(principal.custoMensal)} em transporte · {principal.tempoMensalHoras}h
              no trânsito
            </p>
          </div>

          <blockquote className={styles.narrativa}>
            {isReference || !tradeoff
              ? 'Bairro de referência. Mais perto, mas mais caro.'
              : tradeoff.mensagem}
          </blockquote>

          <div className={styles.detailFooter}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              className={styles.footerBtn}
            >
              Saiba mais sobre {bairro.nome}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBairro(bairro.id);
              }}
              disabled={isFull}
              className={`${styles.footerBtn} ${isSelected ? styles.footerBtnActive : ''}`}
            >
              {isSelected ? 'Remover do comparar' : isFull ? 'Limite atingido' : 'Comparar'}
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <NeighborhoodModal
          bairro={bairro}
          resumo={resumo}
          tamanhoImovel={tamanhoImovel}
          principal={principal}
          onClose={() => setModalOpen(false)}
          onToggleCompare={() => toggleBairro(bairro.id)}
          isSelected={isSelected}
          isFull={isFull}
        />
      )}
    </article>
  );
}
