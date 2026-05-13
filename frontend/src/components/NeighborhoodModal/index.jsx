'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatBRL, formatNumber } from '@/lib/format';
import styles from './styles.module.css';

const MODAL_LABEL = {
  carro: 'carro',
  uber: 'Uber',
  metro: 'metrô',
  onibus: 'ônibus',
};

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{value}</dd>
    </div>
  );
}

function listOrDash(arr, suffix = '') {
  if (!arr || arr.length === 0) return '—';
  const shown = arr.slice(0, 3).join(', ');
  const extra = arr.length > 3 ? '…' : '';
  return `${shown}${extra}${suffix}`;
}

export default function NeighborhoodModal({
  bairro,
  resumo,
  tamanhoImovel,
  principal,
  onClose,
  onToggleCompare,
  isSelected,
  isFull,
}) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const pois = bairro.pois || {};
  const modalLabel = MODAL_LABEL[principal.modal] || principal.modal;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-bairro-title"
    >
      <div className={styles.dialog} ref={dialogRef}>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={styles.close}
          aria-label="Fechar"
        >
          ✕
        </button>

        <header className={styles.header}>
          <h2 id="modal-bairro-title" className={styles.title}>
            {bairro.nome}
          </h2>
          <span className={styles.zone}>Zona {bairro.zona}</span>
        </header>

        <div className={styles.sep} />

        <p className={styles.long}>{bairro.descricaoLonga || bairro.descricao}</p>

        <div className={styles.sep} />

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>No bairro</h3>
          <dl className={styles.rows}>
            <Row
              label="Estações de metrô"
              value={
                pois.metroEstacoes && pois.metroEstacoes.length > 0
                  ? `${pois.metroEstacoes.slice(0, 3).join(', ')}${
                      pois.metroEstacoes.length > 3 ? '…' : ''
                    } (${pois.metroEstacoes.length})`
                  : 'Sem estação no bairro'
              }
            />
            <Row label="Supermercados" value={`${pois.supermercados ?? '—'} no entorno`} />
            <Row
              label="Bares e restaurantes"
              value={`~${pois.barRestaurantes ?? '—'} estabelecimentos`}
            />
            <Row label="Parques" value={listOrDash(pois.parques)} />
            <Row label="Hospitais" value={listOrDash(pois.hospitais)} />
            <Row label="Shoppings" value={listOrDash(pois.shoppings)} />
          </dl>
        </section>

        <div className={styles.sep} />

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Perfil</h3>
          <dl className={styles.rows}>
            <Row label="População" value={`${formatNumber(bairro.populacao)} habitantes`} />
            <Row label="Renda média familiar" value={formatBRL(bairro.renda)} />
            <Row label="Índice de segurança" value={`${bairro.seguranca}/100`} />
            <Row label="Vida noturna" value={`${bairro.vidaNoturna}/10`} />
            <Row label="Comércio" value={`${bairro.comercio}/10`} />
            <Row label="Parques e lazer" value={`${bairro.parques}/10`} />
          </dl>
        </section>

        <div className={styles.sep} />

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Custo estimado ({tamanhoImovel}m²)</h3>
          <dl className={styles.rows}>
            <Row label="Aluguel" value={formatBRL(resumo.aluguel)} />
            <Row label="Condomínio" value={formatBRL(resumo.condominio)} />
            <Row
              label={`Transporte (${modalLabel})`}
              value={formatBRL(principal.custoMensal)}
            />
            <Row label="Tempo no trânsito" value={`${principal.tempoMensalHoras}h/mês`} />
          </dl>
          <div className={styles.totalLine}>
            <span className={styles.totalLabel}>Total mensal</span>
            <span className={styles.totalValue}>{formatBRL(resumo.total)}</span>
          </div>
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={() => {
              onToggleCompare();
            }}
            disabled={isFull}
            className={`${styles.primary} ${isSelected ? styles.primaryActive : ''}`}
          >
            {isSelected ? 'Remover da comparação' : isFull ? 'Limite atingido' : 'Adicionar à comparação'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
