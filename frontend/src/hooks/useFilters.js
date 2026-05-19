'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ondeviveremsp-filters';

const DEFAULT_FILTERS = {
  bairroTrabalho: '',
  transporte: ['metro', 'uber'],
  prioridades: ['metro', 'seguranca'],
  tamanhoImovel: 50,
  distanciaMaximaKm: 10,
  aliasAtivo: null,
};

function sanitize(saved) {
  const merged = { ...DEFAULT_FILTERS, ...saved };
  if (!Array.isArray(merged.transporte) || merged.transporte.length === 0) {
    merged.transporte = DEFAULT_FILTERS.transporte;
  }
  if (typeof merged.tamanhoImovel !== 'number' || Number.isNaN(merged.tamanhoImovel)) {
    merged.tamanhoImovel = DEFAULT_FILTERS.tamanhoImovel;
  }
  const km = Number(merged.distanciaMaximaKm);
  if (!Number.isFinite(km)) {
    merged.distanciaMaximaKm = DEFAULT_FILTERS.distanciaMaximaKm;
  } else {
    merged.distanciaMaximaKm = Math.min(50, Math.max(1, Math.round(km)));
  }
  // Always start a session with no bairro de trabalho picked
  merged.bairroTrabalho = '';
  merged.aliasAtivo = null;
  return merged;
}

export function useFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setFilters(sanitize(JSON.parse(saved)));
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters, mounted]);

  const update = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const togglePrioridade = useCallback((key) => {
    setFilters((f) => {
      const has = f.prioridades.includes(key);
      return {
        ...f,
        prioridades: has ? f.prioridades.filter((p) => p !== key) : [...f.prioridades, key],
      };
    });
  }, []);

  const toggleTransporte = useCallback((modal) => {
    setFilters((f) => {
      const has = f.transporte.includes(modal);
      if (has) {
        if (f.transporte.length === 1) return f;
        return { ...f, transporte: f.transporte.filter((m) => m !== modal) };
      }
      // exclusive modals — replace whole selection
      if (modal === 'carro' || modal === 'uber') {
        return { ...f, transporte: [modal] };
      }
      // metro/onibus — combinable with each other only
      const next = f.transporte.filter((m) => m === 'metro' || m === 'onibus');
      return { ...f, transporte: [...next, modal] };
    });
  }, []);

  return { filters, update, togglePrioridade, toggleTransporte, mounted };
}
