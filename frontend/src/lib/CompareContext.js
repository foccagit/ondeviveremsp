'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'ondeviveremsp-compare';
const MAX = 3;

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [bairrosSelecionados, setBairros] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setBairros(parsed.slice(0, MAX));
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bairrosSelecionados));
  }, [bairrosSelecionados, mounted]);

  const addBairro = useCallback((id) => {
    setBairros((prev) => {
      if (prev.includes(id) || prev.length >= MAX) return prev;
      return [...prev, id];
    });
  }, []);

  const removeBairro = useCallback((id) => {
    setBairros((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleBairro = useCallback((id) => {
    setBairros((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setBairros([]), []);

  return (
    <CompareContext.Provider
      value={{ bairrosSelecionados, addBairro, removeBairro, toggleBairro, clear, max: MAX }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
