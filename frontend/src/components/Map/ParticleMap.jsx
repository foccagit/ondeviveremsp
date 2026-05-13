'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './particle.module.css';

const SVG_URL = '/data/mapa-sp.svg';
const SVG_W = 1200;
const SVG_H = 1800;
const SVG_ASPECT = SVG_W / SVG_H;

const PARTICLE = 2;
const GAP = 5;
const CELL = PARTICLE + GAP;
const SCALE = 0.48;

const REPULSION_RADIUS = 90;
const REPULSION_FORCE = 1.6;
const SPRING = 0.08;
const DAMPING = 0.82;

const REVEAL_SCATTER = 260;
const REVEAL_VEL = 0.6;

const TRAFFIC_INTERVAL_MIN = 3500;
const TRAFFIC_INTERVAL_MAX = 6500;
const TRAFFIC_SPEED = 2.4;
const TRAFFIC_RADIUS = 22;
const TRAFFIC_FORCE = 0.35;

const RAIN_SPAWN_PER_FRAME = 0.18;
const RAIN_SPEED_MIN = 5;
const RAIN_SPEED_MAX = 9;
const RAIN_ANGLE = 0.32; // radians from vertical
const RAIN_HIT_RADIUS = 3.5;
const RAIN_LIT_DURATION = 140; // ms

const BG_ALPHA = 0.28;

function neutralize(svgText) {
  let out = svgText
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\sfill="[^"]*"/g, '')
    .replace(/\sstroke="[^"]*"/g, '')
    .replace(/\sfill-opacity="[^"]*"/g, '')
    .replace(/\sstroke-opacity="[^"]*"/g, '')
    .replace(/\sopacity="[^"]*"/g, '');
  const overrideStyle = `<style>
    * { fill: #000 !important; fill-opacity: 1 !important; stroke: none !important; opacity: 1 !important; }
    text, tspan { display: none !important; }
  </style>`;
  out = out.replace(/<svg([^>]*)>/, `<svg$1 fill="#000" stroke="none">${overrideStyle}`);
  return out;
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ParticleMap() {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const sampleDataRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const trafficRef = useRef([]);
  const rainRef = useRef([]);
  const rainAccumRef = useRef(0);
  const lastTrafficSpawnRef = useRef(0);
  const nextTrafficGapRef = useRef(TRAFFIC_INTERVAL_MIN);
  const colorsRef = useRef({ fg: '#000', muted: 'rgba(0,0,0,0.4)' });
  const [ready, setReady] = useState(false);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    let canceled = false;
    fetch(SVG_URL)
      .then((r) => r.text())
      .then((svgText) => {
        if (canceled) return;
        const blob = new Blob([neutralize(svgText)], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (canceled) {
            URL.revokeObjectURL(url);
            return;
          }
          const off = document.createElement('canvas');
          off.width = SVG_W;
          off.height = SVG_H;
          const octx = off.getContext('2d');
          octx.imageSmoothingEnabled = false;
          octx.fillStyle = '#ffffff';
          octx.fillRect(0, 0, SVG_W, SVG_H);
          octx.drawImage(img, 0, 0, SVG_W, SVG_H);
          sampleDataRef.current = octx.getImageData(0, 0, SVG_W, SVG_H);
          setReady(true);
          URL.revokeObjectURL(url);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, []);

  // Re-render when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((t) => t + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let rafId;
    let cols = 0;
    let rows = 0;
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const readColors = () => {
      const computed = getComputedStyle(document.documentElement);
      const fg = computed.getPropertyValue('--color-fg').trim() || '#000';
      const mutedHex = computed.getPropertyValue('--color-muted').trim() || '#6b6b6b';
      const muted = hexToRgba(mutedHex.startsWith('#') ? mutedHex : '#6b6b6b', BG_ALPHA);
      const bg = computed.getPropertyValue('--color-bg').trim() || '#ffffff';
      colorsRef.current = { fg, muted, bg };
    };

    const setup = () => {
      const data = sampleDataRef.current?.data;
      if (!data) return false;

      dpr = window.devicePixelRatio || 1;
      cssW = wrapper.clientWidth;
      if (cssW < 4) return false;

      cols = Math.max(1, Math.floor(cssW / CELL));
      const baseCols = cols;
      const baseRows = Math.floor(cols / SVG_ASPECT);
      const renderCols = Math.floor(baseCols * SCALE);
      const renderRows = Math.floor(baseRows * SCALE);
      const offCol = Math.floor((cols - renderCols) / 2);
      const offRow = 0;
      const extraRows = Math.ceil(30 / CELL);
      rows = renderRows + extraRows;
      cssH = rows * CELL;

      canvas.width = cols * CELL * dpr;
      canvas.height = rows * CELL * dpr;
      canvas.style.width = `${cols * CELL}px`;
      canvas.style.height = `${cssH}px`;

      readColors();

      const stepX = SVG_W / renderCols;
      const stepY = SVG_H / renderRows;

      const silhouetteSet = new Set();
      for (let row = 0; row < renderRows; row++) {
        const finalRow = offRow + row;
        if (finalRow < 0 || finalRow >= rows) continue;
        for (let col = 0; col < renderCols; col++) {
          const finalCol = offCol + col;
          if (finalCol < 0 || finalCol >= cols) continue;
          const sx = Math.min(SVG_W - 1, Math.floor((col + 0.5) * stepX));
          const sy = Math.min(SVG_H - 1, Math.floor((row + 0.5) * stepY));
          const idx = (sy * SVG_W + sx) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          const brightness = (r + g + b) / 3;
          if (a > 10 && brightness < 252) {
            silhouetteSet.add(finalRow * cols + finalCol);
          }
        }
      }

      const particles = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const isSilhouette = silhouetteSet.has(row * cols + col);
          const x = col * CELL;
          const y = row * CELL;
          if (isSilhouette) {
            const angle = Math.random() * Math.PI * 2;
            const dist = REVEAL_SCATTER * (0.4 + Math.random() * 0.6);
            const startX = x + Math.cos(angle) * dist;
            const startY = y + Math.sin(angle) * dist;
            particles.push({
              ox: x,
              oy: y,
              x: startX,
              y: startY,
              vx: (x - startX) * REVEAL_VEL * 0.02,
              vy: (y - startY) * REVEAL_VEL * 0.02,
              silhouette: true,
              litUntil: 0,
            });
          } else {
            particles.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, silhouette: false, litUntil: 0 });
          }
        }
      }
      particlesRef.current = particles;
      return true;
    };

    if (!setup()) return;

    const obs = new ResizeObserver(() => setup());
    obs.observe(wrapper);

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const ctx = canvas.getContext('2d');
    const radSq = REPULSION_RADIUS * REPULSION_RADIUS;

    const frame = () => {
      const now = performance.now();
      const { fg, muted, bg } = colorsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      // Spawn diagonal rain streaks
      rainAccumRef.current += RAIN_SPAWN_PER_FRAME;
      const toSpawnRain = Math.floor(rainAccumRef.current);
      rainAccumRef.current -= toSpawnRain;
      for (let k = 0; k < toSpawnRain; k++) {
        const speed = RAIN_SPEED_MIN + Math.random() * (RAIN_SPEED_MAX - RAIN_SPEED_MIN);
        rainRef.current.push({
          x: Math.random() * (cssW + 200) - 100,
          y: -10 - Math.random() * 40,
          vx: -Math.sin(RAIN_ANGLE) * speed,
          vy: Math.cos(RAIN_ANGLE) * speed,
        });
      }
      const rains = rainRef.current;
      const liveRain = [];
      for (let i = 0; i < rains.length; i++) {
        const r = rains[i];
        r.x += r.vx;
        r.y += r.vy;
        if (r.y > cssH + 20 || r.x < -100 || r.x > cssW + 100) continue;
        liveRain.push(r);
      }
      rainRef.current = liveRain;

      // Update traffic — spawn ambient horizontal streams
      const traffic = trafficRef.current;
      if (now - lastTrafficSpawnRef.current > nextTrafficGapRef.current) {
        const startSide = Math.random() < 0.5 ? 'left' : 'right';
        traffic.push({
          x: startSide === 'left' ? -40 : cssW + 40,
          y: cssH * (0.15 + Math.random() * 0.7),
          dir: startSide === 'left' ? 1 : -1,
        });
        lastTrafficSpawnRef.current = now;
        nextTrafficGapRef.current =
          TRAFFIC_INTERVAL_MIN + Math.random() * (TRAFFIC_INTERVAL_MAX - TRAFFIC_INTERVAL_MIN);
      }
      const liveTraffic = [];
      for (let i = 0; i < traffic.length; i++) {
        const t = traffic[i];
        t.x += TRAFFIC_SPEED * t.dir;
        if (t.dir === 1 && t.x > cssW + 80) continue;
        if (t.dir === -1 && t.x < -80) continue;
        liveTraffic.push(t);
      }
      trafficRef.current = liveTraffic;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const ps = particlesRef.current;
      const trafficRadSq = TRAFFIC_RADIUS * TRAFFIC_RADIUS;

      // Rain hit detection — mark particles near droplets
      const hitR2 = RAIN_HIT_RADIUS * RAIN_HIT_RADIUS;
      const cellRange = Math.ceil(RAIN_HIT_RADIUS / CELL);
      for (let i = 0; i < liveRain.length; i++) {
        const r = liveRain[i];
        const centerCol = Math.floor(r.x / CELL);
        const centerRow = Math.floor(r.y / CELL);
        for (let dr = -cellRange; dr <= cellRange; dr++) {
          const row = centerRow + dr;
          if (row < 0 || row >= rows) continue;
          for (let dc = -cellRange; dc <= cellRange; dc++) {
            const col = centerCol + dc;
            if (col < 0 || col >= cols) continue;
            const p = ps[row * cols + col];
            if (!p) continue;
            const dx = p.ox - r.x;
            const dy = p.oy - r.y;
            if (dx * dx + dy * dy < hitR2) {
              p.litUntil = now + RAIN_LIT_DURATION;
            }
          }
        }
      }

      const applyEffects = (p, mouseRepel) => {
        if (mouseRepel) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dSq = dx * dx + dy * dy;
          if (dSq < radSq) {
            const d = Math.sqrt(dSq) || 0.0001;
            const f = (1 - d / REPULSION_RADIUS) * REPULSION_FORCE;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        for (let k = 0; k < liveTraffic.length; k++) {
          const t = liveTraffic[k];
          const tdx = p.x - t.x;
          const tdy = p.y - t.y;
          const dSq = tdx * tdx + tdy * tdy;
          if (dSq < trafficRadSq) {
            const dist = Math.sqrt(dSq) || 0.0001;
            const f = (1 - dist / TRAFFIC_RADIUS) * TRAFFIC_FORCE;
            p.vx += t.dir * f;
            p.vy += (tdy / dist) * f * 0.4;
          }
        }
        p.vx += (p.ox - p.x) * SPRING;
        p.vy += (p.oy - p.y) * SPRING;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      };

      // First pass: bg particles (muted), collect lit ones
      ctx.fillStyle = muted;
      const litBg = [];
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (p.silhouette) continue;
        applyEffects(p, false);
        ctx.fillRect(p.x, p.y, PARTICLE, PARTICLE);
        if (p.litUntil > now) litBg.push(p);
      }
      // Overdraw lit bg in fg
      ctx.fillStyle = fg;
      for (let i = 0; i < litBg.length; i++) {
        const p = litBg[i];
        ctx.fillRect(p.x, p.y, PARTICLE, PARTICLE);
      }

      // Second pass: silhouette particles (fg)
      ctx.fillStyle = fg;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (!p.silhouette) continue;
        applyEffects(p, true);
        ctx.fillRect(p.x, p.y, PARTICLE, PARTICLE);
      }

      rafId = requestAnimationFrame(frame);
    };
    lastTrafficSpawnRef.current = performance.now();
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [ready, themeTick]);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
