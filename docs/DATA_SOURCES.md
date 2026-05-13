# Fontes de Dados

Mapeamento de cada métrica para sua origem real (a usar nas fases 2+).

## Geometria dos bairros

- **GeoSampa** — Prefeitura de SP, GeoJSON oficial dos 96 distritos/bairros
- URL: https://geosampa.prefeitura.sp.gov.br/
- Formato: Shapefile / GeoJSON
- Atualização: anual

## População, densidade, renda

- **IBGE Censo 2022** — dados por setor censitário
- **SEADE** — informações estaduais por distrito
- URL: https://www.ibge.gov.br/ e https://www.seade.gov.br/
- Formato: CSV / XLSX
- Granularidade: setor censitário → agregar por bairro

## Aluguel

Não existe API pública confiável. Estratégias:

1. **Scraping QuintoAndar** — listagens públicas, Playwright (SPA)
2. **Scraping Zap Imóveis** — idem
3. **FipeZap** — índice mensal publicado, dá médias por região (não bairro)

⚠️ Scraping é frágil. Rodar como job separado, salvar histórico, ter fallback se quebrar.

## Criminalidade

- **SSP-SP** — Secretaria de Segurança Pública de SP
- URL: https://www.ssp.sp.gov.br/estatistica/
- Formato: PDF mensal por distrito policial
- Mapeamento necessário: distrito policial → bairro (não é 1:1)

## POIs (metrô, bares, mercados, parques)

- **OpenStreetMap / Overpass API**
- URL: https://overpass-api.de/
- Formato: JSON
- Sem rate limit absurdo, gratuito
- Tags úteis: `amenity=bar`, `amenity=restaurant`, `railway=station`, `leisure=park`, `shop=supermarket`

## Transporte público

- **CPTM / Metrô SP** — GTFS público (horários e rotas)
- **SPTrans** — ônibus, API Olho Vivo

## Cálculo de rotas / tempo de deslocamento

- **OSRM self-hosted** — gratuito, mas precisa servidor
- **Google Distance Matrix API** — pago, mas confiável
- **Mapbox Directions** — alternativa
