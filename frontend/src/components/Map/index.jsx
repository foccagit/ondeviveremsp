'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import distritos from '@/data/distritos.json';
import bairrosData from '@/data/bairros.json';
import { formatM2 } from '@/lib/format';
import styles from './styles.module.css';

const ALUGUEL_BY_ID = new globalThis.Map(bairrosData.map((b) => [b.id, b.aluguelMedioM2]));
const getAluguelM2 = (id) => ALUGUEL_BY_ID.get(id);

const SVG_URL = '/data/mapa-sp.svg';
const MATCH_THRESHOLD = 70;
const FALLBACK_VIEWBOX = '0 0 1200 1800';

function isSubprefeitura(text) {
  return text === text.toUpperCase() && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(text);
}

function extractTextContent(textEl) {
  const tspans = textEl.querySelectorAll('tspan');
  const parts = [];
  tspans.forEach((t) => parts.push(t.textContent || ''));
  if (parts.length === 0 && textEl.textContent) parts.push(textEl.textContent);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function squaredDist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function buildSvgNameIndex() {
  const byName = new globalThis.Map();
  for (const d of distritos) {
    byName.set(d.svgName, d);
    byName.set(d.nome, d);
  }
  return byName;
}

export default function Map({ filters, onBairroClick, resumos, hoveredId }) {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [svgReady, setSvgReady] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((t) => t + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const nameIndex = useMemo(() => buildSvgNameIndex(), []);
  const resumoById = resumos || {};

  // Load SVG once
  useEffect(() => {
    let canceled = false;
    fetch(SVG_URL)
      .then((r) => r.text())
      .then((svgText) => {
        if (canceled || !containerRef.current) return;
        containerRef.current.innerHTML = svgText;
        const svg = containerRef.current.querySelector('svg');
        if (!svg) return;

        // Ensure viewBox is set so the SVG scales when width/height are removed
        if (!svg.getAttribute('viewBox')) {
          const w = svg.getAttribute('width') || '1200';
          const h = svg.getAttribute('height') || '1800';
          svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
        }
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Strip embedded inline fills/strokes from <g> wrappers
        svg.querySelectorAll('g').forEach((g) => {
          g.removeAttribute('fill');
          g.removeAttribute('stroke');
          g.removeAttribute('style');
        });

        setSvgReady(true);
      })
      .catch(() => setSvgReady(false));
    return () => {
      canceled = true;
    };
  }, []);

  // Map paths → districts and neutralize colors
  useEffect(() => {
    if (!svgReady || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const texts = Array.from(svg.querySelectorAll('text'))
      .map((el) => {
        const name = extractTextContent(el);
        if (!name || isSubprefeitura(name)) return null;
        const x = parseFloat(el.getAttribute('x'));
        const y = parseFloat(el.getAttribute('y'));
        if (Number.isNaN(x) || Number.isNaN(y)) return null;
        return { name, x, y };
      })
      .filter(Boolean);

    const paths = svg.querySelectorAll('path');
    let identified = 0;

    const computed = getComputedStyle(document.documentElement);
    const bgColor = computed.getPropertyValue('--color-bg').trim() || '#ffffff';
    const fgColor = computed.getPropertyValue('--color-fg').trim() || '#000000';

    paths.forEach((path) => {
      // Reset every color/style baked into the source SVG
      path.removeAttribute('style');
      path.removeAttribute('fill');
      path.removeAttribute('stroke');
      path.removeAttribute('fill-opacity');
      path.removeAttribute('stroke-opacity');

      let bbox;
      try {
        bbox = path.getBBox();
      } catch {
        return;
      }
      if (!bbox || bbox.width < 4 || bbox.height < 4) {
        // Decorative thin line / negligible — keep invisible
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'none');
        return;
      }
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      let best = null;
      let bestDist = Infinity;
      for (const t of texts) {
        const d = squaredDist(cx, cy, t.x, t.y);
        if (d < bestDist) {
          bestDist = d;
          best = t;
        }
      }
      if (!best || Math.sqrt(bestDist) > MATCH_THRESHOLD) {
        path.setAttribute('fill', bgColor);
        path.setAttribute('stroke', fgColor);
        path.setAttribute('stroke-width', '0.4');
        path.setAttribute('opacity', '0.35');
        return;
      }

      const distrito = nameIndex.get(best.name);
      if (!distrito) return;
      path.setAttribute('data-distrito-id', distrito.id);
      path.style.cursor = 'pointer';
      path.style.transition = 'filter 180ms ease, stroke-width 180ms ease';
      identified++;
    });

    // Restyle text labels: hide subprefeituras (CAPS), keep district names mono+muted
    svg.querySelectorAll('text').forEach((t) => {
      const name = extractTextContent(t);
      if (!name || isSubprefeitura(name)) {
        t.style.display = 'none';
        return;
      }
      t.setAttribute('fill', fgColor);
      t.setAttribute('font-family', 'var(--font-mono)');
      t.setAttribute('font-size', '14');
      t.setAttribute('font-weight', '400');
      t.setAttribute('text-anchor', 'middle');
      t.style.pointerEvents = 'none';
      t.style.userSelect = 'none';
      // Also restyle tspans (which override attributes in source SVG)
      t.querySelectorAll('tspan').forEach((ts) => {
        ts.setAttribute('fill', fgColor);
        ts.setAttribute('font-family', 'var(--font-mono)');
        ts.setAttribute('font-size', '14');
        ts.removeAttribute('style');
      });
    });

    if (typeof window !== 'undefined') {
      console.log(`mapa-sp.svg: ${identified}/${paths.length} distritos identificados`);
    }
  }, [svgReady, nameIndex]);

  // Apply fills (re-runs on filter/resumo change)
  useEffect(() => {
    if (!svgReady || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const computed = getComputedStyle(document.documentElement);
    const fg = computed.getPropertyValue('--color-fg').trim();
    const bg = computed.getPropertyValue('--color-bg').trim();
    const medium = computed.getPropertyValue('--map-medium').trim();
    const far = computed.getPropertyValue('--map-far').trim();
    const muted = computed.getPropertyValue('--color-muted').trim();

    const hasWork = !!filters.bairroTrabalho;

    svg.querySelectorAll('path[data-distrito-id]').forEach((path) => {
      const id = path.getAttribute('data-distrito-id');
      const isWork = hasWork && id === filters.bairroTrabalho;

      const fill = isWork ? fg : bg;
      path.setAttribute('fill', fill);
      path.setAttribute('stroke', fg);
      path.setAttribute('stroke-width', '0.8');
      path.style.pointerEvents = 'auto';
      path.dataset.fillBase = fill;
    });

    svg.setAttribute('viewBox', '0 0 1200 1800');

    svg.querySelectorAll('text').forEach((t) => {
      const name = extractTextContent(t);
      if (!name || isSubprefeitura(name)) {
        t.style.display = 'none';
        return;
      }
      t.style.display = hasWork ? 'none' : '';
      if (!hasWork) {
        t.setAttribute('fill', muted);
        t.querySelectorAll('tspan').forEach((ts) => ts.setAttribute('fill', muted));
      }
    });
  }, [svgReady, filters.bairroTrabalho, themeTick]);

  // External hover (from list cards) → highlight matching path
  useEffect(() => {
    if (!svgReady || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    const fg = getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim();
    svg.querySelectorAll('path[data-distrito-id]').forEach((path) => {
      const id = path.getAttribute('data-distrito-id');
      if (hoveredId && id === hoveredId && id !== filters.bairroTrabalho) {
        path.setAttribute('fill', fg);
        path.setAttribute('stroke-width', '1.4');
      } else {
        const base = path.dataset.fillBase;
        if (base) path.setAttribute('fill', base);
        path.setAttribute('stroke-width', filters.bairroTrabalho ? '0.8' : '1');
      }
    });
  }, [svgReady, hoveredId, filters.bairroTrabalho]);

  // Hover/click delegation
  useEffect(() => {
    if (!svgReady || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const fgColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim() || '#000';

    const handleOver = (e) => {
      const el = e.target.closest('path[data-distrito-id]');
      if (!el) return;
      el.setAttribute('fill', fgColor);
      el.style.opacity = '0.85';
      el.setAttribute('stroke-width', '1.2');
      const id = el.getAttribute('data-distrito-id');
      const distrito = distritos.find((d) => d.id === id);
      const resumo = resumoById[id];
      setHovered({ id, nome: distrito?.nome, resumo });
    };
    const handleOut = (e) => {
      const el = e.target.closest('path[data-distrito-id]');
      if (!el) return;
      const base = el.dataset.fillBase;
      if (base) el.setAttribute('fill', base);
      el.style.opacity = '';
      el.setAttribute('stroke-width', '0.8');
      setHovered(null);
    };
    const handleMove = (e) => {
      if (!tooltipRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      tooltipRef.current.style.left = `${e.clientX - rect.left}px`;
      tooltipRef.current.style.top = `${e.clientY - rect.top}px`;
    };
    const handleClick = (e) => {
      const el = e.target.closest('path[data-distrito-id]');
      if (!el) return;
      if (onBairroClick) onBairroClick(el.getAttribute('data-distrito-id'));
    };

    svg.addEventListener('mouseover', handleOver);
    svg.addEventListener('mouseout', handleOut);
    svg.addEventListener('mousemove', handleMove);
    svg.addEventListener('click', handleClick);
    return () => {
      svg.removeEventListener('mouseover', handleOver);
      svg.removeEventListener('mouseout', handleOut);
      svg.removeEventListener('mousemove', handleMove);
      svg.removeEventListener('click', handleClick);
    };
  }, [svgReady, resumoById, onBairroClick]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.svgHost} aria-label="Mapa de São Paulo" />
      {hovered && (
        <div ref={tooltipRef} className={styles.tooltip}>
          <span className={styles.tooltipName}>{hovered.nome}</span>
          {hovered.resumo ? (
            <span className={styles.tooltipMeta}>
              {hovered.resumo.distanciaKm.toFixed(1)} km · {formatM2(getAluguelM2(hovered.id))}
            </span>
          ) : (
            <span className={styles.tooltipMeta}>{formatM2(getAluguelM2(hovered.id))}</span>
          )}
        </div>
      )}
    </div>
  );
}
