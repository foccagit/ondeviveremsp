# moradai

> Um comparador inteligente de bairros de São Paulo. Ajuda quem está pensando em se mudar a entender o **custo total real** de morar em cada região — não só o aluguel, mas transporte até o trabalho, perfil de vida social, segurança e o "vibe" do bairro.

## Por que existe

Portais imobiliários (QuintoAndar, Zap, Loft) mostram imóveis. Nenhum responde a pergunta que realmente importa: **"morar nesse bairro vai caber no meu salário e no meu estilo de vida?"**

Um aluguel de R$2.500 na Zona Leste pode custar mais no fim do mês que R$3.500 nos Jardins, se você gastar R$1.500 de Uber pro trabalho na Faria Lima. Esse projeto torna esse cálculo explícito.

## Stack

- **Frontend**: Next.js 14 (App Router) + React + CSS Modules
- **Mapa**: Leaflet via `react-leaflet` + GeoJSON dos bairros oficiais de SP
- **Gráficos**: Recharts
- **Backend** (futuro): FastAPI + PostgreSQL + PostGIS
- **Scrapers** (futuro): Python + Playwright
- **Deploy**: VPS Hostinger + Docker Compose

## Status atual

**Fase 1 — MVP de interface com dados fictícios.** Mapa, filtros, comparador e tema claro/escuro funcionando com mocks. Sem backend, sem scraping ainda.

Veja [`docs/ROADMAP.md`](docs/ROADMAP.md) para as próximas fases.

## Setup local

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Estrutura

```
moradai/
├── docs/              Documentação de arquitetura, dados, design
├── frontend/          Next.js app (MVP atual)
├── backend/           API (futuro — Fase 3+)
└── scrapers/          Coleta de dados (futuro — Fase 3+)
```

## Princípios de design

- **Editorial, não dashboard.** Inspirado em [justadesignlist.com](https://www.justadesignlist.com). Tipografia faz o trabalho pesado. Pouca cor, muito espaço.
- **Sem login.** Ninguém quer colocar salário num site que pede cadastro. Tudo roda no cliente, dados sensíveis nunca saem do navegador.
- **Honesto sobre incerteza.** Quando um dado é estimativa, deixa claro.

## Licença

A definir.
