'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import bairros from '@/data/bairros.json';
import transporte from '@/data/transporte.json';
import { useFilters } from '@/hooks/useFilters';
import { calcularResumoBairro, compararContraReferencia } from '@/lib/calcularCusto';
import { resolverItem, resolverDistritoId } from '@/lib/enriquecerAlias';
import BairroCombobox from '@/components/BairroCombobox';
import { carregarDistancias, carregarPois, carregarAliases, getPois } from '@/lib/dataLoader';
import transportePublico from '@/data/transporte_publico.json';
import { formatBRL, formatNumber, formatScore, formatM2 } from '@/lib/format';
import styles from './page.module.css';

const MODAL_LABEL = {
  carro: 'Carro',
  uber: 'Uber',
  metro: 'Metrô',
  onibus: 'Ônibus',
};

function formatPoiList(poiCategoria) {
  if (!poiCategoria || poiCategoria.total === 0) return '—';
  const { total, tem_mais, nomes } = poiCategoria;
  const plus = tem_mais ? '+' : '';
  if (nomes && nomes.length > 0) {
    const visible = nomes.slice(0, 3);
    const restantes = total - visible.length;
    return (
      <ul className={styles.poiList}>
        {visible.map((nome, i) => (
          <li key={i} className={styles.poiItem}>{nome}</li>
        ))}
        {restantes > 0 && (
          <li className={styles.poiItemMore}>
            e mais {restantes}{tem_mais ? '+' : ''}
          </li>
        )}
      </ul>
    );
  }
  return `${total}${plus}`;
}

function formatPoiCount(poiCategoria) {
  if (!poiCategoria || poiCategoria.total === 0) return '0';
  const { total, tem_mais } = poiCategoria;
  return `${total}${tem_mais ? '+' : ''}`;
}

const LINHAS_FUNDO_CLARO = new Set(['#FFCB00', '#9C9C9C', '#65B348']);
function corTextoLinha(hex) {
  return LINHAS_FUNDO_CLARO.has(String(hex).toUpperCase()) ? '#000000' : '#FFFFFF';
}

function renderTransportePublico({ bairro }) {
  const tp = transportePublico[bairro.id];
  const metro = tp?.metro || [];
  const cptm = tp?.cptm || [];
  if (metro.length === 0 && cptm.length === 0) return '—';
  return (
    <div className={styles.transporteGrupos}>
      {metro.length > 0 && (
        <div className={styles.transporteSubGrupo}>
          <span className={styles.transporteSubLabel}>Metrô</span>
          <ul className={styles.transporteList}>
            {metro.map((e, i) => (
              <li key={`m-${i}`} className={styles.transporteItem}>
                <span
                  className={styles.linhaCirculo}
                  style={{ backgroundColor: e.cor_hex, color: corTextoLinha(e.cor_hex) }}
                  title={`Linha ${e.linha_numero} ${e.linha_nome}`}
                >
                  {e.linha_numero}
                </span>
                <span className={styles.estacaoNome}>{e.estacao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cptm.length > 0 && (
        <div className={styles.transporteSubGrupo}>
          <span className={styles.transporteSubLabel}>CPTM</span>
          <ul className={styles.transporteList}>
            {cptm.map((e, i) => (
              <li key={`c-${i}`} className={styles.transporteItem}>
                <span
                  className={styles.linhaCirculo}
                  style={{ backgroundColor: e.cor_hex, color: corTextoLinha(e.cor_hex) }}
                  title={`Linha ${e.linha_numero} ${e.linha_nome}`}
                >
                  {e.linha_numero}
                </span>
                <span className={styles.estacaoNome}>{e.estacao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const CATEGORIAS = [
  // === Sempre visíveis ===
  {
    id: 'aluguelM2',
    label: 'Aluguel/m²',
    render: ({ bairro }) => formatM2(bairro.aluguelMedioM2),
  },
  {
    id: 'aluguel',
    label: ({ filters }) => `Aluguel (${filters.tamanhoImovel}m²)`,
    render: ({ resumo }) => formatBRL(resumo.aluguel),
    badge: ({ bairro }) => (bairro.aluguelFonte === 'estimado' ? 'estimado' : null),
  },
  {
    id: 'condominio',
    label: 'Condomínio',
    render: ({ resumo }) => formatBRL(resumo.condominio),
  },
  {
    id: 'transporte',
    label: ({ resumo }) =>
      `Transporte (${MODAL_LABEL[resumo.modalPrincipal.modal] || resumo.modalPrincipal.modal})`,
    render: ({ resumo }) => formatBRL(resumo.modalPrincipal.custoMensal),
  },
  {
    id: 'custoTotal',
    label: 'Custo total',
    render: ({ resumo }) => formatBRL(resumo.total),
    emphasized: true,
  },
  {
    id: 'distancia',
    label: 'Distância do trabalho',
    render: ({ resumo }) => `${resumo.distanciaKm.toFixed(1)} km`,
  },
  {
    id: 'tempo',
    label: 'Tempo/mês no trânsito',
    render: ({ resumo }) => `${resumo.modalPrincipal.tempoMensalHoras} h`,
  },
  {
    id: 'populacao',
    label: 'População',
    render: ({ bairro }) => formatNumber(bairro.populacao),
  },
  {
    id: 'seguranca',
    label: 'Segurança',
    render: ({ bairro }) => formatScore(bairro.seguranca),
  },
  {
    id: 'vidaNoturna',
    label: 'Vida noturna',
    render: ({ bairro }) => `${bairro.vidaNoturna}/10`,
  },
  { id: 'comercio', label: 'Comércio', render: ({ bairro }) => `${bairro.comercio}/10` },
  { id: 'parques', label: 'Parques', render: ({ bairro }) => `${bairro.parques}/10` },

  // === Dependem de POIs ===
  {
    id: 'transportePublico',
    label: 'Metrô / CPTM',
    requiresPois: true,
    render: renderTransportePublico,
  },
  {
    id: 'supermercados',
    label: 'Supermercados',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.supermercados),
  },
  {
    id: 'bares',
    label: 'Bares e restaurantes',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.barRestaurantes),
  },
  {
    id: 'padarias',
    label: 'Padarias',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.padarias),
  },
  {
    id: 'farmacias',
    label: 'Farmácias',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.farmacias),
  },
  {
    id: 'bancos',
    label: 'Bancos',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.bancos),
  },
  {
    id: 'postos',
    label: 'Postos de gasolina',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.postosGasolina),
  },
  {
    id: 'escolas',
    label: 'Escolas',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.escolas),
  },
  {
    id: 'academias',
    label: 'Academias',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.academias),
  },
  {
    id: 'cinemas',
    label: 'Cinemas',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiCount(poisBairro?.cinemas),
  },
  {
    id: 'areasVerdes',
    label: 'Áreas verdes',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiList(poisBairro?.parques),
  },
  {
    id: 'hospitais',
    label: 'Hospitais',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiList(poisBairro?.hospitais),
  },
  {
    id: 'shoppings',
    label: 'Shoppings',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiList(poisBairro?.shoppings),
  },
  {
    id: 'museus',
    label: 'Museus',
    requiresPois: true,
    render: ({ poisBairro }) => formatPoiList(poisBairro?.museus),
  },
];

export default function CompararPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <CompararInner />
    </Suspense>
  );
}

function CompararInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { filters, mounted } = useFilters();
  const ids = (params.get('ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const trabalhoParam = params.get('trabalho') || '';

  const [distancias, setDistancias] = useState(null);
  const [pois, setPois] = useState(null);
  const [aliases, setAliases] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  // Toggle pro botão "+ Adicionar bairro" → combobox inline na coluna extra.
  const [adicionando, setAdicionando] = useState(false);
  // `stuck` vira true quando .stickyHead encosta no topo (cobertura do
  // header do site no mobile, top: 49px). Observamos o próprio
  // .stickyHead com threshold: [1] e rootMargin top: -50px — quando o
  // elemento não está mais 100% visível dentro da "área útil" (abaixo
  // do header), ele está stuck.
  const [stuck, setStuck] = useState(false);
  const stickyHeadRef = useRef(null);

  useEffect(() => {
    if (!stickyHeadRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // intersectionRatio < 1 = parte do elemento foi cortada pelo
        // rootMargin negativo = está stuck.
        setStuck(entry.intersectionRatio < 1);
      },
      { threshold: [1], rootMargin: '-50px 0px 0px 0px' }
    );
    observer.observe(stickyHeadRef.current);
    return () => observer.disconnect();
  }, []);

  // trabalho é o distrito completo (bairros.json). filters.bairroTrabalho e
  // trabalhoParam guardam SLUGS (do item buscado, alias ou distrito). Resolvemos
  // pro distritoId antes de procurar em bairros.json.
  const trabalho = useMemo(() => {
    const idDoParam = resolverDistritoId(trabalhoParam, aliases);
    const idDoFilter = resolverDistritoId(filters.bairroTrabalho, aliases);
    return (
      bairros.find((b) => b.id === idDoParam) ||
      bairros.find((b) => b.id === idDoFilter) ||
      null
    );
  }, [trabalhoParam, filters.bairroTrabalho, aliases]);

  // Nome a exibir no texto "Essa comparação está sendo feita em cima do seu
  // bairro de trabalho: X". Se o slug bate com um alias, usa nome_exibicao;
  // senão, cai no nome do distrito.
  const trabalhoNomeExibicao = useMemo(() => {
    const slug = trabalhoParam || filters.bairroTrabalho;
    const alias = aliases?.aliases?.[slug];
    if (alias) return alias.nome_exibicao;
    return trabalho?.nome ?? '';
  }, [trabalhoParam, filters.bairroTrabalho, aliases, trabalho]);

  const trabalhoSlugUrl = trabalhoParam || filters.bairroTrabalho;

  const removerBairro = (idParaRemover) => {
    // Comparação agora é 100% URL-based — só atualiza ?ids=.
    const novosIds = ids.filter((id) => id !== idParaRemover);
    const queryParams = new URLSearchParams();
    if (novosIds.length > 0) queryParams.set('ids', novosIds.join(','));
    if (trabalhoSlugUrl) queryParams.set('trabalho', trabalhoSlugUrl);
    const qs = queryParams.toString();
    router.replace(`/comparar${qs ? `?${qs}` : ''}`);
  };

  const adicionarBairro = (slug) => {
    if (!slug) return;
    if (slug === trabalhoSlugUrl) return; // não duplica trabalho
    if (ids.includes(slug)) return;
    const novosIds = [...ids, slug];
    const queryParams = new URLSearchParams();
    queryParams.set('ids', novosIds.join(','));
    if (trabalhoSlugUrl) queryParams.set('trabalho', trabalhoSlugUrl);
    router.replace(`/comparar?${queryParams.toString()}`);
  };

  useEffect(() => {
    let canceled = false;
    carregarDistancias()
      .then((d) => {
        if (canceled) return;
        setDistancias(d);
        setCarregandoDados(false);
      })
      .catch((err) => {
        if (canceled) return;
        console.error('Erro ao carregar distancias:', err);
        setCarregandoDados(false);
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    carregarPois()
      .then((data) => {
        if (!canceled) setPois(data);
      })
      .catch((err) => {
        if (!canceled) console.error('Erro ao carregar pois:', err);
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    carregarAliases()
      .then((data) => {
        if (!canceled) setAliases(data);
      })
      .catch((err) => {
        if (!canceled) console.error('Erro ao carregar aliases:', err);
      });
    return () => {
      canceled = true;
    };
  }, []);

  // Resolve cada id da URL como slug (aliases.json) com fallback pra
  // distritoId puro (URLs antigas). A coluna do trabalho é SEMPRE a
  // primeira; os ids da URL viram as colunas adicionais (1 a 2).
  const selecionados = useMemo(() => {
    if (!aliases) return [];
    const colTrabalho = trabalhoSlugUrl
      ? resolverItem(trabalhoSlugUrl, aliases, bairros)
      : null;
    const colAdic = ids
      .filter((id) => id !== trabalhoSlugUrl) // não duplica
      .map((id) => resolverItem(id, aliases, bairros))
      .filter(Boolean);
    return colTrabalho ? [colTrabalho, ...colAdic] : colAdic;
  }, [ids, aliases, trabalhoSlugUrl]);

  const dados = useMemo(() => {
    if (!trabalho) return [];
    return selecionados.map((b) => {
      const resumo = calcularResumoBairro(b, filters, trabalho, transporte, distancias);
      // Coluna do trabalho: força zeros literais em vez de "caminhada".
      if (b.distritoId === trabalho.id) {
        return {
          bairro: b,
          resumo: {
            ...resumo,
            distanciaKm: 0,
            modalPrincipal: {
              ...resumo.modalPrincipal,
              tempoMensalHoras: 0,
              custoMensal: 0,
              distanciaMensalKm: 0,
              tempoIdaMinutos: 0,
              tempoVoltaMinutos: 0,
            },
            total: resumo.aluguel + resumo.condominio,
          },
        };
      }
      return { bairro: b, resumo };
    });
  }, [selecionados, filters, trabalho, distancias]);

  const chartData = dados.map((d) => ({
    nome: d.bairro.nome,
    moradia: Math.round(d.resumo.aluguel + d.resumo.condominio),
    transporte: Math.round(d.resumo.modalPrincipal.custoMensal),
    tempo: d.resumo.modalPrincipal.tempoMensalHoras,
  }));

  const tradeoffs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < dados.length; i++) {
      for (let j = i + 1; j < dados.length; j++) {
        const a = dados[i];
        const b = dados[j];
        const cmpAB = compararContraReferencia(a.resumo, b.resumo, b.bairro.nome);
        pairs.push({ from: a.bairro, to: b.bairro, cmp: cmpAB });
      }
    }
    return pairs;
  }, [dados]);

  // Categorias visíveis: requiresPois só entram quando pois carregou
  const categoriasVisiveis = useMemo(
    () => CATEGORIAS.filter((c) => !c.requiresPois || pois),
    [pois]
  );

  // Espera os aliases carregarem antes de decidir se está vazio — sem isso,
  // os ids da URL não conseguem ser resolvidos e cai no empty state errôneo.
  if (!aliases) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingHint}>Carregando dados precisos...</p>
      </div>
    );
  }

  if (selecionados.length === 0) {
    return (
      <div className={styles.page}>
        <Link href="/" className={styles.back}>
          ← Voltar ao mapa
        </Link>
        <div className={styles.empty}>
          <h1 className={styles.title}>Nada para comparar.</h1>
          <p className={styles.subtitle}>
            Volte ao mapa, escolha um bairro de trabalho e clique em &quot;Comparar com&quot; em algum card.
          </p>
        </div>
      </div>
    );
  }

  if (!trabalho) {
    return (
      <div className={styles.page}>
        <Link href="/" className={styles.back}>
          ← Voltar ao mapa
        </Link>
        <div className={styles.empty}>
          <h1 className={styles.title}>Defina um bairro de trabalho.</h1>
          <p className={styles.subtitle}>
            A comparação de custos e tempos de transporte depende do seu ponto de referência. Volte à página inicial e escolha onde você trabalha.
          </p>
        </div>
      </div>
    );
  }

  // Quando há espaço (≤ 2 colunas de bairros), liberamos o botão
  // "+ Adicionar bairro" que vive fora do grid (canto direito da página).
  const podeAdicionar = dados.length < 3;
  const colCount = dados.length;
  // --right-reserve garante que tanto a linha dos nomes quanto as linhas
  // de dados deixem o mesmo espaço à direita (largura do botão + gap),
  // mantendo as colunas alinhadas verticalmente.
  const ADD_SLOT_WIDTH = 280;
  const SLOT_GAP = 24; // var(--space-6)
  const gridStyle = {
    '--col-count': colCount,
    '--right-reserve': podeAdicionar ? `${ADD_SLOT_WIDTH + SLOT_GAP}px` : '0px',
  };

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Voltar ao mapa
      </Link>

      {carregandoDados && (
        <div className={styles.loadingHint}>Carregando dados precisos...</div>
      )}

      {trabalho && (
        <p className={styles.compareTitle}>
          Essa comparação está sendo feita em cima do seu bairro de trabalho:{' '}
          <strong>{trabalhoNomeExibicao}</strong>.
        </p>
      )}

      <div
        ref={stickyHeadRef}
        className={`${styles.stickyHead} ${stuck ? styles.stickyHeadStuck : ''}`}
      >
        <div className={styles.headerRow}>
          <div className={styles.colHeaders} style={gridStyle}>
          {dados.map(({ bairro }) => {
            // X só aparece nas colunas adicionais — a coluna do trabalho é
            // a âncora e não pode ser removida.
            const ehColunaTrabalho = bairro.slug === trabalhoSlugUrl;
            return (
              <div key={bairro.slug} className={styles.colHeader}>
                <div className={styles.colHeaderTop}>
                  <h2 className={styles.colName}>{bairro.nome}</h2>
                  {/* X só aparece quando há 3 bairros — com 2, não tem sentido
                      remover (sobrariam só o trabalho). SVG pra controlar a
                      espessura do traço (stroke-width: 1 = traço fino). */}
                  {!ehColunaTrabalho && dados.length === 3 && (
                    <button
                      type="button"
                      onClick={() => removerBairro(bairro.slug)}
                      className={styles.colRemove}
                      aria-label={`Remover ${bairro.nome} da comparação`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="square"
                        aria-hidden="true"
                      >
                        <line x1="4" y1="4" x2="20" y2="20" />
                        <line x1="20" y1="4" x2="4" y2="20" />
                      </svg>
                    </button>
                  )}
                </div>
                <span className={styles.colZone}>
                  zona {bairro.zona}
                  {bairro.ehAlias && <> · distrito {bairro.distritoNome}</>}
                </span>
              </div>
            );
          })}
          </div>
          {podeAdicionar && (
            <div className={styles.adicionarSlot}>
              {!adicionando ? (
                <button
                  type="button"
                  onClick={() => setAdicionando(true)}
                  className={styles.adicionarBtn}
                >
                  + Adicionar bairro
                </button>
              ) : (
                <div className={styles.adicionarCombo}>
                  <BairroCombobox
                    value=""
                    placeholder="Buscar bairro..."
                    excluirSlugs={[trabalhoSlugUrl, ...ids]}
                    onChange={(slug) => {
                      adicionarBairro(slug);
                      setAdicionando(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setAdicionando(false)}
                    className={styles.adicionarCancel}
                    aria-label="Cancelar adicionar bairro"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="square"
                      aria-hidden="true"
                    >
                      <line x1="4" y1="4" x2="20" y2="20" />
                      <line x1="20" y1="4" x2="4" y2="20" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <dl className={styles.rows} style={gridStyle}>
        {categoriasVisiveis.map((cat) => (
          <div key={cat.id} className={styles.rowLine}>
            {dados.map(({ bairro, resumo }) => {
              const poisBairro = pois ? getPois(pois, bairro.id) : null;
              const ctx = { bairro, resumo, filters, poisBairro };
              const labelText =
                typeof cat.label === 'function' ? cat.label(ctx) : cat.label;
              const badgeText = cat.badge ? cat.badge(ctx) : null;
              return (
                <div
                  key={bairro.slug}
                  className={`${styles.cell} ${cat.emphasized ? styles.cellEmphasized : ''}`}
                >
                  <dt className={styles.rowLabel}>{labelText}</dt>
                  {badgeText && (
                    <span className={`${styles.badge} ${styles.cellBadge}`}>{badgeText}</span>
                  )}
                  <dd className={styles.rowValue}>{cat.render(ctx)}</dd>
                </div>
              );
            })}
          </div>
        ))}
      </dl>

      {mounted && chartData.length >= 2 && (
        <section className={styles.chartSection}>
          <header className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Custo total mensal</h3>
          </header>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={{ fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                {/* Eixo Y esquerdo: custo em R$ */}
                <YAxis
                  yAxisId="custo"
                  orientation="left"
                  tick={{ fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                  tickFormatter={(v) => formatBRL(v)}
                  width={80}
                />
                {/* Eixo Y direito: tempo em horas */}
                <YAxis
                  yAxisId="tempo"
                  orientation="right"
                  tick={{ fill: '#dc2626', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}h`}
                  width={50}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    paddingTop: 12,
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-surface)' }}
                  contentStyle={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-fg)',
                  }}
                  formatter={(value, name) => {
                    if (name === 'Tempo no trânsito') return [`${value}h/mês`, name];
                    return [formatBRL(value), name];
                  }}
                />
                {/* Três barras lado a lado por bairro */}
                <Bar yAxisId="custo" dataKey="moradia" name="Moradia" fill="var(--color-fg)" />
                <Bar yAxisId="custo" dataKey="transporte" name="Transporte" fill="var(--color-muted)" />
                <Bar yAxisId="tempo" dataKey="tempo" name="Tempo no trânsito" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {tradeoffs.length > 0 && (
        <section className={styles.tradeoffs}>
          <h3 className={styles.tradeoffsTitle}>Tradeoff</h3>
          <ul className={styles.tradeoffList}>
            {tradeoffs.map(({ from, to, cmp }) => (
              <li key={`${from.id}-${to.id}`} className={styles.tradeoffItem}>
                <span className={styles.tradeoffPair}>
                  {from.nome} vs. {to.nome}
                </span>
                <ul className={styles.narrativaList}>
                  {narrativaPar(from, to, cmp).map((parte, i) => (
                    <li key={i} className={styles.narrativaItem}>
                      <NarrativaIcon semantica={parte.semantica} />
                      <span>{parte.texto}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Ícone semântico ao lado da narrativa: seta verde pra cima (positivo)
 * ou vermelha pra baixo (negativo). Neutro renderiza um spacer pra manter
 * o texto alinhado com as linhas vizinhas.
 */
function NarrativaIcon({ semantica }) {
  if (semantica === 'positivo') {
    return (
      <svg
        className={`${styles.narrativaIcon} ${styles.narrativaIconUp}`}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
      >
        <line x1="8" y1="13" x2="8" y2="3" />
        <polyline points="3 8 8 3 13 8" />
      </svg>
    );
  }
  if (semantica === 'negativo') {
    return (
      <svg
        className={`${styles.narrativaIcon} ${styles.narrativaIconDown}`}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
      >
        <line x1="8" y1="3" x2="8" y2="13" />
        <polyline points="3 8 8 13 13 8" />
      </svg>
    );
  }
  return <span className={styles.narrativaIconSpacer} aria-hidden="true" />;
}

/**
 * Narrativa entre dois bairros, no formato de partes estruturadas com
 * semântica (positivo/negativo/neutro) — mesma diagramação do card.
 */
function narrativaPar(from, to, cmp) {
  const { economiaMensal, tempoExtraMensalHoras, reaisPorHora } = cmp;
  const fmt = (v) => Math.abs(Math.round(v)).toLocaleString('pt-BR');

  if (economiaMensal > 0 && tempoExtraMensalHoras > 0) {
    return [
      { semantica: 'positivo', texto: `Você economiza R$ ${fmt(economiaMensal)}/mês indo pro ${from.nome}.` },
      { semantica: 'negativo', texto: `Mas perde ${tempoExtraMensalHoras}h/mês.` },
      { semantica: 'neutro', texto: `Seu tempo está sendo "vendido" por R$ ${fmt(reaisPorHora)}/hora.` },
    ];
  }
  if (economiaMensal > 0 && tempoExtraMensalHoras <= 0) {
    return [
      { semantica: 'positivo', texto: `${from.nome} economiza R$ ${fmt(economiaMensal)}/mês.` },
      { semantica: 'positivo', texto: `E gasta menos tempo no trânsito que ${to.nome}.` },
      { semantica: 'neutro', texto: `Dificilmente o ${to.nome} compensa.` },
    ];
  }
  if (economiaMensal <= 0 && tempoExtraMensalHoras <= 0) {
    return [
      { semantica: 'negativo', texto: `${from.nome} é R$ ${fmt(economiaMensal)}/mês mais caro.` },
      { semantica: 'positivo', texto: `Mas economiza ${Math.abs(tempoExtraMensalHoras)}h/mês comparado ao ${to.nome}.` },
    ];
  }
  return [
    { semantica: 'negativo', texto: `${from.nome} é mais caro E mais distante que ${to.nome}.` },
    { semantica: 'neutro', texto: 'Provavelmente não compensa.' },
  ];
}
