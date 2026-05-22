#!/usr/bin/env node
/**
 * BLOCO 2 — Atualiza lat/lng do bairros.json com valores reais do
 * bairros-geocoded.json e remove o campo "pois".
 *
 * Regras (estritas):
 *  - SÓ altera lat, lng e remove "pois"
 *  - Mantém todos os outros campos intactos, na MESMA ORDEM
 *  - Bairros sem match no geocoded mantém o lat/lng atual (reportado)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'data', 'bairros.json');
const GEO = path.join(ROOT, 'public', 'data', 'bairros-geocoded.json');

const bairros = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const geocodedRaw = JSON.parse(fs.readFileSync(GEO, 'utf8'));
const geocoded = Array.isArray(geocodedRaw) ? geocodedRaw : Object.values(geocodedRaw);

const geoById = new Map(geocoded.map((g) => [g.id, g]));

const stats = { updated: 0, removedPois: 0, noMatch: [] };

const updated = bairros.map((b) => {
  const out = {};
  for (const key of Object.keys(b)) {
    if (key === 'pois') {
      stats.removedPois++;
      continue; // drop
    }
    if (key === 'lat' || key === 'lng') {
      const match = geoById.get(b.id);
      if (match && typeof match[key] === 'number') {
        out[key] = match[key];
      } else {
        out[key] = b[key]; // preserve existing if no match
      }
    } else {
      out[key] = b[key];
    }
  }
  const match = geoById.get(b.id);
  if (match) {
    stats.updated++;
  } else {
    stats.noMatch.push(b.id);
  }
  return out;
});

fs.writeFileSync(SRC, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log(`bairros atualizados (lat/lng): ${stats.updated}/${bairros.length}`);
console.log(`campo "pois" removido de: ${stats.removedPois} bairros`);
if (stats.noMatch.length > 0) {
  console.log(`sem match no geocoded (lat/lng preservado): ${stats.noMatch.join(', ')}`);
}
