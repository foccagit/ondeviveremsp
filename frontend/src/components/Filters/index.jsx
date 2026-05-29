'use client';

import { useEffect, useRef, useState } from 'react';
import BairroCombobox from '@/components/BairroCombobox';
import styles from './styles.module.css';

const TRANSPORTES = [
  { id: 'metro', label: 'Metrô' },
  { id: 'onibus', label: 'Ônibus' },
  { id: 'uber', label: 'Uber' },
  { id: 'carro', label: 'Carro' },
];

const PRIORIDADES = [
  { id: 'metro', label: 'Metrô' },
  { id: 'vidaNoturna', label: 'Vida noturna' },
  { id: 'comercio', label: 'Comércio' },
  { id: 'parques', label: 'Parques' },
  { id: 'seguranca', label: 'Segurança', disabled: true, hint: 'em breve' },
];

function BairroTrabalhoCell({ filters, onUpdate }) {
  const [comboAberto, setComboAberto] = useState(false);
  return (
    <div className={`${styles.dropdown} ${comboAberto ? styles.dropdownOpen : ''}`}>
      <span className={styles.label}>Onde você trabalha?</span>
      <BairroCombobox
        value={filters.bairroTrabalho}
        onChange={(id) => onUpdate({ bairroTrabalho: id })}
        onAliasChange={(alias) => onUpdate({ aliasAtivo: alias })}
        onOpenChange={setComboAberto}
      />
    </div>
  );
}

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
    <div className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`} ref={ref}>
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

export default function Filters({ filters, onUpdate, onTogglePrioridade, onToggleTransporte, layout = 'desktop' }) {
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

  const prioridadeOrd = filters.prioridadeOrdenacao ?? 50;

  return (
    <div className={`${styles.filters} ${layout === 'mobile' ? styles.filtersVertical : ''}`}>
      <BairroTrabalhoCell filters={filters} onUpdate={onUpdate} />

      <div className={styles.dropdown}>
        <span className={styles.label}>O que vale mais pra você?</span>
        <div className={styles.sliderPriority}>
          <span className={styles.sliderEndLabel}>Preço</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={prioridadeOrd}
            onChange={(e) => onUpdate({ prioridadeOrdenacao: Number(e.target.value) })}
            className={`${styles.range} ${styles.rangePriority}`}
            aria-label="Priorizar custo (esquerda) ou tempo de deslocamento (direita)"
          />
          <span className={styles.sliderEndLabel}>Tempo</span>
        </div>
      </div>

      <Dropdown label="Como você se locomove?" summary={transporteSummary}>
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

      <Dropdown label="O que você gosta de ter perto?" summary={prioridadeSummary} align="right">
        <ul className={styles.list}>
          {PRIORIDADES.map((p) => {
            const active = filters.prioridades.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={p.disabled}
                  className={styles.checkOption}
                  onClick={() => !p.disabled && onTogglePrioridade(p.id)}
                  title={
                    p.disabled
                      ? 'Em desenvolvimento — precisa de dados reais do SSP-SP'
                      : undefined
                  }
                >
                  <span className={`${styles.checkbox} ${active ? styles.checkboxOn : ''}`} />
                  <span>{p.label}</span>
                  {p.hint && <span className={styles.hintBadge}>{p.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Dropdown>
    </div>
  );
}
