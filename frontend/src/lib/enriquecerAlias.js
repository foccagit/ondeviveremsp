/**
 * Enriquece uma entrada de aliases.json com os dados quantitativos do
 * distrito-pai. Resultado: objeto pronto pra ser tratado como um "bairro"
 * pelos componentes (Card, Modal, calcularCusto, etc.).
 *
 * Identidade:
 *   - `id` continua sendo o `distritoId` — pra que cálculos de distância
 *     e POIs (que usam o id do distrito) funcionem sem refactor.
 *   - `slug` é a chave única do ITEM da lista (slug do alias). Use ele
 *     como `key` no React, no CompareContext e na URL de `/comparar`.
 *
 * @param {string} slug      ex: 'vila-madalena'
 * @param {object} alias     entrada de aliases.aliases[slug]
 * @param {object} distritoPai item de bairros.json correspondente
 */
export function enriquecerAlias(slug, alias, distritoPai) {
  return {
    ...distritoPai, // populacao, renda, aluguelMedioM2, aluguelFonte, metro,
                    // vidaNoturna, comercio, parques, seguranca, descricao,
                    // descricaoLonga, condominioMedio, e id=distritoId
    slug,
    nome: alias.nome_exibicao,
    zona: alias.zona,
    bioCurta: alias.bio_curta,
    bioLonga: alias.bio_longa,
    ehAlias: alias.nome_exibicao !== distritoPai.nome,
    distritoNome: distritoPai.nome,
    distritoId: distritoPai.id,
  };
}

/**
 * Dado um slug (de alias) ou um distritoId puro, devolve o distritoId
 * correspondente. Usado pra cálculos quantitativos (distância, custo, etc)
 * que sempre operam sobre o distrito-pai.
 */
export function resolverDistritoId(idOuSlug, aliases) {
  if (!idOuSlug) return null;
  if (aliases?.aliases?.[idOuSlug]) {
    return aliases.aliases[idOuSlug].distrito;
  }
  return idOuSlug;
}

/**
 * Resolve um identificador (slug ou distritoId puro pra fallback) num
 * item enriquecido. Pra URLs antigas de /comparar com distritoId puro.
 */
export function resolverItem(idOuSlug, aliases, bairros) {
  const alias = aliases?.aliases?.[idOuSlug];
  if (alias) {
    const distrito = bairros.find((b) => b.id === alias.distrito);
    if (!distrito) return null;
    return enriquecerAlias(idOuSlug, alias, distrito);
  }
  // Fallback: distritoId puro (URLs antigas)
  const distrito = bairros.find((b) => b.id === idOuSlug);
  if (!distrito) return null;
  return {
    ...distrito,
    slug: distrito.id,
    distritoId: distrito.id,
    distritoNome: distrito.nome,
    ehAlias: false,
  };
}
