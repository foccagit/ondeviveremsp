import { haversine } from './geo';

const DIAS_UTEIS = 22;
const FATOR_URBANO = 1.35;

const VELOCIDADES = {
  carro: 22,
  uber: 22,
  metro: 28,
  onibus: 14,
};

export function calcularDeslocamento(origem, destino, modal) {
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

export function calcularResumoBairro(bairro, filtros, bairroTrabalho, dadosTransporte) {
  const aluguel = bairro.aluguelMedioM2 * filtros.tamanhoImovel;
  const condominio = bairro.condominioMedio;

  const modaisFiltro =
    filtros.transporte && filtros.transporte.length > 0 ? filtros.transporte : ['metro'];

  const modais = modaisFiltro.map((modal) => {
    const deslocamento = calcularDeslocamento(bairro, bairroTrabalho, modal);
    const custo = calcularCustoTransporte(deslocamento, modal, dadosTransporte);
    return {
      modal,
      ...deslocamento,
      custoMensal: custo.total,
      breakdown: custo.breakdown,
      detalhes: custo.detalhes,
    };
  });

  const modalPrincipal = modais.reduce((a, b) => (a.custoMensal <= b.custoMensal ? a : b));

  return {
    aluguel: Math.round(aluguel),
    condominio,
    modais,
    modalPrincipal,
    total: Math.round(aluguel + condominio + modalPrincipal.custoMensal),
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

function gerarNarrativa(economia, tempoExtra, reaisPorHora) {
  if (economia > 0 && tempoExtra > 0) {
    return `Economiza R$ ${formatBRL(economia)}/mês, mas custa ${tempoExtra}h a mais de deslocamento. Você "paga" R$ ${formatBRL(reaisPorHora)}/hora pelo tempo do bairro de referência.`;
  }
  if (economia > 0 && tempoExtra <= 0) {
    return `Economiza R$ ${formatBRL(economia)}/mês E gasta menos tempo no trânsito. Difícil bater.`;
  }
  if (economia <= 0 && tempoExtra <= 0) {
    return `Mais caro mas mais perto: R$ ${formatBRL(economia)}/mês a mais por ${Math.abs(tempoExtra)}h economizadas.`;
  }
  return `Mais caro E mais distante. Provavelmente não vale a pena.`;
}

export function compararContraReferencia(resumoAtual, resumoReferencia) {
  const economiaMensal = resumoReferencia.total - resumoAtual.total;
  const tempoExtraMensalHoras =
    resumoAtual.modalPrincipal.tempoMensalHoras -
    resumoReferencia.modalPrincipal.tempoMensalHoras;

  const reaisPorHora =
    tempoExtraMensalHoras > 0 ? Math.round(economiaMensal / tempoExtraMensalHoras) : null;

  return {
    economiaMensal,
    tempoExtraMensalHoras,
    reaisPorHora,
    mensagem: gerarNarrativa(economiaMensal, tempoExtraMensalHoras, reaisPorHora),
  };
}
