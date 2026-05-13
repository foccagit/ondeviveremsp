# Frontend — ondeviveremsp

Next.js 14 (App Router) + React + CSS Modules. Sem dependências de UI kit.

## Setup

Este diretório ainda **não foi inicializado**. Para começar, abra o Claude Code na raiz do projeto e siga o prompt em `docs/PROMPT_CLAUDE_CODE.md`.

Após inicialização, o setup local será:

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Stack

- Next.js 14 (App Router)
- React 18
- CSS Modules
- `react-leaflet` para mapas
- `recharts` para gráficos
- Fontes via `next/font/google`: Instrument Serif, Geist, JetBrains Mono

## Estrutura esperada após Fase 1

```
frontend/
├── public/
│   └── data/
│       └── bairros-sp.geojson
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── globals.css
│   │   └── comparar/
│   │       └── page.js
│   ├── components/
│   │   ├── Map/
│   │   ├── Filters/
│   │   ├── NeighborhoodCard/
│   │   ├── Compare/
│   │   ├── ThemeToggle/
│   │   └── Layout/
│   ├── data/
│   │   ├── bairros.json
│   │   └── transporte.json
│   ├── hooks/
│   │   ├── useTheme.js
│   │   └── useFilters.js
│   ├── lib/
│   │   ├── calcularCusto.js
│   │   ├── format.js
│   │   └── CompareContext.js
│   └── styles/
│       ├── tokens.css
│       └── reset.css
└── package.json
```

## Convenções

Ver `../CLAUDE.md` para regras de stack, design tokens e princípios.
