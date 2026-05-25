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
  { id: 'seguranca', label: 'Segurança', disabled: true, hint: 'em breve' },
  { id: 'vidaNoturna', label: 'Vida noturna' },
  { id: 'comercio', label: 'Comércio' },
  { id: 'parques', label: 'Parques' },
];

function BairroTrabalhoCell({ filters, onUpdate }) {
  const [comboAberto, setComboAberto] = useState(false);
  return (
    <div className={`${styles.dropdown} ${comboAberto ? styles.dropdownOpen : ''}`}>
      <span className={styles.label}>Bairro de trabalho</span>
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

export default function Filters({ filters, onUpdate, onTogglePrioridade, onToggleTransporte }) {
  const setTamanho = (n) => {
    const clamped = Math.min(200, Math.max(20, Number(n) || 0));
    onUpdate({ tamanhoImovel: clamped });
  };

  // Estado local do input "Personalizar" — permite digitação livre sem
  // clampar a cada caractere. Commita no blur/Enter.
  const [tamanhoInput, setTamanhoInput] = useState(filters.tamanhoImovel.toString());
  const [tamanhoErro, setTamanhoErro] = useState(null);

  useEffect(() => {
    setTamanhoInput(filters.tamanhoImovel.toString());
  }, [filters.tamanhoImovel]);

  const commitTamanhoInput = () => {
    const num = Number(tamanhoInput);

    if (Number.isNaN(num) || tamanhoInput.trim() === '') {
      setTamanhoInput(filters.tamanhoImovel.toString());
      setTamanhoErro(null);
      return;
    }

    if (num < 20) {
      setTamanhoErro('Mínimo de 20m²');
      setTamanhoInput(filters.tamanhoImovel.toString());
      return;
    }

    if (num > 200) {
      setTamanhoErro('Máximo de 200m²');
      setTamanhoInput(filters.tamanhoImovel.toString());
      return;
    }

    const rounded = Math.round(num);
    onUpdate({ tamanhoImovel: rounded });
    setTamanhoInput(rounded.toString());
    setTamanhoErro(null);
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
      <BairroTrabalhoCell filters={filters} onUpdate={onUpdate} />

      <Dropdown label="Tamanho do imóvel" summary={`${filters.tamanhoImovel} m²`}>
        {({ close }) => (
          <div className={styles.panelStack}>
            <div className={styles.presets}>
              {PRESETS_TAMANHO.map((p) => {
                const active = filters.tamanhoImovel === p.m2;
                return (
                  <button
                    key={p.m2}
                    type="button"
                    onClick={() => {
                      setTamanho(p.m2);
                      close();
                    }}
                    className={`${styles.preset} ${active ? styles.presetActive : ''}`}
                  >
                    {p.label} ({p.m2}m²)
                  </button>
                );
              })}
            </div>
            <div className={styles.inputBlock}>
              <div className={styles.inputHeader}>
                <span className={styles.inputLabel}>Personalizar:</span>
                <span className={styles.inputHint}>{tamanhoErro || 'Máximo 200m²'}</span>
              </div>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  min={20}
                  max={200}
                  step={1}
                  value={tamanhoInput}
                  onChange={(e) => {
                    setTamanhoInput(e.target.value);
                    if (tamanhoErro) setTamanhoErro(null);
                  }}
                  onBlur={commitTamanhoInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitTamanhoInput();
                      e.target.blur();
                    }
                  }}
                  className={styles.input}
                />
                <span className={styles.suffix}>m²</span>
              </div>
            </div>
          </div>
        )}
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
