#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '../src/data/bairros.json');
const bairros = JSON.parse(fs.readFileSync(file, 'utf8'));

const METRO_REAIS = {
  'alto-de-pinheiros': ['Vila Madalena'],
  'butanta': ['Butantã'],
  'vila-leopoldina': ['Vila Leopoldina'],
  'pinheiros': ['Pinheiros', 'Faria Lima', 'Fradique Coutinho'],
  'itaim-bibi': ['Faria Lima'],
  'jardins': ['Consolação', 'Trianon-MASP'],
  'consolacao': ['Consolação', 'Higienópolis-Mackenzie'],
  'higienopolis': ['Higienópolis-Mackenzie', 'Santa Cecília'],
  'santa-cecilia': ['Santa Cecília', 'Marechal Deodoro'],
  'republica': ['República', 'Anhangabaú', 'São Bento'],
  'se': ['Sé', 'Anhangabaú'],
  'liberdade': ['Liberdade', 'São Joaquim'],
  'bela-vista': ['Trianon-MASP', 'Brigadeiro', 'Paraíso'],
  'paraiso': ['Paraíso', 'Brigadeiro', 'Vergueiro'],
  'vila-mariana': ['Vila Mariana', 'Ana Rosa'],
  'saude': ['Saúde', 'São Judas', 'Praça da Árvore'],
  'campo-belo': ['Brooklin', 'Campo Belo'],
  'brooklin': ['Brooklin'],
  'moema': ['Moema', 'AACD-Servidor', 'Eucaliptos'],
  'mooca': ['Bresser-Mooca', 'Belém'],
  'tatuape': ['Tatuapé', 'Carrão'],
  'penha': ['Penha'],
  'vila-prudente': ['Vila Prudente', 'Tamanduateí'],
  'ipiranga': ['Sacomã', 'Tamanduateí'],
  'sacoma': ['Sacomã'],
  'jabaquara': ['Jabaquara', 'Conceição'],
  'aclimacao': ['Vergueiro', 'Paraíso'],
  'cambuci': ['São Joaquim'],
  'barra-funda': ['Barra Funda', 'Marechal Deodoro'],
  'lapa': ['Lapa', 'Palmeiras-Barra Funda'],
  'agua-branca': ['Palmeiras-Barra Funda'],
  'perdizes': ['Marechal Deodoro', 'Santa Cecília'],
  'vila-madalena': ['Vila Madalena'],
  'sumare': ['Sumaré'],
  'jardim-paulista': ['Consolação', 'Oscar Freire', 'Trianon-MASP'],
  'itaquera': ['Itaquera', 'Corinthians-Itaquera'],
  'guaianases': ['Guaianases'],
  'sao-mateus': ['São Mateus'],
  'artur-alvim': ['Artur Alvim'],
  'vila-matilde': ['Vila Matilde'],
  'belem': ['Belém', 'Bresser-Mooca'],
  'bras': ['Brás', 'Pedro II'],
  'pari': ['Tiradentes'],
  'bom-retiro': ['Tiradentes', 'Luz'],
  'santana': ['Santana', 'Carandiru'],
  'casa-verde': ['Portuguesa-Tietê'],
  'limao': ['Vila Maria'],
  'tucuruvi': ['Tucuruvi', 'Parada Inglesa'],
  'jacana': ['Jaçanã'],
  'vila-guilherme': ['Tietê'],
  'vila-formosa': ['Vila Matilde'],
  'cidade-tiradentes': [],
  'iguatemi': [],
  'lajeado': ['Guaianases'],
  'parelheiros': [],
  'marsilac': [],
  'graja': [],
  'campo-limpo': ['Campo Limpo'],
  'capao-redondo': ['Capão Redondo'],
  'jardim-angela': [],
  'jardim-sao-luis': [],
  'cidade-dutra': [],
  'pedreira': [],
  'socorro': ['Socorro'],
  'cursino': ['Alto do Ipiranga'],
  'sao-lucas': ['Vila Prudente'],
  'sapopemba': [],
  'vila-andrade': [],
  'morumbi': ['Morumbi'],
  'rio-pequeno': [],
  'raposo-tavares': [],
  'vila-sonia': ['Vila Sônia', 'São Paulo-Morumbi'],
  'jaguara': [],
  'jaguare': [],
  'sao-domingos': [],
  'pirituba': ['Vila Cardim'],
  'jaragua': ['Jaraguá'],
  'sao-rafael': [],
  'aricanduva': [],
  'carrao': ['Carrão'],
  'vila-medeiros': ['Vila Medeiros'],
  'jardim-sao-paulo': ['Jardim São Paulo-Ayrton Senna'],
  'mandaqui': ['Parada Inglesa'],
  'tremembe': [],
  'brasilandia': [],
  'cachoeirinha': [],
  'freguesia-do-o': ['Freguesia do Ó'],
  'agua-rasa': [],
};

const PARQUES_REAIS = {
  'ibirapuera': ['Parque do Ibirapuera'],
  'moema': ['Parque do Ibirapuera'],
  'vila-mariana': ['Parque do Ibirapuera'],
  'jardim-paulista': ['Parque Trianon'],
  'consolacao': ['Parque Trianon'],
  'pinheiros': ['Praça Benedito Calixto'],
  'alto-de-pinheiros': ['Parque Villa-Lobos'],
  'vila-leopoldina': ['Parque Villa-Lobos'],
  'lapa': ['Parque da Água Branca'],
  'agua-branca': ['Parque da Água Branca'],
  'barra-funda': ['Parque da Água Branca', 'Memorial da América Latina'],
  'butanta': ['Parque Previdência', 'Praça Pôr do Sol'],
  'morumbi': ['Parque Burle Marx'],
  'vila-sonia': ['Parque do Povo'],
  'itaim-bibi': ['Parque do Povo'],
  'aclimacao': ['Parque da Aclimação'],
  'cambuci': ['Parque da Aclimação'],
  'ipiranga': ['Parque da Independência'],
  'sacoma': ['Parque do Estado'],
  'cursino': ['Parque do Estado'],
  'vila-prudente': ['Parque Ceret'],
  'tatuape': ['Parque Ceret', 'Parque do Piqueri'],
  'aricanduva': ['Parque do Carmo'],
  'sao-mateus': ['Parque do Carmo'],
  'itaquera': ['Parque do Carmo'],
  'penha': ['Parque Linear do Tiquatira'],
  'santana': ['Parque da Juventude', 'Horto Florestal'],
  'tucuruvi': ['Horto Florestal'],
  'jacana': ['Horto Florestal'],
  'tremembe': ['Horto Florestal', 'Parque do Estado'],
  'mandaqui': ['Horto Florestal'],
  'jaragua': ['Parque Estadual do Jaraguá'],
  'pirituba': ['Parque Estadual do Jaraguá'],
  'perdizes': ['Praça Charles Miller'],
  'higienopolis': ['Praça Buenos Aires'],
  'santa-cecilia': ['Praça Marechal Deodoro'],
  'vila-madalena': ['Beco do Batman'],
  'sumare': ['Parque das Corujas'],
  'campo-belo': ['Parque do Powell'],
  'brooklin': ['Parque do Bixiga'],
  'parelheiros': ['Parque Estadual Serra do Mar'],
  'marsilac': ['Parque Estadual Serra do Mar'],
  'jaguare': ['Parque Raposo Tavares'],
  'raposo-tavares': ['Parque Raposo Tavares'],
  'lajeado': ['Parque do Carmo'],
  'cidade-tiradentes': ['Parque do Carmo'],
};

const HOSPITAIS_REAIS = {
  'morumbi': ['Hosp. Albert Einstein'],
  'vila-sonia': ['Hosp. Albert Einstein'],
  'butanta': ['Hosp. Universitário USP'],
  'pinheiros': ['Hosp. das Clínicas'],
  'cerqueira-cesar': ['Hosp. das Clínicas', 'Hosp. Sírio-Libanês'],
  'bela-vista': ['Hosp. Sírio-Libanês', 'Santa Casa'],
  'higienopolis': ['Santa Casa'],
  'santa-cecilia': ['Santa Casa'],
  'jardim-paulista': ['Hosp. 9 de Julho'],
  'paraiso': ['Hosp. São Camilo', 'Hosp. Beneficência Portuguesa'],
  'aclimacao': ['Hosp. Beneficência Portuguesa'],
  'ipiranga': ['Hosp. Heliópolis', 'Hosp. Ipiranga'],
  'vila-mariana': ['Hosp. São Paulo (UNIFESP)'],
  'paulista': ['Hosp. Santa Catarina'],
  'consolacao': ['Hosp. Samaritano'],
  'tatuape': ['Hosp. São Camilo'],
  'mooca': ['Hosp. Alemão Oswaldo Cruz'],
  'jardins': ['Hosp. Alemão Oswaldo Cruz'],
  'moema': ['Hosp. Servidor Público'],
  'campo-belo': ['Hosp. São Luiz'],
  'itaim-bibi': ['Hosp. São Luiz'],
  'lapa': ['Hosp. São Camilo Pompéia'],
  'perdizes': ['Hosp. São Camilo Pompéia'],
  'santana': ['Hosp. Edmundo Vasconcelos'],
  'penha': ['Hosp. Santa Marcelina'],
  'itaquera': ['Hosp. Santa Marcelina'],
  'sao-mateus': ['Hosp. Mun. Tide Setúbal'],
  'capao-redondo': ['Hosp. Mun. Campo Limpo'],
  'campo-limpo': ['Hosp. Mun. Campo Limpo'],
  'jabaquara': ['Hosp. Saboya'],
};

const SHOPPINGS_REAIS = {
  'moema': ['Shopping Ibirapuera'],
  'vila-mariana': ['Shopping Plaza Sul'],
  'itaim-bibi': ['Shopping JK Iguatemi'],
  'jardim-paulista': ['Shopping Iguatemi São Paulo'],
  'jardins': ['Shopping Cidade Jardim'],
  'morumbi': ['Shopping Morumbi', 'Shopping Cidade Jardim'],
  'vila-sonia': ['Shopping Morumbi'],
  'brooklin': ['Shopping Market Place'],
  'campo-belo': ['Shopping Ibirapuera'],
  'pinheiros': ['Shopping Eldorado'],
  'alto-de-pinheiros': ['Shopping Villa-Lobos'],
  'vila-leopoldina': ['Shopping Villa-Lobos', 'Shopping Bourbon'],
  'lapa': ['Bourbon Shopping', 'West Plaza'],
  'agua-branca': ['West Plaza'],
  'barra-funda': ['Shopping Bourbon'],
  'butanta': ['Shopping Continental', 'Shopping Butantã'],
  'tatuape': ['Shopping Anália Franco', 'Shopping Metrô Tatuapé'],
  'mooca': ['Mooca Plaza Shopping'],
  'ipiranga': ['Shopping Plaza Sul'],
  'santana': ['Center Norte', 'Shopping Santana Parque'],
  'casa-verde': ['Center Norte'],
  'penha': ['Shopping Penha'],
  'itaquera': ['Shopping Metrô Itaquera', 'Shopping Itaquera'],
  'sao-mateus': ['Shopping Aricanduva'],
  'aricanduva': ['Shopping Aricanduva'],
  'jabaquara': ['Shopping Plaza Sul'],
  'saude': ['Shopping Plaza Sul'],
  'pirituba': ['Tietê Plaza Shopping'],
  'freguesia-do-o': ['Tietê Plaza Shopping'],
  'campo-limpo': ['Shopping Campo Limpo'],
  'capao-redondo': ['Shopping Campo Limpo'],
  'jardim-sao-luis': ['Shopping Campo Limpo'],
};

function describePerfil(b) {
  const renda = b.renda || 0;
  if (renda > 12000) return 'executivos e famílias de alta renda';
  if (renda > 7000) return 'famílias de classe média e profissionais jovens';
  if (renda > 4500) return 'classe média trabalhadora e famílias estabelecidas';
  return 'famílias trabalhadoras';
}

function describeAluguel(b) {
  const a = b.aluguelMedioM2;
  if (a >= 70) return 'aluguel alto, entre os mais caros da cidade';
  if (a >= 50) return 'aluguel acima da média paulistana';
  if (a >= 35) return 'aluguel na média da cidade';
  if (a >= 25) return 'aluguel acessível';
  return 'aluguel baixo';
}

function describeVibes(b) {
  const parts = [];
  if (b.comercio >= 8) parts.push('comércio forte');
  else if (b.comercio >= 5) parts.push('comércio médio');
  else parts.push('comércio limitado');
  if (b.vidaNoturna >= 7) parts.push('vida noturna animada');
  else if (b.vidaNoturna >= 4) parts.push('alguns bares e restaurantes');
  else parts.push('sem grande vida noturna');
  if (b.parques >= 7) parts.push('boa oferta de áreas verdes');
  else if (b.parques >= 4) parts.push('alguns parques');
  return parts.join(', ');
}

function describeSeguranca(b) {
  if (b.seguranca >= 75) return 'percepção de segurança alta';
  if (b.seguranca >= 55) return 'segurança razoável';
  if (b.seguranca >= 40) return 'segurança variável';
  return 'segurança preocupante em algumas áreas';
}

function describeMetro(b) {
  return b.metro ? 'Atendido por estações de metrô.' : 'Sem estação de metrô — depende de ônibus.';
}

function genericParque(b) {
  if (b.parques >= 7) return ['Praça local', 'Áreas verdes próximas'];
  if (b.parques >= 4) return ['Praça local'];
  return [];
}

function genericHospital(b) {
  if (b.renda > 8000) return ['Unidades de saúde particulares próximas'];
  if (b.renda > 4000) return ['UBS local', 'Hospital municipal próximo'];
  return ['UBS local'];
}

function genericShopping(b) {
  if (b.comercio >= 8) return ['Shopping de bairro'];
  return [];
}

function tier(b) {
  if (b.renda >= 12000 || b.aluguelMedioM2 >= 60) return 'nobre';
  if (b.renda >= 7000 || b.aluguelMedioM2 >= 40) return 'medio';
  return 'popular';
}

function poisFor(b) {
  const t = tier(b);
  const supermercados =
    t === 'nobre' ? 14 + (b.comercio || 0) : t === 'medio' ? 8 + Math.round(b.comercio / 2) : 5;
  const barRestaurantes =
    t === 'nobre' ? 80 + b.vidaNoturna * 10 : t === 'medio' ? 35 + b.vidaNoturna * 6 : 12 + b.vidaNoturna * 3;

  const parques = PARQUES_REAIS[b.id] || genericParque(b);
  const hospitais = HOSPITAIS_REAIS[b.id] || genericHospital(b);
  const shoppings = SHOPPINGS_REAIS[b.id] || genericShopping(b);
  const metroEstacoes = METRO_REAIS[b.id] || (b.metro ? ['Estação local'] : []);

  return {
    metroEstacoes,
    supermercados,
    barRestaurantes,
    parques,
    hospitais,
    shoppings,
  };
}

function descricaoLongaFor(b) {
  const perfil = describePerfil(b);
  const aluguel = describeAluguel(b);
  const vibes = describeVibes(b);
  const seguranca = describeSeguranca(b);
  const metroFrase = describeMetro(b);
  return `${b.descricao} Bairro da zona ${b.zona} com perfil de moradores formado principalmente por ${perfil}. ${capitalize(aluguel)}, ${vibes}. ${capitalize(seguranca)}. ${metroFrase}`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let count = 0;
for (const b of bairros) {
  if (!b.descricaoLonga) {
    b.descricaoLonga = descricaoLongaFor(b);
    count++;
  }
  if (!b.pois) {
    b.pois = poisFor(b);
  }
}

fs.writeFileSync(file, JSON.stringify(bairros, null, 2) + '\n');
console.log(`Augmented ${count} bairros (total: ${bairros.length}).`);
