'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import bairros from '@/data/bairros.json';
import { carregarAliases } from '@/lib/dataLoader';
import styles from './styles.module.css';

function normalizar(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function BairroCombobox({ value, onChange, onAliasChange, onOpenChange }) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const [aliases, setAliases] = useState(null);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const [labelExibido, setLabelExibido] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  // Carrega aliases via dataLoader
  useEffect(() => {
    let canceled = false;
    carregarAliases().then((data) => {
      if (!canceled) setAliases(data);
    });
    return () => {
      canceled = true;
    };
  }, []);

  // Click outside fecha o dropdown
  useEffect(() => {
    if (!aberto) return;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAberto(false);
        setBusca('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [aberto]);

  // Propaga mudanças de estado de abertura pro componente pai (opcional)
  useEffect(() => {
    if (onOpenChange) onOpenChange(aberto);
  }, [aberto, onOpenChange]);

  // Lista combinada: 96 distritos + N aliases
  const opcoes = useMemo(() => {
    const lista = bairros.map((b) => ({
      id: b.id,
      label: b.nome,
      subtitulo: `Zona ${b.zona}`,
      tipo: 'distrito',
      distritoId: b.id,
      sortKey: b.nome,
    }));

    if (aliases?.aliases) {
      Object.entries(aliases.aliases).forEach(([aliasId, data]) => {
        const distritoPai = bairros.find((b) => b.id === data.distrito);
        if (!distritoPai) return;
        lista.push({
          id: aliasId,
          label: data.nome_exibicao,
          subtitulo: `Zona ${data.zona || distritoPai.zona}`,
          tipo: 'alias',
          distritoId: data.distrito,
          sortKey: data.nome_exibicao,
        });
      });
    }

    return lista.sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'pt-BR'));
  }, [aliases]);

  // Filtragem com normalização (acentos-tolerante)
  const filtradas = useMemo(() => {
    if (!busca) return opcoes;
    const buscaNorm = normalizar(busca);
    return opcoes.filter((o) => normalizar(o.label).includes(buscaNorm));
  }, [busca, opcoes]);

  // Distrito selecionado pra exibir no input fechado
  const selecionado = useMemo(
    () => opcoes.find((o) => o.distritoId === value && o.tipo === 'distrito'),
    [opcoes, value]
  );

  function handleSelecionar(opcao) {
    onChange(opcao.distritoId);
    setLabelExibido(opcao.label);
    setAberto(false);
    setBusca('');
    setIndiceAtivo(-1);
    inputRef.current?.blur();

    if (onAliasChange) {
      if (opcao.tipo === 'alias') {
        onAliasChange({
          nomeExibicao: opcao.label,
          distritoId: opcao.distritoId,
        });
      } else {
        onAliasChange(null);
      }
    }
  }

  // Reset labelExibido quando o value externo deixa de bater com o que está exibido
  // (ex: filtro foi limpo de fora, ou veio de outra rota/URL)
  useEffect(() => {
    if (!labelExibido) return;
    const opcaoDoLabel = opcoes.find((o) => o.label === labelExibido);
    if (opcaoDoLabel && opcaoDoLabel.distritoId !== value) {
      setLabelExibido(null);
    }
  }, [value, opcoes, labelExibido]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setAberto(false);
      setBusca('');
      inputRef.current?.blur();
      return;
    }

    if (!aberto && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setAberto(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceAtivo((prev) => Math.min(prev + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceAtivo((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && indiceAtivo >= 0 && filtradas[indiceAtivo]) {
      e.preventDefault();
      handleSelecionar(filtradas[indiceAtivo]);
    }
  }

  // Scroll automático pra opção ativa
  useEffect(() => {
    if (indiceAtivo >= 0 && listaRef.current) {
      const elementoAtivo = listaRef.current.children[indiceAtivo];
      elementoAtivo?.scrollIntoView({ block: 'nearest' });
    }
  }, [indiceAtivo]);

  return (
    <div className={styles.combobox} ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Buscar bairro..."
        value={aberto ? busca : labelExibido || selecionado?.label || ''}
        onFocus={() => {
          setAberto(true);
          setBusca('');
          setIndiceAtivo(-1);
        }}
        onChange={(e) => {
          setBusca(e.target.value);
          setIndiceAtivo(0);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        aria-controls="bairro-combobox-list"
      />

      {aberto && (
        <ul
          id="bairro-combobox-list"
          className={styles.opcoes}
          ref={listaRef}
          role="listbox"
        >
          {filtradas.length === 0 ? (
            <li className={styles.semResultados}>Nenhum bairro encontrado</li>
          ) : (
            filtradas.map((o, idx) => (
              <li
                key={`${o.tipo}-${o.id}`}
                role="option"
                aria-selected={idx === indiceAtivo}
                className={`${styles.opcao} ${idx === indiceAtivo ? styles.opcaoAtiva : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelecionar(o)}
                onMouseEnter={() => setIndiceAtivo(idx)}
              >
                <span className={styles.opcaoLabel}>{o.label}</span>
                <span className={styles.opcaoSubtitulo}>{o.subtitulo}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
