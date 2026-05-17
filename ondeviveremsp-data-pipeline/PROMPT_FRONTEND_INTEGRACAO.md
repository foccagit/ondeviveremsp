# Prompt — Integrar Dados Reais do Google ao Frontend

Use depois de rodar os 3 scripts Python (01_geocode, 02_distances, 03_places) e ter os arquivos JSON em `frontend/public/data/`.

---

```
Vamos integrar dados reais ao frontend. Os arquivos JSON gerados pelo pipeline Python já estão em frontend/public/data/:

- distancias.json: matriz 96x96 com distância e tempo real entre todos os bairros (Google Distance Matrix)
- pois.json: POIs reais ao redor de cada bairro (Google Places)
- bairros-geocoded.json: lat/lng oficiais dos bairros

═══════════════════════════════════════════════════════════════
PARTE 1 — CARREGAR OS DADOS REAIS
═══════════════════════════════════════════════════════════════

Criar src/lib/dataLoader.js:

let _distancias = null;
let _pois = null;

export async function carregarDistancias() {
  if (_distancias) return _distancias;
  const res = await fetch('/data/distancias.json');
  _distancias = await res.json();
  return _distancias;
}

export async function carregarPois() {
  if (_pois) return _pois;
  const res = await fetch('/data/pois.json');
  _pois = await res.json();
  return _pois;
}

export function getDistancia(distancias, origemId, destinoId) {
  return distancias?.distancias?.[origemId]?.[destinoId]?.normal || null;
}

export function getPois(pois, bairroId) {
  return pois?.pois?.[bairroId] || null;
}

═══════════════════════════════════════════════════════════════
PARTE 2 — SUBSTITUIR HAVERSINE POR DISTÂNCIA REAL
═══════════════════════════════════════════════════════════════

Em src/lib/calcularCusto.js, modificar calcularDeslocamento:

ANTES (cálculo aproximado por linha reta):
const distanciaLinhaReta = haversine(origem, destino);
const distanciaUrbana = distanciaLinhaReta * 1.35;
const tempoMinutos = Math.round((distanciaUrbana / velocidade) * 60);

DEPOIS (usa dados reais quando disponível, fallback pra haversine):

export function calcularDeslocamento(origem, destino, modal, dadosDistancia = null) {
  // dadosDistancia vem de distancias.json (Distance Matrix do Google)
  // Formato: { distancia_metros: 6500, tempo_segundos: 1080 }
  
  if (dadosDistancia && modal === 'carro' || modal === 'uber') {
    // Para carro/uber: usa direto os dados do Google (já considera trânsito)
    const distanciaKm = dadosDistancia.distancia_metros / 1000;
    const tempoMinutosIda = Math.round(dadosDistancia.tempo_segundos / 60);
    
    return {
      distanciaIdaKm: Number(distanciaKm.toFixed(1)),
      distanciaDiariaKm: Number((distanciaKm * 2).toFixed(1)),
      distanciaMensalKm: Number((distanciaKm * 2 * 22).toFixed(0)),
      tempoIdaMinutos: tempoMinutosIda,
      tempoVoltaMinutos: tempoMinutosIda,
      tempoDiarioMinutos: tempoMinutosIda * 2,
      tempoMensalHoras: Math.round((tempoMinutosIda * 2 * 22) / 60),
      origemDados: 'google',
    };
  }

  if (dadosDistancia && (modal === 'metro' || modal === 'onibus')) {
    // Para transporte público: usa a DISTÂNCIA real do Google,
    // mas aplica velocidade média do modal (Google só calcula carro)
    const distanciaKm = dadosDistancia.distancia_metros / 1000;
    const velocidades = { metro: 28, onibus: 14 };
    const velocidade = velocidades[modal];
    const tempoMinutosIda = Math.round((distanciaKm / velocidade) * 60);
    
    return {
      distanciaIdaKm: Number(distanciaKm.toFixed(1)),
      distanciaDiariaKm: Number((distanciaKm * 2).toFixed(1)),
      distanciaMensalKm: Number((distanciaKm * 2 * 22).toFixed(0)),
      tempoIdaMinutos: tempoMinutosIda,
      tempoVoltaMinutos: tempoMinutosIda,
      tempoDiarioMinutos: tempoMinutosIda * 2,
      tempoMensalHoras: Math.round((tempoMinutosIda * 2 * 22) / 60),
      origemDados: 'estimado',
    };
  }

  // FALLBACK: haversine (caso o JSON ainda não tenha carregado)
  const distanciaLinhaReta = haversine(origem, destino);
  const distanciaUrbana = distanciaLinhaReta * 1.35;
  const velocidades = { carro: 22, uber: 22, metro: 28, onibus: 14 };
  const velocidade = velocidades[modal];
  const tempoMinutosIda = Math.round((distanciaUrbana / velocidade) * 60);

  return {
    distanciaIdaKm: Number(distanciaUrbana.toFixed(1)),
    distanciaDiariaKm: Number((distanciaUrbana * 2).toFixed(1)),
    distanciaMensalKm: Number((distanciaUrbana * 2 * 22).toFixed(0)),
    tempoIdaMinutos: tempoMinutosIda,
    tempoVoltaMinutos: tempoMinutosIda,
    tempoDiarioMinutos: tempoMinutosIda * 2,
    tempoMensalHoras: Math.round((tempoMinutosIda * 2 * 22) / 60),
    origemDados: 'fallback',
  };
}

═══════════════════════════════════════════════════════════════
PARTE 3 — REGRA "MESMO BAIRRO"
═══════════════════════════════════════════════════════════════

Quando origem === destino (bairro de trabalho = bairro de moradia), 
o Google retorna distância e tempo muito pequenos, mas pode dar 0 em alguns casos.

Adicionar tratamento em calcularResumoBairro:

if (bairro.id === bairroTrabalho.id) {
  return {
    aluguel: Math.round(bairro.aluguelMedioM2 * filtros.tamanhoImovel),
    condominio: bairro.condominioMedio,
    modais: [{
      modal: 'caminhada',
      distanciaIdaKm: 1.0,  // média de deslocamento interno
      tempoIdaMinutos: 12,
      tempoVoltaMinutos: 12,
      tempoMensalHoras: 9,
      custoMensal: 0,
      breakdown: {},
      mesmoBairro: true,
    }],
    modalPrincipal: { modal: 'caminhada', custoMensal: 0, tempoMensalHoras: 9 },
    total: Math.round(bairro.aluguelMedioM2 * filtros.tamanhoImovel) + bairro.condominioMedio,
    distanciaKm: 1.0,
    mesmoBairro: true,
  };
}

═══════════════════════════════════════════════════════════════
PARTE 4 — REGRA "BAIRRO SEM METRÔ"
═══════════════════════════════════════════════════════════════

Em src/data/bairros.json, cada bairro tem o campo "metro": true|false.

Quando o usuário selecionou "metro" como transporte E o bairro não tem metrô:

1. NÃO esconder o bairro da lista
2. Mostrar com aviso no card

Em calcularResumoBairro, quando processar o modal 'metro':

const bairroSelTemMetro = bairro.metro;

if (modal === 'metro' && !bairroSelTemMetro) {
  // Calcula trajeto multimodal: ônibus até estação + metrô
  const deslocamento = calcularDeslocamento(bairro, bairroTrabalho, 'metro', dadosDistancia);
  
  // Adiciona ~15 min de aproximação até a estação mais próxima
  const tempoIdaComAcesso = deslocamento.tempoIdaMinutos + 15;
  
  return {
    modal: 'metro',
    ...deslocamento,
    tempoIdaMinutos: tempoIdaComAcesso,
    tempoVoltaMinutos: tempoIdaComAcesso,
    tempoDiarioMinutos: tempoIdaComAcesso * 2,
    tempoMensalHoras: Math.round((tempoIdaComAcesso * 2 * 22) / 60),
    custoMensal: 5 * 44 + 5 * 44,  // 2 passagens por viagem (ônibus + metrô)
    semMetro: true,
    avisoTrajeto: 'Este bairro não tem metrô. Trajeto inclui ~15 min de ônibus até a estação mais próxima.',
  };
}

═══════════════════════════════════════════════════════════════
PARTE 5 — UI: MOSTRAR AVISOS NO CARD
═══════════════════════════════════════════════════════════════

No NeighborhoodCard, no bloco TRANSPORTE — quando o modal tem 'semMetro' = true:

<div className={styles.transportBlock}>
  <div className={styles.modalHeader}>
    <span className={styles.modalLabel}>TRANSPORTE</span>
    <span className={styles.modalName}>Metrô</span>
  </div>
  
  {modal.semMetro && (
    <p className={styles.aviso}>
      ⚠ {modal.avisoTrajeto}
    </p>
  )}
  
  {/* ... resto das linhas */}
</div>

Estilo do aviso:
.aviso {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-muted);
  font-style: italic;
  padding: 8px 12px;
  border-left: 2px solid var(--color-muted);
  margin: 8px 0 12px;
  line-height: 1.5;
}

Para o caso "mesmo bairro":

<div className={styles.transportBlock}>
  <div className={styles.modalHeader}>
    <span className={styles.modalLabel}>TRANSPORTE</span>
    <span className={styles.modalName}>A pé</span>
  </div>
  
  <p className={styles.mesmoBairroNote}>
    Você mora e trabalha no mesmo bairro. Provavelmente caminha pro trabalho.
  </p>
  
  <div className={styles.transportRows}>
    <div className={styles.row}>
      <span className={styles.label}>TEMPO ESTIMADO</span>
      <span className={styles.value}>~12 min de caminhada</span>
    </div>
    <div className={styles.row}>
      <span className={styles.label}>CUSTO</span>
      <span className={styles.value}>R$ 0</span>
    </div>
  </div>
</div>

═══════════════════════════════════════════════════════════════
PARTE 6 — MODAL DE DETALHES COM POIS REAIS
═══════════════════════════════════════════════════════════════

No NeighborhoodModal, substituir os POIs fictícios pelos reais:

const [pois, setPois] = useState(null);

useEffect(() => {
  carregarPois().then(p => setPois(getPois(p, bairro.id)));
}, [bairro.id]);

Renderização da seção "NO BAIRRO":

{pois && (
  <section className={styles.section}>
    <h3 className={styles.sectionTitle}>NO BAIRRO</h3>
    <div className={styles.dataGrid}>
      {pois.metroEstacoes?.total > 0 && (
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Estações de metrô</span>
          <span className={styles.dataValue}>
            {pois.metroEstacoes.nomes.join(', ')}
            {pois.metroEstacoes.total > 3 && ` (+${pois.metroEstacoes.total - 3})`}
          </span>
        </div>
      )}
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Supermercados</span>
        <span className={styles.dataValue}>{pois.supermercados} no entorno</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Bares e restaurantes</span>
        <span className={styles.dataValue}>{pois.barRestaurantes} estabelecimentos</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Padarias</span>
        <span className={styles.dataValue}>{pois.padarias}</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Farmácias</span>
        <span className={styles.dataValue}>{pois.farmacias}</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Postos de gasolina</span>
        <span className={styles.dataValue}>{pois.postosGasolina}</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Bancos</span>
        <span className={styles.dataValue}>{pois.bancos}</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Escolas</span>
        <span className={styles.dataValue}>{pois.escolas}</span>
      </div>
      
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Academias</span>
        <span className={styles.dataValue}>{pois.academias}</span>
      </div>
      
      {pois.hospitais?.total > 0 && (
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Hospitais</span>
          <span className={styles.dataValue}>
            {pois.hospitais.nomes.join(', ')}
          </span>
        </div>
      )}
      
      {pois.parques?.total > 0 && (
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Parques</span>
          <span className={styles.dataValue}>
            {pois.parques.nomes.join(', ')}
          </span>
        </div>
      )}
      
      {pois.shoppings?.total > 0 && (
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Shoppings</span>
          <span className={styles.dataValue}>
            {pois.shoppings.nomes.join(', ')}
          </span>
        </div>
      )}
    </div>
  </section>
)}

═══════════════════════════════════════════════════════════════
PARTE 7 — LOADING STATES
═══════════════════════════════════════════════════════════════

distancias.json pode ser grande (~500KB-1MB). Não bloqueie a UI:

- App renderiza com cálculos fallback (haversine) imediatamente
- distancias.json carrega em background
- Quando chega, recalcula tudo e re-renderiza

No App layout ou page.js:

const [distancias, setDistancias] = useState(null);
const [carregandoDados, setCarregandoDados] = useState(true);

useEffect(() => {
  carregarDistancias()
    .then(d => {
      setDistancias(d);
      setCarregandoDados(false);
    })
    .catch(err => {
      console.error('Erro ao carregar distâncias:', err);
      setCarregandoDados(false);
    });
}, []);

Indicador discreto enquanto carrega (canto inferior direito):
{carregandoDados && (
  <div className={styles.loadingHint}>
    Carregando dados precisos...
  </div>
)}

═══════════════════════════════════════════════════════════════
CRITÉRIOS DE ACEITE
═══════════════════════════════════════════════════════════════

- Distâncias e tempos vêm do Google quando disponíveis (campo origemDados: 'google')
- Quando bairro = trabalho: card especial "A pé, 12 min, R$ 0"
- Quando metrô é selecionado mas bairro não tem metrô: aviso visível com tempo extra de aproximação
- Modal mostra POIs REAIS (nomes de estabelecimentos vindos do Google Places)
- Dados carregam em background sem travar a UI
- Indicador "Carregando dados precisos..." aparece e some
- App funciona mesmo se distancias.json falhar ao carregar (fallback haversine)
- Bairros sem dados (lat/lng null) continuam aparecendo com cálculo fallback

Pode começar.
```
