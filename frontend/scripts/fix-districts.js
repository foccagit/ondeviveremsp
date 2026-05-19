#!/usr/bin/env node
/**
 * FIX 1 + FIX 2 — Pré-bloco 3
 *
 * 1) Renomeia id "sao-miguel-paulista" -> "sao-miguel" (no bairros.json e
 *    distritos.json) e atualiza lat/lng com os valores do geocoded.
 * 2) Adiciona 3 distritos faltantes no bairros.json (cidade-tiradentes,
 *    jabaquara, sapopemba) com os mocks fornecidos pelo usuário e também os
 *    cadastra no distritos.json (sem svgName, pois não existem no Mapa_sp.svg).
 *
 * Mantém ordem alfabética por id em ambos os JSONs.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BAIRROS = path.join(ROOT, 'src', 'data', 'bairros.json');
const DISTRITOS = path.join(ROOT, 'src', 'data', 'distritos.json');
const GEOCODED = path.join(ROOT, 'public', 'data', 'bairros-geocoded.json');

const bairros = JSON.parse(fs.readFileSync(BAIRROS, 'utf8'));
const distritos = JSON.parse(fs.readFileSync(DISTRITOS, 'utf8'));
const geocodedRaw = JSON.parse(fs.readFileSync(GEOCODED, 'utf8'));
const geocoded = Array.isArray(geocodedRaw) ? geocodedRaw : Object.values(geocodedRaw);
const geoById = new Map(geocoded.map((g) => [g.id, g]));

// --- FIX 1: rename sao-miguel-paulista -> sao-miguel ---
const updatedBairros = bairros.map((b) => {
  if (b.id === 'sao-miguel-paulista') {
    const geo = geoById.get('sao-miguel');
    return {
      ...b,
      id: 'sao-miguel',
      lat: geo ? geo.lat : b.lat,
      lng: geo ? geo.lng : b.lng,
    };
  }
  return b;
});

const updatedDistritos = distritos.map((d) => {
  if (d.id === 'sao-miguel-paulista') {
    return { ...d, id: 'sao-miguel' };
  }
  return d;
});

// --- FIX 2: add 3 missing districts ---
const NEW = [
  {
    id: 'cidade-tiradentes',
    nome: 'Cidade Tiradentes',
    zona: 'leste',
    aluguelMedioM2: 22,
    condominioMedio: 200,
    renda: 2100,
    populacao: 211501,
    seguranca: 52,
    metro: false,
    vidaNoturna: 3,
    comercio: 4,
    parques: 5,
    descricao: 'Conjunto habitacional gigante na zona leste extrema. Periférico, populacional alto.',
    lat: -23.5934,
    lng: -46.3879,
    descricaoLonga:
      'Maior conjunto habitacional da América Latina, na divisa com Ferraz de Vasconcelos. Bairro popular de classe trabalhadora, com forte cultura local mas pouco comércio e infraestrutura. Acesso por trem (CPTM) ou Itaquera. Longe de tudo, mas com vida comunitária ativa.',
  },
  {
    id: 'jabaquara',
    nome: 'Jabaquara',
    zona: 'sul',
    aluguelMedioM2: 45,
    condominioMedio: 480,
    renda: 4800,
    populacao: 223780,
    seguranca: 68,
    metro: true,
    vidaNoturna: 5,
    comercio: 7,
    parques: 5,
    descricao: 'Subcentro sul tradicional, com metrô azul terminal. Misto residencial e comercial.',
    lat: -23.6533,
    lng: -46.6435,
    descricaoLonga:
      'Bairro tradicional da zona sul que cresceu com a estação terminal do metrô. Misto de residencial classe média e comércio popular. Próximo do aeroporto de Congonhas. Boa opção pra quem trabalha no centro e quer custo médio.',
  },
  {
    id: 'sapopemba',
    nome: 'Sapopemba',
    zona: 'leste',
    aluguelMedioM2: 28,
    condominioMedio: 250,
    renda: 2900,
    populacao: 296042,
    seguranca: 58,
    metro: false,
    vidaNoturna: 3,
    comercio: 6,
    parques: 4,
    descricao: 'Bairro popular extenso na zona leste, divisa com São Caetano. Sem metrô.',
    lat: -23.609,
    lng: -46.5197,
    descricaoLonga:
      'Um dos maiores distritos de São Paulo em população. Predominantemente residencial popular, com forte comércio local na Av. Sapopemba. Sem metrô, depende de ônibus e da proximidade com São Caetano do Sul. Comunidade forte e diversa.',
  },
];

// Override lat/lng for the 3 new entries with values from geocoded (if available)
for (const entry of NEW) {
  const geo = geoById.get(entry.id);
  if (geo) {
    entry.lat = geo.lat;
    entry.lng = geo.lng;
  }
}

// Align field order with existing entries
const KEY_ORDER = [
  'id', 'nome', 'zona', 'aluguelMedioM2', 'condominioMedio', 'renda',
  'populacao', 'seguranca', 'metro', 'vidaNoturna', 'comercio', 'parques',
  'descricao', 'lat', 'lng', 'descricaoLonga',
];
function alignKeys(obj) {
  const out = {};
  for (const k of KEY_ORDER) if (k in obj) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}
const newAligned = NEW.map(alignKeys);

const allBairros = [...updatedBairros, ...newAligned].sort((a, b) =>
  a.id.localeCompare(b.id)
);

const newDistritos = NEW.map((entry) => ({
  id: entry.id,
  nome: entry.nome,
  zona: entry.zona,
  svgName: null, // not present in mapa-sp.svg
}));

const allDistritos = [...updatedDistritos, ...newDistritos].sort((a, b) =>
  a.id.localeCompare(b.id)
);

fs.writeFileSync(BAIRROS, JSON.stringify(allBairros, null, 2) + '\n', 'utf8');
fs.writeFileSync(DISTRITOS, JSON.stringify(allDistritos, null, 2) + '\n', 'utf8');

console.log('bairros.json:', allBairros.length, 'entries');
console.log('distritos.json:', allDistritos.length, 'entries');
console.log('Renomeado: sao-miguel-paulista -> sao-miguel');
console.log('Adicionados:', NEW.map((n) => n.id).join(', '));
