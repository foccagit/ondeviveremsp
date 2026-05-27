'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import distritos from '@/data/distritos.json';
import styles from './styles.module.css';

const SVG_URL = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/mapa-sp.svg`;
const MATCH_THRESHOLD = 70;

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

// Mapa é representativo da lista — não recebe interação direta.
// Hover só vem de fora (cards da lista) via prop `hoveredId`.
export default function Map({ filters, hoveredId }) {
  const containerRef = useRef(null);
  const [svgReady, setSvgReady] = useState(false);
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

        // Strip embedded inline fills/strokes/opacity from <g> wrappers — sem
        // isso a opacidade herdada deixa o preto parecendo cinza nos paths.
        svg.querySelectorAll('g').forEach((g) => {
          g.removeAttribute('fill');
          g.removeAttribute('stroke');
          g.removeAttribute('style');
          g.removeAttribute('opacity');
          g.removeAttribute('fill-opacity');
          g.removeAttribute('stroke-opacity');
        });
        svg.removeAttribute('opacity');
        svg.removeAttribute('fill-opacity');

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
      path.removeAttribute('opacity');

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
      path.style.cursor = 'default';
      path.style.pointerEvents = 'none';
      path.style.transition = 'stroke-width 180ms ease';
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

  // Apply fills (re-runs on filter change / theme change)
  useEffect(() => {
    if (!svgReady || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const computed = getComputedStyle(document.documentElement);
    const fg = computed.getPropertyValue('--color-fg').trim();
    const bg = computed.getPropertyValue('--color-bg').trim();
    const muted = computed.getPropertyValue('--color-muted').trim();

    const hasWork = !!filters.bairroTrabalho;

    svg.querySelectorAll('path[data-distrito-id]').forEach((path) => {
      const id = path.getAttribute('data-distrito-id');
      const isWork = hasWork && id === filters.bairroTrabalho;

      const fill = isWork ? fg : bg;
      path.setAttribute('fill', fill);
      path.setAttribute('fill-opacity', '1');
      path.setAttribute('opacity', '1');
      path.setAttribute('stroke', fg);
      path.setAttribute('stroke-width', '0.8');
      path.style.pointerEvents = 'none';
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

  // External hover (from list cards) → highlight matching path in solid black
  useEffect(() => {
    if (!svgReady || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('path[data-distrito-id]').forEach((path) => {
      const id = path.getAttribute('data-distrito-id');
      if (hoveredId && id === hoveredId && id !== filters.bairroTrabalho) {
        path.setAttribute('fill', '#000000');
        path.setAttribute('fill-opacity', '1');
        path.setAttribute('opacity', '1');
        path.setAttribute('stroke-width', '1.4');
      } else {
        const base = path.dataset.fillBase;
        if (base) path.setAttribute('fill', base);
        path.removeAttribute('fill-opacity');
        path.setAttribute('stroke-width', filters.bairroTrabalho ? '0.8' : '1');
      }
    });
  }, [svgReady, hoveredId, filters.bairroTrabalho]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.svgHost} aria-label="Mapa de São Paulo" />
    </div>
  );
}
