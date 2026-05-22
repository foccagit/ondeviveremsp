'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import bairros from '@/data/bairros.json';
import transporte from '@/data/transporte.json';
import { useFilters } from '@/hooks/useFilters';
import { calcularResumoBairro, compararContraReferencia } from '@/lib/calcularCusto';
import { carregarDistancias, carregarPois, getPois } from '@/lib/dataLoader';
import { formatBRL, formatNumber, formatScore, formatBool, formatM2 } from '@/lib/format';
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
    const shown = nomes.slice(0, 2).join(', ');
    const extra = nomes.length > 2 ? '…' : '';
    return `${shown}${extra} (${total}${plus})`;
  }
  return `${total}${plus}`;
}

function formatPoiCount(poiCategoria) {
  if (!poiCategoria || poiCategoria.total === 0) return '0';
  const { total, tem_mais } = poiCategoria;
  return `${total}${tem_mais ? '+' : ''}`;
}

export default function CompararPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <CompararInner />
    </Suspense>
  );
}

function CompararInner() {
  const params = useSearchParams();
  const { filters, mounted } = useFilters();
  const ids = (params.get('ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const selecionados = ids.map((id) => bairros.find((b) => b.id === id)).filter(Boolean);
  const trabalhoParam = params.get('trabalho') || '';
  const trabalho =
    bairros.find((b) => b.id === trabalhoParam) ||
    bairros.find((b) => b.id === filters.bairroTrabalho) ||
    selecionados[0];

  const [distancias, setDistancias] = useState(null);
  const [pois, setPois] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

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

  const dados = useMemo(() => {
    if (!trabalho) return [];
    return selecionados.map((b) => ({
      bairro: b,
      resumo: calcularResumoBairro(b, filters, trabalho, transporte, distancias),
    }));
  }, [selecionados, filters, trabalho, distancias]);

  const chartData = dados.map((d) => ({
    nome: d.bairro.nome,
    total: Math.round(d.resumo.total),
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

  if (selecionados.length === 0) {
    return (
      <div className={styles.page}>
        <Link href="/" className={styles.back}>
          ← Voltar ao mapa
        </Link>
        <div className={styles.empty}>
          <h1 className={styles.title}>Nada para comparar.</h1>
          <p className={styles.subtitle}>
            Volte ao mapa, selecione 2 ou 3 bairros e clique em &quot;Comparar&quot;.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Voltar ao mapa
      </Link>

      {carregandoDados && (
        <div className={styles.loadingHint}>Carregando dados precisos...</div>
      )}

      <div className={styles.columns} data-count={dados.length}>
        {dados.map(({ bairro, resumo }) => {
          const poisBairro = pois ? getPois(pois, bairro.id) : null;
          return (
            <div key={bairro.id} className={styles.column}>
              <h2 className={styles.colName}>{bairro.nome}</h2>
              <span className={styles.colZone}>zona {bairro.zona}</span>

              <dl className={styles.metrics}>
                <Row label="Aluguel/m²" value={formatM2(bairro.aluguelMedioM2)} />
                <Row
                  label={`Aluguel (${filters.tamanhoImovel}m²)`}
                  value={formatBRL(resumo.aluguel)}
                  badge={bairro.aluguelFonte === 'estimado' ? 'estimado' : null}
                />
                <Row label="Condomínio" value={formatBRL(resumo.condominio)} />
                <Row
                  label={`Transporte (${MODAL_LABEL[resumo.modalPrincipal.modal]})`}
                  value={formatBRL(resumo.modalPrincipal.custoMensal)}
                />
                <Row label="Custo total" value={formatBRL(resumo.total)} emphasized />
                <Row
                  label="Distância do trabalho"
                  value={`${resumo.distanciaKm.toFixed(1)} km`}
                />
                <Row
                  label="Tempo/mês no trânsito"
                  value={`${resumo.modalPrincipal.tempoMensalHoras} h`}
                />
                <Row label="Renda média" value={formatBRL(bairro.renda)} />
                <Row label="População" value={formatNumber(bairro.populacao)} />
                <Row label="Segurança" value={formatScore(bairro.seguranca)} />
                <Row label="Tem metrô" value={formatBool(bairro.metro)} />
                <Row label="Vida noturna" value={`${bairro.vidaNoturna}/10`} />
                <Row label="Comércio" value={`${bairro.comercio}/10`} />
                <Row label="Parques" value={`${bairro.parques}/10`} />

                {pois && (
                  <>
                    <Row label="Estações de metrô" value={formatPoiList(poisBairro?.metroEstacoes)} />
                    <Row label="Supermercados" value={formatPoiCount(poisBairro?.supermercados)} />
                    <Row label="Bares e restaurantes" value={formatPoiCount(poisBairro?.barRestaurantes)} />
                    <Row label="Padarias" value={formatPoiCount(poisBairro?.padarias)} />
                    <Row label="Farmácias" value={formatPoiCount(poisBairro?.farmacias)} />
                    <Row label="Bancos" value={formatPoiCount(poisBairro?.bancos)} />
                    <Row label="Postos de gasolina" value={formatPoiCount(poisBairro?.postosGasolina)} />
                    <Row label="Escolas" value={formatPoiCount(poisBairro?.escolas)} />
                    <Row label="Academias" value={formatPoiCount(poisBairro?.academias)} />
                    <Row label="Cinemas" value={formatPoiCount(poisBairro?.cinemas)} />
                    <Row label="Áreas verdes" value={formatPoiList(poisBairro?.parques)} />
                    <Row label="Hospitais" value={formatPoiList(poisBairro?.hospitais)} />
                    <Row label="Shoppings" value={formatPoiList(poisBairro?.shoppings)} />
                    <Row label="Museus" value={formatPoiList(poisBairro?.museus)} />
                  </>
                )}
              </dl>
            </div>
          );
        })}
      </div>

      {mounted && chartData.length >= 2 && (
        <section className={styles.chartSection}>
          <header className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Custo total mensal</h3>
            <span className={styles.chartMeta}>
              imóvel: {filters.tamanhoImovel}m² · trabalho em {trabalho?.nome}
            </span>
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
                <YAxis
                  tick={{ fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                  tickFormatter={(v) => formatBRL(v)}
                  width={80}
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
                  formatter={(v) => [formatBRL(v), 'Total']}
                />
                <Bar dataKey="total" fill="var(--color-fg)" />
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
                <p className={styles.tradeoffMsg}>{narrativaPar(from, to, cmp)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function narrativaPar(from, to, cmp) {
  const { economiaMensal, tempoExtraMensalHoras, reaisPorHora } = cmp;
  const fmt = (v) => Math.abs(Math.round(v)).toLocaleString('pt-BR');

  if (economiaMensal > 0 && tempoExtraMensalHoras > 0) {
    return `Você economiza R$ ${fmt(economiaMensal)}/mês indo pro ${from.nome}, mas perde ${tempoExtraMensalHoras}h/mês. Seu tempo está sendo "vendido" por R$ ${fmt(reaisPorHora)}/hora.`;
  }
  if (economiaMensal > 0 && tempoExtraMensalHoras <= 0) {
    return `${from.nome} economiza R$ ${fmt(economiaMensal)}/mês E gasta menos tempo no trânsito que ${to.nome}. Dificilmente o ${to.nome} compensa.`;
  }
  if (economiaMensal <= 0 && tempoExtraMensalHoras <= 0) {
    return `${from.nome} é R$ ${fmt(economiaMensal)}/mês mais caro mas economiza ${Math.abs(tempoExtraMensalHoras)}h/mês comparado ao ${to.nome}.`;
  }
  return `${from.nome} é mais caro E mais distante que ${to.nome}. Provavelmente não compensa.`;
}

function Row({ label, value, emphasized, badge }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>
        {label}
        {badge && <span className={styles.badge}>{badge}</span>}
      </dt>
      <dd className={`${styles.rowValue} ${emphasized ? styles.rowValueEmphasized : ''}`}>
        {value}
      </dd>
    </div>
  );
}
