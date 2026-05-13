#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'mapa-sp.svg'), 'utf8');

// --- 1. Extract district labels (mixed case) and subprefeitura labels (uppercase) ---
const items = [];
const reText = /<text[^>]*>([\s\S]*?)<\/text>/g;
let m;
while ((m = reText.exec(svg))) {
  const block = m[0];
  const xMatch = block.match(/\bx="([\-0-9.]+)/);
  const yMatch = block.match(/\by="([\-0-9.]+)/);
  if (!xMatch || !yMatch) continue;
  const tspans = [...block.matchAll(/<tspan[^>]*>([^<]+)<\/tspan>/g)].map((x) => x[1]);
  const name = tspans.join(' ').replace(/\s+/g, ' ').trim();
  if (!name) continue;
  items.push({ x: +xMatch[1], y: +yMatch[1], name });
}

const isUpper = (s) => s === s.toUpperCase() && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(s);
const districts = items.filter((i) => !isUpper(i.name));

// --- 2. Manual name aliases (svg → canonical) ---
const NAME_ALIASES = {
  'S. Miguel Pta.': 'São Miguel Paulista',
  'Anhangüera': 'Anhanguera',
  'Capela do Socorro': 'Socorro',
};

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Dedupe by canonical name
const seen = new Map();
for (const d of districts) {
  const canonical = NAME_ALIASES[d.name] || d.name;
  if (!seen.has(canonical)) seen.set(canonical, { ...d, name: canonical, svgName: d.name });
}
const list = [...seen.values()];

// --- 3. Determine zona by SVG position ---
const xs = list.map((d) => d.x);
const ys = list.map((d) => d.y);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minY = Math.min(...ys), maxY = Math.max(...ys);
const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;

function zoneOf(lat, lng) {
  const CENTRO_LAT = -23.55;
  const CENTRO_LNG = -46.63;
  if (Math.abs(lat - CENTRO_LAT) < 0.025 && Math.abs(lng - CENTRO_LNG) < 0.025) return 'centro';
  const dLat = lat - CENTRO_LAT;
  const dLng = lng - CENTRO_LNG;
  if (Math.abs(dLat) > Math.abs(dLng)) return dLat > 0 ? 'norte' : 'sul';
  return dLng > 0 ? 'leste' : 'oeste';
}

// --- 4. Project SVG → lat/lng using anchor points ---
const ANCHORS = {
  'Itaim Bibi': { lat: -23.5836, lng: -46.6736 },
  'Santana': { lat: -23.5045, lng: -46.6259 },
  'Tatuapé': { lat: -23.5407, lng: -46.5763 },
  'Pinheiros': { lat: -23.5664, lng: -46.6896 },
  'Jardim Paulista': { lat: -23.5613, lng: -46.6565 },
  'Moema': { lat: -23.6011, lng: -46.6661 },
  'Itaquera': { lat: -23.5421, lng: -46.4587 },
  'Penha': { lat: -23.5276, lng: -46.5424 },
  'Freguesia do Ó': { lat: -23.5006, lng: -46.6973 },
  'Brasilândia': { lat: -23.4598, lng: -46.6845 },
};

function leastSquares(pairs, key) {
  // y = a*x + b where x = svg coord, y = real coord
  const n = pairs.length;
  const sx = pairs.reduce((s, p) => s + p.svg, 0);
  const sy = pairs.reduce((s, p) => s + p[key], 0);
  const sxy = pairs.reduce((s, p) => s + p.svg * p[key], 0);
  const sx2 = pairs.reduce((s, p) => s + p.svg * p.svg, 0);
  const a = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const b = (sy - a * sx) / n;
  return { a, b };
}

const xAnchors = [];
const yAnchors = [];
for (const d of list) {
  if (ANCHORS[d.name]) {
    xAnchors.push({ svg: d.x, lng: ANCHORS[d.name].lng });
    yAnchors.push({ svg: d.y, lat: ANCHORS[d.name].lat });
  }
}
const xFit = leastSquares(xAnchors, 'lng');
const yFit = leastSquares(yAnchors, 'lat');

// --- 5. Build economic profile based on zone + center distance ---
const NAMES_RICH = new Set([
  'Itaim Bibi', 'Jardim Paulista', 'Pinheiros', 'Moema', 'Alto de Pinheiros', 'Vila Olímpia',
  'Vila Mariana', 'Vila Madalena', 'Perdizes', 'Campo Belo', 'Morumbi', 'Santo Amaro',
  'Vila Leopoldina', 'Brooklin', 'Vila Sônia', 'Saúde', 'Consolação', 'Bela Vista',
  'Santa Cecília', 'Lapa',
]);
const NAMES_PERIF = new Set([
  'Marsilac', 'Parelheiros', 'Grajaú', 'Iguatemi', 'Lajeado', 'Guaianases', 'Jardim Helena',
  'Vila Curuçá', 'Itaim Paulista', 'Cidade Tiradentes', 'Jardim Ângela', 'Capão Redondo',
  'Pedreira', 'Cidade Ademar', 'Cidade Dutra', 'Jaraguá', 'Anhanguera', 'Perus',
  'Brasilândia', 'Cachoeirinha', 'São Mateus', 'São Rafael', 'José Bonifácio',
]);

const NAMES_WITH_METRO = new Set([
  'Sé', 'República', 'Liberdade', 'Bela Vista', 'Consolação', 'Santa Cecília',
  'Itaim Bibi', 'Pinheiros', 'Alto de Pinheiros', 'Vila Madalena', 'Jardim Paulista',
  'Moema', 'Vila Mariana', 'Saúde', 'Ipiranga', 'Sacomã', 'Vila Prudente',
  'Tatuapé', 'Carrão', 'Vila Matilde', 'Penha', 'Artur Alvim', 'Itaquera',
  'Guaianases', 'Brás', 'Belém', 'Mooca', 'Anália Franco', 'Tucuruvi', 'Santana',
  'Mandaqui', 'Brasilândia', 'Freguesia do Ó', 'Limão', 'Casa Verde', 'Lapa',
  'Barra Funda', 'Bom Retiro', 'Campo Belo', 'Santo Amaro', 'Butantã',
  'Capão Redondo', 'Vila Sônia',
]);

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function build(d) {
  const id = slugify(d.name);
  const lng = xFit.a * d.x + xFit.b;
  const lat = yFit.a * d.y + yFit.b;
  const zona = zoneOf(lat, lng);
  const rich = NAMES_RICH.has(d.name);
  const periph = NAMES_PERIF.has(d.name);
  const h = hash(d.name);
  const wobble = ((h % 100) / 100 - 0.5) * 2;

  let aluguelMedioM2, condominioMedio, renda, seguranca, vidaNoturna, comercio, parques;
  if (rich) {
    aluguelMedioM2 = 75 + Math.round(wobble * 18 + (h % 25));
    condominioMedio = 900 + Math.round((h % 7) * 60);
    renda = 13000 + (h % 8000);
    seguranca = 72 + Math.round(wobble * 6);
    vidaNoturna = 6 + (h % 4);
    comercio = 7 + (h % 3);
    parques = 4 + (h % 5);
  } else if (periph) {
    aluguelMedioM2 = 17 + Math.round(wobble * 5 + (h % 8));
    condominioMedio = 230 + Math.round((h % 5) * 30);
    renda = 2800 + (h % 1500);
    seguranca = 38 + Math.round(wobble * 8);
    vidaNoturna = 1 + (h % 3);
    comercio = 3 + (h % 3);
    parques = 2 + (h % 4);
  } else {
    aluguelMedioM2 = 38 + Math.round(wobble * 10 + (h % 15));
    condominioMedio = 500 + Math.round((h % 6) * 70);
    renda = 6000 + (h % 5000);
    seguranca = 58 + Math.round(wobble * 8);
    vidaNoturna = 3 + (h % 5);
    comercio = 5 + (h % 4);
    parques = 3 + (h % 5);
  }

  const populacao = 50000 + (h % 250000);
  const metro = NAMES_WITH_METRO.has(d.name);

  return {
    id,
    nome: d.name,
    zona,
    aluguelMedioM2,
    condominioMedio,
    renda,
    populacao,
    seguranca: Math.max(20, Math.min(95, seguranca)),
    metro,
    vidaNoturna: Math.max(0, Math.min(10, vidaNoturna)),
    comercio: Math.max(0, Math.min(10, comercio)),
    parques: Math.max(0, Math.min(10, parques)),
    descricao: descricaoFor(d.name, zona, rich, periph, metro),
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    svgName: d.svgName,
  };
}

function descricaoFor(nome, zona, rich, periph, metro) {
  const overrides = {
    'Itaim Bibi': 'Coração corporativo e gastronômico. Caro, movimentado, vida noturna intensa.',
    'Jardim Paulista': 'Endereço clássico da elite. Arborizado, restaurantes estrelados e grifes.',
    'Pinheiros': 'Boêmio e criativo. Bares, lojas independentes e cafés especiais.',
    'Vila Mariana': 'Equilibrado, próximo ao Ibirapuera, metrô azul e ar familiar.',
    'Moema': 'Residencial e arborizado, próximo ao Ibirapuera. Famílias de alta renda.',
    'Perdizes': 'Residencial e tradicional. Boas escolas, padarias clássicas, sem metrô.',
    'Vila Madalena': 'Boêmia, Beco do Batman e bares lotados nos fins de semana.',
    'Consolação': 'Augusta, baladas, cultura LGBTQ+. Vida noturna intensa.',
    'Bela Vista': 'Bixiga, cantinas italianas, teatros. Centro vibrante mas urbano.',
    'Liberdade': 'Bairro oriental tradicional. Feira de domingo e cultura asiática.',
    'Sé': 'Centro histórico. Densidade alta, comércio popular e problemas urbanos.',
    'República': 'Centro alternativo, ocupações culturais, transporte privilegiado.',
    'Tatuapé': 'Polo comercial da zona leste. Shoppings e prédios novos no metrô vermelho.',
    'Mooca': 'Tradição italiana, cantinas e clima de bairro com verticalização rápida.',
    'Santana': 'Coração da zona norte. Linha azul, comércio forte e Parque da Juventude.',
    'Tucuruvi': 'Residencial classe média, fim da linha azul do metrô.',
    'Lapa': 'Comercial e operário-classe média. Mercado da Lapa e CPTM.',
    'Butantã': 'Universitário, próximo à USP. Mistura intelectualidade e ruas residenciais.',
    'Morumbi': 'Verticalizado e elitizado, com favelas vizinhas. Estádio do São Paulo.',
    'Santo Amaro': 'Subcentro do sul, igreja matriz, comércio antigo e Marginal Pinheiros.',
    'Campo Belo': 'Residencial alto padrão, próximo ao aeroporto de Congonhas.',
    'Brooklin': 'Empresarial moderno, executivos e ciclovias. Falta metrô próprio.',
    'Vila Olímpia': 'Polo de agências e startups. Vida noturna sem metrô.',
    'Ipiranga': 'Histórico (independência), residencial tradicional, metrô verde.',
    'Sacomã': 'Acesso por metrô verde, terminal de ônibus, classe média.',
    'Vila Prudente': 'Subcentro leste com metrô prata recente. Verticalizando.',
    'Penha': 'Comercial e religioso. Largo da Penha, metrô vermelho e clima popular.',
    'Itaquera': 'Polo da zona leste com Arena, parque do Carmo e metrô vermelho.',
    'Brasilândia': 'Periferia norte com nova linha laranja. Densidade alta e relevo acidentado.',
    'Freguesia do Ó': 'Tradicional zona norte com linha laranja chegando. Comércio popular.',
    'Casa Verde': 'Zona norte residencial, ponte para o centro, comércio local forte.',
    'Cachoeirinha': 'Periferia norte densa, vida cultural forte, sem metrô direto.',
    'Pirituba': 'Residencial e popular. CPTM serve mas trânsito é gargalo.',
    'Anhanguera': 'Extremo noroeste, atravessada pela rodovia. Mais rural que urbano.',
    'Perus': 'Extremo norte, núcleo histórico isolado, CPTM funciona.',
    'Jaraguá': 'Pico do Jaraguá, mistura periferia com mata atlântica.',
    'Grajaú': 'Maior distrito de SP em população. Próximo à represa Billings.',
    'Cidade Dutra': 'Zona sul extrema, próximo à Billings. Sem metrô.',
    'Marsilac': 'Distrito mais rural de SP, mata atlântica e pequenas chácaras.',
    'Parelheiros': 'Verde, rural, áreas de proteção ambiental e turismo de natureza.',
    'Capão Redondo': 'Periferia sul, forte cena cultural e hip-hop, metrô na borda.',
    'Jardim Ângela': 'Periferia sul extrema. Aluguel entre os mais baixos.',
    'Jardim São Luís': 'Adjacente ao Jardim Ângela, periferia sul, sem metrô.',
    'Cidade Ademar': 'Sul, residencial popular, próximo a Diadema.',
    'Pedreira': 'Sul, residencial periférico, longe do metrô.',
    'São Mateus': 'Subcentro da zona leste, monotrilho prata em construção.',
    'São Rafael': 'Leste extremo, residencial popular, CPTM.',
    'Iguatemi': 'Leste extremo próximo à Mogi, sem metrô.',
    'Lajeado': 'Periferia leste, vizinha de Guaianases.',
    'Guaianases': 'Subcentro leste, CPTM, forte identidade nordestina.',
    'Jardim Helena': 'Periferia leste, longe do centro, sem metrô.',
    'Vila Curuçá': 'Periferia leste extrema, sem metrô.',
    'Itaim Paulista': 'Periferia leste, terminal de ônibus, CPTM.',
    'São Miguel Paulista': 'Subcentro leste com CPTM e comércio forte.',
    'Cangaíba': 'Leste perto da Penha, residencial popular.',
    'Ermelino Matarazzo': 'Periferia leste com CPTM. Comércio local.',
    'Ponte Rasa': 'Leste residencial, próximo à Penha.',
    'Vila Matilde': 'Leste com metrô vermelho, classe média popular.',
    'Carrão': 'Leste, metrô vermelho, residencial classe média.',
    'Aricanduva': 'Shopping Aricanduva, leste comercial.',
    'Vila Formosa': 'Leste classe média baixa, sem metrô direto.',
    'Cidade Líder': 'Leste residencial periférico.',
    'José Bonifácio': 'Leste residencial periférico, perto de Itaquera.',
    'Parque do Carmo': 'Leste com o segundo maior parque da cidade.',
    'Artur Alvim': 'Leste com metrô vermelho, residencial popular.',
    'Vila Jacuí': 'Leste periferia densa, sem metrô.',
    'Vila Maria': 'Norte, próximo à rodoviária do Tietê.',
    'Vila Guilherme': 'Comercial e logístico próximo à Marginal Tietê.',
    'Vila Medeiros': 'Norte residencial popular.',
    'Mandaqui': 'Norte classe média, perto do Horto Florestal.',
    'Tremembé': 'Norte com Serra da Cantareira, residencial verde.',
    'Jaçanã': 'Norte, residencial popular, ponte importante do trem-bala.',
    'Limão': 'Norte comercial, perto da Marginal Tietê.',
    'Bom Retiro': 'Centro, polo coreano e judaico, comércio têxtil.',
    'Pari': 'Centro, indústria têxtil tradicional, atacadistas.',
    'Brás': 'Centro do comércio popular paulistano, atacadistas roupas.',
    'Belém': 'Centro leste, tradicional, sede do parque Dom Pedro.',
    'Cambuci': 'Centro-sul tradicional, ladeiras e arquitetura antiga.',
    'Santa Cecília': 'Centro residencial verticalizado, próximo ao Higienópolis.',
    'Barra Funda': 'Centro-oeste com estação multimodal, polo cultural.',
    'Água Rasa': 'Leste residencial, próximo à Mooca.',
    'Cursino': 'Sul próximo ao Ipiranga, residencial.',
    'Saúde': 'Sul, tranquilo, metrô azul, boa relação custo-benefício.',
    'Alto de Pinheiros': 'Residencial nobre próximo ao Villa-Lobos.',
    'Vila Leopoldina': 'Oeste em transformação, novos prédios e shoppings.',
    'Vila Sônia': 'Oeste residencial, fim da linha amarela do metrô.',
    'Vila Andrade': 'Sul-oeste com torres altas e favela do Paraisópolis vizinha.',
    'Rio Pequeno': 'Oeste próximo à Raposo Tavares, residencial popular.',
    'Raposo Tavares': 'Oeste próximo à rodovia homônima.',
    'Jaguaré': 'Oeste industrial e residencial, perto da USP.',
    'Jaguara': 'Oeste, residencial perto da Marginal Tietê.',
    'São Domingos': 'Noroeste residencial popular.',
    'Socorro': 'Sul, residencial, próximo a Santo Amaro.',
    'Campo Limpo': 'Sul periférico denso, metrô lilás.',
    'Campo Grande': 'Sul classe média baixa.',
  };
  if (overrides[nome]) return overrides[nome];
  const partes = [];
  if (rich) partes.push('Bairro de renda mais alta');
  else if (periph) partes.push('Periferia');
  else partes.push('Bairro de perfil misto');
  partes.push(`da zona ${zona}`);
  if (metro) partes.push('com acesso de metrô');
  else partes.push('sem metrô direto');
  return partes.join(' ') + '. Dados estimados.';
}

const bairros = list.map(build).sort((a, b) => a.nome.localeCompare(b.nome));

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'bairros.json'),
  JSON.stringify(bairros.map(({ svgName, ...rest }) => rest), null, 2)
);

const distritos = bairros.map((b) => ({ id: b.id, nome: b.nome, zona: b.zona, svgName: b.svgName }));
fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'distritos.json'),
  JSON.stringify(distritos, null, 2)
);

console.log('wrote', bairros.length, 'districts');
console.log('zones:', bairros.reduce((acc, b) => { acc[b.zona] = (acc[b.zona]||0)+1; return acc; }, {}));
console.log('with metro:', bairros.filter(b => b.metro).length);
