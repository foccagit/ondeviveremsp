import { haversine } from './geo';

const DIAS_UTEIS = 22;
const FATOR_URBANO = 1.35;

const VELOCIDADES = {
  carro: 22,
  uber: 22,
  metro: 28,
  onibus: 14,
};

// Tempo extra de aproximação (ida + caminhada até a estação) quando o
// bairro de moradia não tem metrô e o modal pedido é metrô.
const TEMPO_ACESSO_METRO_MIN = 15;

/**
 * Calcula o deslocamento entre dois bairros para um dado modal.
 *
 * @param {Object}  origem      bairro com {lat, lng, id}
 * @param {Object}  destino     bairro com {lat, lng, id}
 * @param {string}  modal       'carro' | 'uber' | 'metro' | 'onibus' | ...
 * @param {Object?} dadosReais  resultado de getDistancia() — { distancia_metros, tempo_segundos } ou null
 */
export function calcularDeslocamento(origem, destino, modal, dadosReais = null) {
  // Caso 1: mesmo bairro → assume caminhada curta
  if (origem.id === destino.id) {
    return {
      distanciaIdaKm: 1.0,
      distanciaDiariaKm: 2.0,
      distanciaMensalKm: 44,
      tempoIdaMinutos: 12,
      tempoVoltaMinutos: 12,
      tempoDiarioMinutos: 24,
      tempoMensalHoras: 9,
      origemDados: 'mesmo_bairro',
      modalReal: 'caminhada',
    };
  }

  // Caso 2: dados reais do Google + modal carro/uber → usa tempo COM trânsito
  if (dadosReais && (modal === 'carro' || modal === 'uber')) {
    const distanciaKm = dadosReais.distancia_metros / 1000;
    const tempoIdaMinutos = Math.round(dadosReais.tempo_segundos / 60);
    const tempoVoltaMinutos = tempoIdaMinutos;
    const tempoDiarioMinutos = tempoIdaMinutos + tempoVoltaMinutos;
    return {
      distanciaIdaKm: Number(distanciaKm.toFixed(1)),
      distanciaDiariaKm: Number((distanciaKm * 2).toFixed(1)),
      distanciaMensalKm: Number((distanciaKm * 2 * DIAS_UTEIS).toFixed(0)),
      tempoIdaMinutos,
      tempoVoltaMinutos,
      tempoDiarioMinutos,
      tempoMensalHoras: Math.round((tempoDiarioMinutos * DIAS_UTEIS) / 60),
      origemDados: 'google',
      modalReal: modal,
    };
  }

  // Caso 3: dados reais do Google + modal metro/onibus → usa distância real
  //         do Google e aplica velocidade média do modal pra tempo.
  if (dadosReais && (modal === 'metro' || modal === 'onibus')) {
    const distanciaKm = dadosReais.distancia_metros / 1000;
    const velocidade = VELOCIDADES[modal];
    const tempoIdaMinutos = Math.round((distanciaKm / velocidade) * 60);
    const tempoVoltaMinutos = tempoIdaMinutos;
    const tempoDiarioMinutos = tempoIdaMinutos + tempoVoltaMinutos;
    return {
      distanciaIdaKm: Number(distanciaKm.toFixed(1)),
      distanciaDiariaKm: Number((distanciaKm * 2).toFixed(1)),
      distanciaMensalKm: Number((distanciaKm * 2 * DIAS_UTEIS).toFixed(0)),
      tempoIdaMinutos,
      tempoVoltaMinutos,
      tempoDiarioMinutos,
      tempoMensalHoras: Math.round((tempoDiarioMinutos * DIAS_UTEIS) / 60),
      origemDados: 'estimado',
      modalReal: modal,
    };
  }

  // Fallback: haversine (necessário pro carregamento inicial, antes do
  // distancias.json baixar, e pra qualquer par bairro-bairro com null).
  const distanciaLinhaReta = haversine(origem, destino);
  const distanciaUrbana = distanciaLinhaReta * FATOR_URBANO;
  const velocidade = VELOCIDADES[modal] || 20;
  const tempoIdaMinutos = Math.round((distanciaUrbana / velocidade) * 60);
  const tempoVoltaMinutos = tempoIdaMinutos;
  const tempoDiarioMinutos = tempoIdaMinutos + tempoVoltaMinutos;

  return {
    distanciaIdaKm: Number(distanciaUrbana.toFixed(1)),
    distanciaDiariaKm: Number((distanciaUrbana * 2).toFixed(1)),
    distanciaMensalKm: Number((distanciaUrbana * 2 * DIAS_UTEIS).toFixed(0)),
    tempoIdaMinutos,
    tempoVoltaMinutos,
    tempoDiarioMinutos,
    tempoMensalHoras: Math.round((tempoDiarioMinutos * DIAS_UTEIS) / 60),
    origemDados: 'fallback',
    modalReal: modal,
  };
}

export function calcularCustoTransporte(deslocamento, modal, dadosTransporte) {
  const { distanciaMensalKm, distanciaIdaKm, tempoDiarioMinutos } = deslocamento;
  if (tempoDiarioMinutos === 0 || distanciaIdaKm === 0) {
    return {
      total: 0,
      breakdown: {
        combustivel: 0,
        manutencao: 0,
        estacionamento: 0,
        ipva: 0,
        porViagem: 0,
        viagensMes: 0,
      },
      detalhes: { litrosMes: 0, consumoKmPorLitro: dadosTransporte.carro?.consumoKmPorLitro || 0 },
    };
  }
  switch (modal) {
    case 'carro': {
      const dados = dadosTransporte.carro;
      const litrosMes = distanciaMensalKm / dados.consumoKmPorLitro;
      const combustivel = Math.round(litrosMes * dados.precoLitroGasolina);
      const manutencao = Math.round(distanciaMensalKm * dados.manutencaoPorKm);
      const estacionamento = dados.custoEstacionamentoMensal;
      const ipva = Math.round(dados.ipva);
      const total = combustivel + manutencao + estacionamento + ipva;
      return {
        total,
        breakdown: { combustivel, manutencao, estacionamento, ipva },
        detalhes: {
          litrosMes: Number(litrosMes.toFixed(1)),
          consumoKmPorLitro: dados.consumoKmPorLitro,
        },
      };
    }
    case 'uber': {
      const custoIda = dadosTransporte.uber.tarifaBase + distanciaIdaKm * dadosTransporte.uber.porKm;
      const total = Math.round(custoIda * 2 * DIAS_UTEIS);
      return {
        total,
        breakdown: { porViagem: Math.round(custoIda), viagensMes: DIAS_UTEIS * 2 },
      };
    }
    case 'metro':
    case 'onibus': {
      const dados = dadosTransporte[modal];
      const total = dados.passagem * dados.viagensPorMes;
      return {
        total,
        breakdown: { porViagem: dados.passagem, viagensMes: dados.viagensPorMes },
      };
    }
    default:
      return { total: 0, breakdown: {} };
  }
}

const MODAL_LABEL = {
  carro: 'Carro',
  uber: 'Uber',
  metro: 'Metrô',
  onibus: 'Ônibus',
};

/**
 * Calcula resumo de custo + transporte de um bairro candidato relativo ao
 * bairro de trabalho.
 *
 * @param {Object}  bairro          bairro candidato (de bairros.json)
 * @param {Object}  filtros         estado do filtro (tamanhoImovel, transporte: string[])
 * @param {Object}  bairroTrabalho  bairro de trabalho (de bairros.json)
 * @param {Object}  dadosTransporte conteúdo de transporte.json
 * @param {Object?} distancias      conteúdo de distancias.json (opcional — usa fallback se ausente)
 */
export function calcularResumoBairro(
  bairro,
  filtros,
  bairroTrabalho,
  dadosTransporte,
  distancias = null
) {
  const aluguel = Math.round(bairro.aluguelMedioM2 * filtros.tamanhoImovel);
  const condominio = bairro.condominioMedio;

  // Caso especial: mora e trabalha no mesmo bairro → caminhada curta, R$ 0
  if (bairro.id === bairroTrabalho.id) {
    const modalCaminhada = {
      modal: 'caminhada',
      modalLabel: 'A pé',
      distanciaIdaKm: 1.0,
      distanciaDiariaKm: 2.0,
      distanciaMensalKm: 44,
      tempoIdaMinutos: 12,
      tempoVoltaMinutos: 12,
      tempoDiarioMinutos: 24,
      tempoMensalHoras: 9,
      custoMensal: 0,
      breakdown: {},
      mesmoBairro: true,
    };
    return {
      aluguel,
      condominio,
      modais: [modalCaminhada],
      modalPrincipal: modalCaminhada,
      total: aluguel + condominio,
      distanciaKm: 1.0,
      mesmoBairro: true,
    };
  }

  const modaisFiltro =
    filtros.transporte && filtros.transporte.length > 0 ? filtros.transporte : ['metro'];

  // Lookup dos dados reais do Google (par origem → destino)
  const dadosReais =
    distancias?.distancias?.[bairroTrabalho.id]?.[bairro.id]?.normal || null;

  const modais = modaisFiltro.map((modal) => {
    // Caso especial: usuário escolheu metrô mas o bairro de moradia não tem
    if (modal === 'metro' && !bairro.metro) {
      const desl = calcularDeslocamento(bairro, bairroTrabalho, 'metro', dadosReais);
      const tempoIdaComAcesso = desl.tempoIdaMinutos + TEMPO_ACESSO_METRO_MIN;
      const tempoVoltaComAcesso = tempoIdaComAcesso;
      const tempoDiario = tempoIdaComAcesso + tempoVoltaComAcesso;
      const passagem = dadosTransporte.metro?.passagem ?? 5;
      const viagens = dadosTransporte.metro?.viagensPorMes ?? 44;
      // Custo: passagem do metrô + bus complementar (mesma tarifa = passagem dobrada)
      const custoMensal = passagem * viagens * 2;

      return {
        ...desl,
        modal: 'metro',
        modalLabel: 'Metrô + ônibus',
        tempoIdaMinutos: tempoIdaComAcesso,
        tempoVoltaMinutos: tempoVoltaComAcesso,
        tempoDiarioMinutos: tempoDiario,
        tempoMensalHoras: Math.round((tempoDiario * DIAS_UTEIS) / 60),
        custoMensal,
        breakdown: { porViagem: passagem, viagensMes: viagens * 2 },
        semMetro: true,
        avisoTrajeto:
          'Este bairro não tem metrô. Inclui ~15 min de ônibus até a estação mais próxima.',
      };
    }

    const desl = calcularDeslocamento(bairro, bairroTrabalho, modal, dadosReais);
    const custo = calcularCustoTransporte(desl, modal, dadosTransporte);
    return {
      modal,
      modalLabel: MODAL_LABEL[modal] || modal,
      ...desl,
      custoMensal: typeof custo === 'object' ? custo.total : custo,
      breakdown: typeof custo === 'object' ? custo.breakdown : {},
      detalhes: typeof custo === 'object' ? custo.detalhes : undefined,
    };
  });

  const modalPrincipal = modais.reduce((a, b) =>
    a.custoMensal <= b.custoMensal ? a : b
  );

  return {
    aluguel,
    condominio,
    modais,
    modalPrincipal,
    total: aluguel + condominio + modalPrincipal.custoMensal,
    distanciaKm: modalPrincipal.distanciaIdaKm,
  };
}

export function classificarProximidade(distanciaKm) {
  if (distanciaKm <= 5) return 'pertinho';
  if (distanciaKm <= 15) return 'medio';
  return 'longe';
}

function formatBRL(value) {
  return Math.abs(Math.round(value)).toLocaleString('pt-BR');
}

function gerarNarrativa(economia, tempoExtra, reaisPorHora, nomeBairroReferencia = 'o bairro de trabalho') {
  const ref = nomeBairroReferencia;

  // Caso 1: economiza dinheiro mas gasta mais tempo (trade-off clássico)
  if (economia > 0 && tempoExtra > 0) {
    return `Em relação a ${ref}, economiza R$ ${formatBRL(economia)}/mês mas custa ${tempoExtra}h a mais no trânsito. Você "paga" R$ ${formatBRL(reaisPorHora)}/hora pelo tempo de ${ref}.`;
  }

  // Caso 2: economiza dinheiro E tempo (raro quando trabalho é a referência)
  if (economia > 0 && tempoExtra <= 0) {
    return `Em relação a ${ref}, economiza R$ ${formatBRL(economia)}/mês com tempo de deslocamento similar.`;
  }

  // Caso 3: mais caro mas mais perto (próximo ao trabalho)
  if (economia <= 0 && tempoExtra <= 0) {
    const horasEconomizadas = Math.abs(tempoExtra);
    if (horasEconomizadas === 0) {
      return `Em relação a ${ref}, custa R$ ${formatBRL(Math.abs(economia))}/mês a mais com tempo de deslocamento similar.`;
    }
    return `Em relação a ${ref}, custa R$ ${formatBRL(Math.abs(economia))}/mês a mais mas economiza ${horasEconomizadas}h no trânsito.`;
  }

  // Caso 4: mais caro E mais distante
  return `Em relação a ${ref}, custa R$ ${formatBRL(Math.abs(economia))}/mês a mais E gasta ${tempoExtra}h extras no trânsito. Provavelmente não vale a pena.`;
}

export function compararContraReferencia(resumoAtual, resumoReferencia, nomeBairroReferencia) {
  const economiaMensal = resumoReferencia.total - resumoAtual.total;

  // Se a referência é "mesmo bairro" (trabalho = moradia), trata o tempo dela como 0
  // — caminhada não conta como trânsito real, então o "tempo extra" deve refletir
  // todo o tempo de deslocamento do bairro atual.
  const tempoReferencia = resumoReferencia.mesmoBairro
    ? 0
    : resumoReferencia.modalPrincipal.tempoMensalHoras;

  const tempoExtraMensalHoras =
    resumoAtual.modalPrincipal.tempoMensalHoras - tempoReferencia;

  const reaisPorHora =
    tempoExtraMensalHoras > 0 ? Math.round(economiaMensal / tempoExtraMensalHoras) : null;

  return {
    economiaMensal,
    tempoExtraMensalHoras,
    reaisPorHora,
    mensagem: gerarNarrativa(
      economiaMensal,
      tempoExtraMensalHoras,
      reaisPorHora,
      nomeBairroReferencia
    ),
  };
}
