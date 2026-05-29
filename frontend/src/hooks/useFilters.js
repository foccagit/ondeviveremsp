'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const DEFAULT_FILTERS = {
  bairroTrabalho: '',
  transporte: ['metro'],
  prioridades: [],
  /**
   * Ordenação da lista: 0 = priorizar mais barato (custo total),
   * 100 = priorizar menos deslocamento (tempo no trânsito),
   * 50 = balanceado entre os dois.
   */
  prioridadeOrdenacao: 50,
  aliasAtivo: null,
};

const FiltersContext = createContext(null);

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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

  return (
    <FiltersContext.Provider
      value={{ filters, update, togglePrioridade, toggleTransporte, mounted: true }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}
