const brl0 = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const num0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function formatBRL(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return brl0.format(Math.round(value));
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return num0.format(Math.round(value));
}

export function formatM2(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${brl0.format(Math.round(value))}/m²`;
}

export function formatScore(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)}/100`;
}

export function formatBool(value) {
  return value ? 'sim' : 'não';
}
