// Module-scoped cache: each JSON is fetched once, then reused.
let _distancias = null;
let _pois = null;
let _aliases = null;
let _geocoded = null;

let _distanciasPromise = null;
let _poisPromise = null;
let _aliasesPromise = null;
let _geocodedPromise = null;

async function loadOnce(url, getCached, setCached, getPromise, setPromise) {
  const cached = getCached();
  if (cached) return cached;
  const inflight = getPromise();
  if (inflight) return inflight;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Falha ao carregar ${url}: ${r.status}`);
      return r.json();
    })
    .then((json) => {
      setCached(json);
      return json;
    })
    .finally(() => setPromise(null));
  setPromise(p);
  return p;
}

export function carregarDistancias() {
  return loadOnce(
    '/data/distancias.json',
    () => _distancias,
    (v) => { _distancias = v; },
    () => _distanciasPromise,
    (p) => { _distanciasPromise = p; }
  );
}

export function carregarPois() {
  return loadOnce(
    '/data/pois.json',
    () => _pois,
    (v) => { _pois = v; },
    () => _poisPromise,
    (p) => { _poisPromise = p; }
  );
}

export function carregarAliases() {
  return loadOnce(
    '/data/aliases.json',
    () => _aliases,
    (v) => { _aliases = v; },
    () => _aliasesPromise,
    (p) => { _aliasesPromise = p; }
  );
}

export function carregarGeocoded() {
  return loadOnce(
    '/data/bairros-geocoded.json',
    () => _geocoded,
    (v) => { _geocoded = v; },
    () => _geocodedPromise,
    (p) => { _geocodedPromise = p; }
  );
}

// ---- Helpers ----

export function getDistancia(distancias, origemId, destinoId) {
  return distancias?.distancias?.[origemId]?.[destinoId]?.normal || null;
}

export function getPois(pois, bairroId) {
  return pois?.pois?.[bairroId] || null;
}
