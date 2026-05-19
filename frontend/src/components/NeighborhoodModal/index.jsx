'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatBRL, formatNumber } from '@/lib/format';
import { carregarPois, getPois } from '@/lib/dataLoader';
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

function formatPoiList(poiCategoria) {
  // { total, tem_mais, nomes? }
  if (!poiCategoria || poiCategoria.total === 0) return '—';
  const { total, tem_mais, nomes } = poiCategoria;
  const plus = tem_mais ? '+' : '';
  if (nomes && nomes.length > 0) {
    const shown = nomes.slice(0, 3).join(', ');
    const extra = nomes.length > 3 ? '…' : '';
    return `${shown}${extra} (${total}${plus})`;
  }
  return `${total}${plus}`;
}

function formatPoiCount(poiCategoria, sufixo = '') {
  if (!poiCategoria || poiCategoria.total === 0) return '0';
  const { total, tem_mais } = poiCategoria;
  return `${total}${tem_mais ? '+' : ''}${sufixo}`;
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
  const [pois, setPois] = useState(null);

  useEffect(() => {
    let canceled = false;
    carregarPois().then((data) => {
      if (!canceled) setPois(getPois(data, bairro.id));
    });
    return () => {
      canceled = true;
    };
  }, [bairro.id]);

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
          {!pois ? (
            <p className={styles.loadingHint}>Carregando dados...</p>
          ) : (
            <dl className={styles.rows}>
              <Row label="Estações de metrô" value={formatPoiList(pois.metroEstacoes)} />
              <Row
                label="Supermercados"
                value={`${formatPoiCount(pois.supermercados)} no entorno`}
              />
              <Row
                label="Bares e restaurantes"
                value={`${formatPoiCount(pois.barRestaurantes)} estabelecimentos`}
              />
              <Row label="Padarias" value={formatPoiCount(pois.padarias)} />
              <Row label="Farmácias" value={formatPoiCount(pois.farmacias)} />
              <Row label="Bancos" value={formatPoiCount(pois.bancos)} />
              <Row label="Postos de gasolina" value={formatPoiCount(pois.postosGasolina)} />
              <Row label="Escolas" value={formatPoiCount(pois.escolas)} />
              <Row label="Academias" value={formatPoiCount(pois.academias)} />
              <Row label="Cinemas" value={formatPoiCount(pois.cinemas)} />
              <Row label="Áreas verdes" value={formatPoiList(pois.parques)} />
              <Row label="Hospitais" value={formatPoiList(pois.hospitais)} />
              <Row label="Shoppings" value={formatPoiList(pois.shoppings)} />
              <Row label="Museus" value={formatPoiList(pois.museus)} />
            </dl>
          )}
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
          {(principal.modal === 'carro' || principal.modal === 'uber') && (
            <p className={styles.notaPico}>
              Tempos em horário normal. Em pico (7-10h e 17-20h), pode aumentar 40-70%.
            </p>
          )}
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
