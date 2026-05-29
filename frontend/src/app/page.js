'use client';

import { useEffect, useMemo, useState } from 'react';
import Map from '@/components/Map';
import ParticleMap from '@/components/Map/ParticleMap';
import Filters from '@/components/Filters';
import MobileFiltersPill from '@/components/Filters/MobileFiltersPill';
import MobileFiltersSheet from '@/components/Filters/MobileFiltersSheet';
import NeighborhoodCard from '@/components/NeighborhoodCard';
import NeighborhoodModal from '@/components/NeighborhoodModal';
import Stats from '@/components/Layout/Stats';
import WorkBanner from '@/components/Layout/WorkBanner';
import { useFilters } from '@/hooks/useFilters';
import {
  calcularResumoBairro,
  compararContraReferencia,
  TAMANHO_IMOVEL_FIXO,
} from '@/lib/calcularCusto';
import { carregarDistancias, carregarPois, carregarAliases, getPois } from '@/lib/dataLoader';
import { enriquecerAlias, resolverDistritoId } from '@/lib/enriquecerAlias';
import bairros from '@/data/bairros.json';
import transporte from '@/data/transporte.json';
import styles from './page.module.css';

const LIMITE_INICIAL = 30;

/**
 * Ordena uma lista de entries (com .resumo) combinando custo total e tempo
 * mensal. `peso` é 0-100: 0 = 100% custo, 100 = 100% tempo, 50 = balanceado.
 * Normaliza min/max de cada métrica antes de combinar pra que a diferença
 * de escala (R$ vs h) não domine o score.
 */
function ordenarPorPrioridade(items, peso) {
  if (items.length < 2) return items;
  const pesoTempo = peso / 100;
  const pesoCusto = 1 - pesoTempo;
  const custos = items.map((d) => d.resumo.total);
  const tempos = items.map((d) => d.resumo.modalPrincipal.tempoMensalHoras);
  const cMin = Math.min(...custos);
  const cMax = Math.max(...custos);
  const tMin = Math.min(...tempos);
  const tMax = Math.max(...tempos);
  const norm = (v, mn, mx) => (mx === mn ? 0 : (v - mn) / (mx - mn));
  return [...items].sort((a, b) => {
    const sA =
      pesoCusto * norm(a.resumo.total, cMin, cMax) +
      pesoTempo * norm(a.resumo.modalPrincipal.tempoMensalHoras, tMin, tMax);
    const sB =
      pesoCusto * norm(b.resumo.total, cMin, cMax) +
      pesoTempo * norm(b.resumo.modalPrincipal.tempoMensalHoras, tMin, tMax);
    return sA - sB;
  });
}

/**
 * Verifica se o bairro atende TODAS as prioridades selecionadas (AND).
 * Cortes calibrados sobre dados reais do Google Places.
 * 'seguranca' é tratada como no-op até termos dados oficiais do SSP-SP.
 */
function atendePrioridades(bairro, prioridades, pois) {
  if (!prioridades || prioridades.length === 0) return true;
  const ativas = prioridades.filter((p) => p !== 'seguranca');
  if (ativas.length === 0) return true;

  const poisBairro = getPois(pois, bairro.id);

  return ativas.every((prioridade) => {
    switch (prioridade) {
      case 'metro':
        return bairro.metro === true;
      case 'vidaNoturna':
        return (poisBairro?.barRestaurantes?.total || 0) >= 15;
      case 'comercio': {
        if (!poisBairro) return false;
        const supermercados = poisBairro.supermercados?.total || 0;
        const shoppings = poisBairro.shoppings?.total || 0;
        const farmacias = poisBairro.farmacias?.total || 0;
        const bancos = poisBairro.bancos?.total || 0;
        return supermercados >= 8 || shoppings >= 1 || farmacias + bancos >= 15;
      }
      case 'parques':
        return (poisBairro?.parques?.total || 0) >= 3;
      default:
        return true;
    }
  });
}

export default function HomePage() {
  const { filters, update, togglePrioridade, toggleTransporte, mounted } = useFilters();
  const [hoveredId, setHoveredId] = useState(null);
  const [bairroModalId, setBairroModalId] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Paginação: começa em 30 e expande ao clicar "Ver todos".
  const [limite, setLimite] = useState(LIMITE_INICIAL);

  // Dados reais (Google Distance Matrix / Places / aliases)
  const [distancias, setDistancias] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [pois, setPois] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [aliases, setAliases] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  useEffect(() => {
    let canceled = false;
    Promise.all([carregarDistancias(), carregarPois(), carregarAliases()])
      .then(([d, p, a]) => {
        if (canceled) return;
        setDistancias(d);
        setPois(p);
        setAliases(a);
        setCarregandoDados(false);
      })
      .catch((err) => {
        if (canceled) return;
        console.error('Erro ao carregar dados:', err);
        setCarregandoDados(false);
      });
    return () => {
      canceled = true;
    };
  }, []);

  const trabalho = useMemo(() => {
    // filters.bairroTrabalho agora guarda o SLUG do item buscado (pode ser
    // alias ou o próprio distrito). Resolvemos pro distritoId pra achar o
    // bairro completo em bairros.json (fonte dos dados quantitativos).
    const distritoId = resolverDistritoId(filters.bairroTrabalho, aliases);
    return bairros.find((b) => b.id === distritoId) || null;
  }, [filters.bairroTrabalho, aliases]);

  // Nome a exibir nos botões "Comparar com X" — usa nome_exibicao do alias
  // quando o slug do filters bate com um alias; senão o nome do distrito.
  const trabalhoNome = useMemo(() => {
    const slug = filters.bairroTrabalho;
    const alias = aliases?.aliases?.[slug];
    if (alias) return alias.nome_exibicao;
    return trabalho?.nome ?? '';
  }, [filters.bairroTrabalho, aliases, trabalho]);

  const dados = useMemo(() => {
    if (!trabalho) return [];
    if (!aliases?.aliases) return [];
    // Base agora é aliases.json (131 bairros buscáveis), não bairros.json (96).
    // Cada item carrega os dados quantitativos do distrito-pai via enriquecimento.
    const lista = Object.entries(aliases.aliases)
      .map(([slug, alias]) => {
        const distritoPai = bairros.find((b) => b.id === alias.distrito);
        if (!distritoPai) return null;
        const item = enriquecerAlias(slug, alias, distritoPai);
        const resumo = calcularResumoBairro(item, filters, trabalho, transporte, distancias);
        return { bairro: item, resumo };
      })
      .filter(Boolean)
      .filter(({ bairro }) => {
        // O bairro do trabalho (qualquer alias cujo distrito = trabalho) SEMPRE aparece
        if (bairro.distritoId === trabalho.id) return true;
        return atendePrioridades(bairro, filters.prioridades, pois);
      });
    // Ordenação combinada pelo slider de prioridade (custo vs tempo).
    return ordenarPorPrioridade(lista, filters.prioridadeOrdenacao ?? 50);
  }, [filters, trabalho, distancias, pois, aliases]);

  // Auto-fecha o modal se o bairro aberto sumiu dos resultados (filtro mudou).
  // Comparação por slug — `bairroModalId` guarda o slug do item.
  useEffect(() => {
    if (!bairroModalId) return;
    if (!dados.some((d) => d.bairro.slug === bairroModalId)) {
      setBairroModalId(null);
    }
  }, [dados, bairroModalId]);

  const referencia = useMemo(() => {
    if (dados.length === 0 || !trabalho) return null;
    // Prioridade: bate exatamente com o slug buscado pelo usuário (pode ser
    // alias como "analia-franco"). Sem isso, a narrativa ("Em relação a X...")
    // mostraria o nome do distrito-pai (Vila Formosa) em vez do alias buscado.
    const match =
      dados.find((d) => d.bairro.slug === filters.bairroTrabalho) ||
      dados.find((d) => d.bairro.slug === trabalho.id) ||
      dados.find((d) => d.bairro.distritoId === trabalho.id);
    if (match) return match;
    // Fallback: alguns distritos (ex: Cursino, Jaraguá) podem não ter alias
    // próprio em aliases.json. Constrói uma entrada sintética do próprio
    // distrito-pai pra que o tradeoff funcione.
    const resumoTrabalho = calcularResumoBairro(
      trabalho,
      filters,
      trabalho,
      transporte,
      distancias
    );
    return {
      bairro: {
        ...trabalho,
        slug: trabalho.id,
        distritoId: trabalho.id,
        distritoNome: trabalho.nome,
        ehAlias: false,
      },
      resumo: resumoTrabalho,
    };
  }, [dados, trabalho, filters, filters.bairroTrabalho, distancias]);

  // Reseta paginação pra LIMITE_INICIAL toda vez que a lista re-ordena
  // ou re-filtra (mudança nos filtros relevantes).
  useEffect(() => {
    setLimite(LIMITE_INICIAL);
  }, [
    filters.bairroTrabalho,
    filters.prioridadeOrdenacao,
    filters.transporte,
    filters.prioridades,
  ]);

  const handleSelectChange = (patch) => {
    update(patch);
  };

  const clearTrabalho = () => {
    update({ bairroTrabalho: '', aliasAtivo: null });
  };

  // `trabalho` já vem do Context (via filters.bairroTrabalho), que sobrevive
  // a navegação entre rotas. Derivar daí basta — sem estado local que se
  // perde quando o componente desmonta ao ir pra /comparar.
  const showResults = !!trabalho;
  const cardsVisiveis = dados.slice(0, limite);

  return (
    <>
      <div className={showResults ? styles.statsHiddenMobile : ''}>
        <Stats />
      </div>

      {mounted && (
        <Filters
          filters={filters}
          onUpdate={handleSelectChange}
          onTogglePrioridade={togglePrioridade}
          onToggleTransporte={toggleTransporte}
        />
      )}

      <div className={styles.page}>
        {carregandoDados && (
          <div className={styles.loadingHint}>Carregando dados precisos...</div>
        )}
        {showResults ? (
          <div className={styles.layout}>
            <main className={styles.listColumn}>
              <WorkBanner
                bairro={trabalho}
                aliasAtivo={filters.aliasAtivo}
                onClear={clearTrabalho}
              />
              <section className={styles.results}>
                <div className={styles.groupList}>
                  {dados.length === 0 ? (
                    filters.prioridades.some((p) => p !== 'seguranca') ? (
                      <p className={styles.emptyTab}>
                        Nenhum bairro atende suas prioridades. Tente afrouxar os filtros.
                      </p>
                    ) : (
                      <p className={styles.emptyTab}>Nenhum bairro encontrado.</p>
                    )
                  ) : (
                    cardsVisiveis.map(({ bairro, resumo }) => {
                      const isRef = bairro.slug === referencia?.bairro.slug;
                      // Sem referência (caso o bairro de trabalho não esteja
                      // entre os aliases — ex: Cursino/Jaraguá sem entrada
                      // própria no aliases.json), pula o tradeoff.
                      const tradeoff =
                        !referencia || isRef
                          ? null
                          : compararContraReferencia(
                              resumo,
                              referencia.resumo,
                              referencia.bairro.nome,
                              bairro.nome
                            );
                      return (
                        <NeighborhoodCard
                          key={bairro.slug}
                          bairro={bairro}
                          resumo={resumo}
                          tradeoff={tradeoff}
                          isReference={isRef}
                          isTrabalho={bairro.slug === filters.bairroTrabalho}
                          tamanhoImovel={TAMANHO_IMOVEL_FIXO}
                          trabalhoSlug={filters.bairroTrabalho}
                          trabalhoNome={trabalhoNome}
                          onHover={(id) => setHoveredId(id ? bairro.distritoId : null)}
                          onOpenModal={() => setBairroModalId(bairro.slug)}
                        />
                      );
                    })
                  )}
                </div>
                {dados.length > limite && (
                  <div className={styles.verTodosWrap}>
                    <p className={styles.verTodosContador}>
                      Mostrando {limite} de {dados.length} bairros
                    </p>
                    <button
                      type="button"
                      onClick={() => setLimite(dados.length)}
                      className={styles.verTodos}
                    >
                      Ver todos
                    </button>
                  </div>
                )}
              </section>
            </main>

            <aside className={styles.mapColumn}>
              <div className={styles.mapInner}>
                <Map
                  filters={{ ...filters, bairroTrabalho: trabalho?.id || '' }}
                  hoveredId={hoveredId}
                />
              </div>
            </aside>
          </div>
        ) : (
          <div className={styles.fullMap}>
            <ParticleMap />
          </div>
        )}
      </div>

      {(() => {
        if (!bairroModalId) return null;
        const entry = dados.find((d) => d.bairro.slug === bairroModalId);
        if (!entry) return null;
        const { bairro: modalBairro, resumo: modalResumo } = entry;
        const isTrabalho = modalBairro.slug === filters.bairroTrabalho;
        return (
          <NeighborhoodModal
            bairro={modalBairro}
            resumo={modalResumo}
            tamanhoImovel={TAMANHO_IMOVEL_FIXO}
            principal={modalResumo.modalPrincipal}
            onClose={() => setBairroModalId(null)}
            trabalhoSlug={filters.bairroTrabalho}
            trabalhoNome={trabalhoNome}
            isTrabalho={isTrabalho}
          />
        );
      })()}

      <MobileFiltersPill onOpen={() => setMobileFiltersOpen(true)} />
      <MobileFiltersSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      />
    </>
  );
}
