'use client';

import { useEffect, useMemo, useState } from 'react';
import Map from '@/components/Map';
import ParticleMap from '@/components/Map/ParticleMap';
import Filters from '@/components/Filters';
import NeighborhoodCard from '@/components/NeighborhoodCard';
import CompareBar from '@/components/Compare/CompareBar';
import Stats from '@/components/Layout/Stats';
import WorkBanner from '@/components/Layout/WorkBanner';
import { useFilters } from '@/hooks/useFilters';
import {
  calcularResumoBairro,
  classificarProximidade,
  compararContraReferencia,
} from '@/lib/calcularCusto';
import bairros from '@/data/bairros.json';
import transporte from '@/data/transporte.json';
import styles from './page.module.css';

const GRUPOS = [
  { id: 'pertinho', titulo: 'Próximo', hint: 'até 5 km' },
  { id: 'medio', titulo: 'Meio', hint: '5–15 km' },
  { id: 'longe', titulo: 'Distante', hint: '15 km+' },
];

export default function HomePage() {
  const { filters, update, togglePrioridade, toggleTransporte, mounted } = useFilters();
  const [trabalhoConfirmado, setTrabalhoConfirmado] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [activeTab, setActiveTab] = useState('pertinho');

  const trabalho = useMemo(
    () => bairros.find((b) => b.id === filters.bairroTrabalho) || null,
    [filters.bairroTrabalho]
  );

  const dados = useMemo(() => {
    if (!trabalho) return [];
    return bairros
      .map((b) => {
        const resumo = calcularResumoBairro(b, filters, trabalho, transporte);
        return { bairro: b, resumo, proximidade: classificarProximidade(resumo.distanciaKm) };
      })
      .filter(({ resumo }) => resumo.distanciaKm <= filters.distanciaMaximaKm);
  }, [filters, trabalho]);

  const referencia = useMemo(() => {
    if (dados.length === 0) return null;
    return dados.reduce((a, b) => (a.resumo.distanciaKm <= b.resumo.distanciaKm ? a : b));
  }, [dados]);

  const grupos = useMemo(() => {
    const buckets = { pertinho: [], medio: [], longe: [] };
    for (const d of dados) buckets[d.proximidade].push(d);
    for (const key of Object.keys(buckets)) {
      buckets[key].sort((a, b) => a.resumo.distanciaKm - b.resumo.distanciaKm);
    }
    return buckets;
  }, [dados]);

  const handleMapClick = (id) => {
    update({ bairroTrabalho: id });
    setTrabalhoConfirmado(true);
  };

  const handleSelectChange = (patch) => {
    update(patch);
    if (patch.bairroTrabalho) setTrabalhoConfirmado(true);
  };

  const clearTrabalho = () => {
    setTrabalhoConfirmado(false);
    update({ bairroTrabalho: '' });
  };

  const showResults = trabalhoConfirmado && trabalho;
  const activeEntries = grupos[activeTab] || [];

  return (
    <>
      <Stats />

      {mounted && (
        <Filters
          filters={filters}
          onUpdate={handleSelectChange}
          onTogglePrioridade={togglePrioridade}
          onToggleTransporte={toggleTransporte}
        />
      )}

      <div className={styles.page}>
        {showResults ? (
          <div className={styles.layout}>
            <main className={styles.listColumn}>
              <WorkBanner bairro={trabalho} onClear={clearTrabalho} />
              <section className={styles.results}>
                <div className={styles.tabs} role="tablist">
                  <div
                    className={styles.tabsIndicator}
                    style={{
                      transform: `translateX(${
                        GRUPOS.findIndex((g) => g.id === activeTab) * 100
                      }%)`,
                    }}
                  />
                  {GRUPOS.map((g) => {
                    const count = (grupos[g.id] || []).length;
                    const active = activeTab === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTab(g.id)}
                        className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                      >
                        <span className={styles.tabTitle}>{g.titulo}</span>
                        <span className={styles.tabHint}>{g.hint}</span>
                        <span className={styles.tabCount}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.groupList}>
                  {activeEntries.length === 0 ? (
                    <p className={styles.emptyTab}>Nenhum bairro nesta faixa.</p>
                  ) : (
                    activeEntries.map(({ bairro, resumo }) => {
                      const isRef = bairro.id === referencia?.bairro.id;
                      const tradeoff = isRef
                        ? null
                        : compararContraReferencia(resumo, referencia.resumo);
                      return (
                        <NeighborhoodCard
                          key={bairro.id}
                          bairro={bairro}
                          resumo={resumo}
                          tradeoff={tradeoff}
                          isReference={isRef}
                          isTrabalho={bairro.id === filters.bairroTrabalho}
                          tamanhoImovel={filters.tamanhoImovel}
                          onHover={setHoveredId}
                        />
                      );
                    })
                  )}
                </div>
              </section>
            </main>

            <aside className={styles.mapColumn}>
              <div className={styles.mapInner}>
                <Map filters={filters} onBairroClick={handleMapClick} hoveredId={hoveredId} />
              </div>
            </aside>
          </div>
        ) : (
          <div className={styles.fullMap}>
            <ParticleMap />
          </div>
        )}
      </div>

      <CompareBar />
    </>
  );
}
