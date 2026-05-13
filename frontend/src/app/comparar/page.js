'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
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
import { formatBRL, formatNumber, formatScore, formatBool, formatM2 } from '@/lib/format';
import styles from './page.module.css';

const MODAL_LABEL = {
  carro: 'Carro',
  uber: 'Uber',
  metro: 'Metrô',
  onibus: 'Ônibus',
};

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

  const dados = useMemo(() => {
    if (!trabalho) return [];
    return selecionados.map((b) => ({
      bairro: b,
      resumo: calcularResumoBairro(b, filters, trabalho, transporte),
    }));
  }, [selecionados, filters, trabalho]);

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
        const cmpAB = compararContraReferencia(a.resumo, b.resumo);
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

      <div className={styles.columns} data-count={dados.length}>
        {dados.map(({ bairro, resumo }) => (
          <div key={bairro.id} className={styles.column}>
            <h2 className={styles.colName}>{bairro.nome}</h2>
            <span className={styles.colZone}>zona {bairro.zona}</span>

            <dl className={styles.metrics}>
              <Row label="Aluguel/m²" value={formatM2(bairro.aluguelMedioM2)} />
              <Row
                label={`Aluguel (${filters.tamanhoImovel}m²)`}
                value={formatBRL(resumo.aluguel)}
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
            </dl>
          </div>
        ))}
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

function Row({ label, value, emphasized }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={`${styles.rowValue} ${emphasized ? styles.rowValueEmphasized : ''}`}>
        {value}
      </dd>
    </div>
  );
}
