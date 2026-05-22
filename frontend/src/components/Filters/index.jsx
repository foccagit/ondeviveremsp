'use client';

import { useEffect, useRef, useState } from 'react';
import BairroCombobox from '@/components/BairroCombobox';
import styles from './styles.module.css';

const PRESETS_TAMANHO = [
  { label: 'Studio', m2: 35 },
  { label: 'Apartamento', m2: 50 },
  { label: 'Casa/Família', m2: 80 },
];

const TRANSPORTES = [
  { id: 'metro', label: 'Metrô' },
  { id: 'onibus', label: 'Ônibus' },
  { id: 'uber', label: 'Uber' },
  { id: 'carro', label: 'Carro' },
];

const PRIORIDADES = [
  { id: 'metro', label: 'Metrô' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'vidaNoturna', label: 'Vida noturna' },
  { id: 'comercio', label: 'Comércio' },
  { id: 'parques', label: 'Parques' },
];

function Dropdown({ label, summary, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.dropdown} ref={ref}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.triggerText}>{summary}</span>
        <span className={styles.chevron}>▾</span>
      </button>
      {open && (
        <div className={`${styles.panel} ${align === 'right' ? styles.panelRight : ''}`}>
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}

export default function Filters({ filters, onUpdate, onTogglePrioridade, onToggleTransporte }) {
  const setTamanho = (n) => {
    const clamped = Math.min(200, Math.max(20, Number(n) || 0));
    onUpdate({ tamanhoImovel: clamped });
  };

  const transporteSummary =
    filters.transporte.length === 0
      ? 'Nenhum'
      : filters.transporte
          .map((id) => TRANSPORTES.find((t) => t.id === id)?.label)
          .filter(Boolean)
          .join(', ');
  const prioridadeSummary =
    filters.prioridades.length === 0
      ? 'Nenhuma'
      : `${filters.prioridades.length} selecionada${filters.prioridades.length > 1 ? 's' : ''}`;

  return (
    <div className={styles.filters}>
      <div className={styles.dropdown}>
        <span className={styles.label}>Bairro de trabalho</span>
        <BairroCombobox
          value={filters.bairroTrabalho}
          onChange={(id) => onUpdate({ bairroTrabalho: id })}
          onAliasChange={(alias) => onUpdate({ aliasAtivo: alias })}
        />
      </div>

      <Dropdown label="Tamanho do imóvel" summary={`${filters.tamanhoImovel} m²`}>
        <div className={styles.panelStack}>
          <div className={styles.inputRow}>
            <input
              type="number"
              min={20}
              max={200}
              step={5}
              value={filters.tamanhoImovel}
              onChange={(e) => setTamanho(e.target.value)}
              className={styles.input}
            />
            <span className={styles.suffix}>m²</span>
          </div>
          <div className={styles.presets}>
            {PRESETS_TAMANHO.map((p) => {
              const active = filters.tamanhoImovel === p.m2;
              return (
                <button
                  key={p.m2}
                  type="button"
                  onClick={() => setTamanho(p.m2)}
                  className={`${styles.preset} ${active ? styles.presetActive : ''}`}
                >
                  {p.label} ({p.m2}m²)
                </button>
              );
            })}
          </div>
        </div>
      </Dropdown>

      <div className={styles.dropdown}>
        <span className={styles.label}>Quero morar</span>
        <div className={styles.slider}>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={filters.distanciaMaximaKm}
              onChange={(e) => onUpdate({ distanciaMaximaKm: Number(e.target.value) })}
              className={styles.range}
              aria-label="Distância máxima do trabalho em quilômetros"
            />
            <span className={styles.sliderValue}>até {filters.distanciaMaximaKm} km</span>
          </div>
        </div>
      </div>

      <Dropdown label="Transporte" summary={transporteSummary}>
        <ul className={styles.list}>
          {TRANSPORTES.map((t) => {
            const active = filters.transporte.includes(t.id);
            const onlyOne = active && filters.transporte.length === 1;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={onlyOne}
                  className={styles.checkOption}
                  onClick={() => onToggleTransporte(t.id)}
                  title={onlyOne ? 'Pelo menos um modal precisa estar ativo' : undefined}
                >
                  <span className={`${styles.checkbox} ${active ? styles.checkboxOn : ''}`} />
                  <span>{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Dropdown>

      <Dropdown label="Prioridades" summary={prioridadeSummary} align="right">
        <ul className={styles.list}>
          {PRIORIDADES.map((p) => {
            const active = filters.prioridades.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={styles.checkOption}
                  onClick={() => onTogglePrioridade(p.id)}
                >
                  <span className={`${styles.checkbox} ${active ? styles.checkboxOn : ''}`} />
                  <span>{p.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Dropdown>
    </div>
  );
}
