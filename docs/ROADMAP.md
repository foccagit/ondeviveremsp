# Roadmap

## Fase 1 — Interface MVP (atual)

Frontend completo com dados fictícios. Sem backend.

- [x] Estrutura de pastas
- [ ] Setup Next.js + CSS Modules + fontes
- [ ] Sistema de tokens e tema claro/escuro
- [ ] Mapa de SP com Leaflet + GeoJSON dos bairros
- [ ] Mock de dados plausíveis pros 96 bairros
- [ ] Painel de filtros (salário, trabalho, transporte, perfil)
- [ ] Card de bairro com métricas
- [ ] Modo comparação (até 3 bairros lado a lado)
- [ ] Gráficos de comparação (Recharts)
- [ ] Responsividade mobile

## Fase 2 — Dados demográficos reais

Substituir mocks de população/renda por dados oficiais.

- [ ] Importar dados do IBGE (Censo 2022) por distrito
- [ ] Mapear distritos → 96 bairros oficiais
- [ ] Importar dados de renda do SEADE
- [ ] Heatmap no mapa por métrica selecionada

Fontes:
- IBGE Censo 2022 (CSV/Excel oficial)
- SEADE (Fundação Sistema Estadual de Análise de Dados)
- GeoSampa para shapefiles oficiais

## Fase 3 — Aluguel real (a parte crítica)

- [ ] Setup backend FastAPI + PostgreSQL + PostGIS no VPS
- [ ] Scraper QuintoAndar com Playwright
- [ ] Scraper Zap Imóveis
- [ ] Job cron semanal
- [ ] Cálculo de média, mediana, R$/m² por bairro
- [ ] API endpoint `/bairros/{id}/aluguel`

## Fase 4 — POIs e transporte

- [ ] Overpass API → estações de metrô, bares, mercados, parques
- [ ] Contagem de POIs por bairro
- [ ] OSRM ou Google Distance Matrix para tempo/custo de deslocamento
- [ ] Substituir mock de transporte por cálculo real

## Fase 5 — Criminalidade

- [ ] Parser dos PDFs mensais da SSP-SP
- [ ] Mapeamento distrito policial → bairro
- [ ] Índice de segurança calculado, não estimado

## Fase 6 — Calculadora de custo total real

- [ ] Composição: aluguel + condomínio + IPTU + transporte (modo escolhido)
- [ ] Comparação "salário líquido vs custo de vida"
- [ ] Recomendação automática de bairros dentro do orçamento

## Fase 7 — UX final e lançamento

- [ ] Tutorial onboarding
- [ ] Compartilhar comparação via URL
- [ ] SEO (Next.js SSR já ajuda)
- [ ] Analytics privacy-friendly (Plausible ou similar)
- [ ] Deploy em produção
