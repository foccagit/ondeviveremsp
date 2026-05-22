#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BAIRROS_PATH = path.join(__dirname, '..', 'src', 'data', 'bairros.json');
const ALUGUEIS_PATH = path.join(__dirname, '..', 'src', 'data', 'alugueis_real.json');
const BACKUP_PATH = BAIRROS_PATH + '.bak.alugueis';

const bairros = JSON.parse(fs.readFileSync(BAIRROS_PATH, 'utf-8'));
const alugueis = JSON.parse(fs.readFileSync(ALUGUEIS_PATH, 'utf-8'));

// Validação: todo distrito do bairros.json precisa ter entry no alugueis_real.json
const faltando = bairros.filter((b) => !alugueis[b.id]);
if (faltando.length > 0) {
  console.error('ERRO: distritos sem correspondência em alugueis_real.json:');
  faltando.forEach((b) => console.error('  -', b.id));
  process.exit(1);
}

// Backup
fs.writeFileSync(BACKUP_PATH, JSON.stringify(bairros, null, 2), 'utf-8');
console.log('Backup criado:', BACKUP_PATH);

// Atualiza
let countReal = 0;
let countEstimado = 0;
const atualizado = bairros.map((b) => {
  const dados = alugueis[b.id];
  if (dados.aluguelFonte === 'real') countReal++;
  else countEstimado++;
  return {
    ...b,
    aluguelMedioM2: dados.aluguelMedioM2,
    aluguelFonte: dados.aluguelFonte,
  };
});

fs.writeFileSync(BAIRROS_PATH, JSON.stringify(atualizado, null, 2) + '\n', 'utf-8');

console.log('\nAtualizado bairros.json:');
console.log('  Reais:    ', countReal);
console.log('  Estimados:', countEstimado);
console.log('  Total:    ', countReal + countEstimado);

const amostras = ['pinheiros', 'itaim-bibi', 'tatuape', 'marsilac', 'moema', 'mooca', 'bom-retiro', 'cidade-ademar'];
console.log('\nAmostras:');
amostras.forEach((id) => {
  const b = atualizado.find((x) => x.id === id);
  if (b) console.log('  ' + id.padEnd(18) + ' R$ ' + b.aluguelMedioM2 + '/m² (' + b.aluguelFonte + ')');
});
