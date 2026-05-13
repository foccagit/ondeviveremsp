# CLAUDE.md

Contexto do projeto pro Claude Code. Lê isso antes de qualquer task.

## O que é o projeto

`moradai` — comparador de bairros de São Paulo focado em custo de vida total (aluguel + condomínio + transporte) cruzado com perfil de estilo de vida. Sem login, dados públicos, foco em ajudar quem está se mudando a tomar uma decisão informada.

## Stack obrigatória

- Next.js 14+ com App Router (não Pages Router)
- React 18+
- CSS Modules (NÃO Tailwind, NÃO styled-components)
- TypeScript opcional — começar em JS puro pra ir rápido, migrar depois se necessário
- Leaflet via `react-leaflet` para mapas
- Recharts para gráficos
- Zero dependências de UI kit (sem MUI, sem shadcn, sem Chakra)

## Princípios de design

Referência visual: [justadesignlist.com](https://www.justadesignlist.com)

- **Paleta**: preto e branco puros. Acentos em cinza. Sem cor decorativa.
- **Fontes** (Google Fonts):
  - `Instrument Serif` — títulos display e citações
  - `Geist` — UI, corpo, navegação
  - `JetBrains Mono` — números, dados, código, metadados
- **Espaço em branco generoso.** Mobile-first.
- **Tema claro e escuro.** Toggle manual + respeita `prefers-color-scheme` na primeira visita. Preferência persiste em localStorage.
- **Sem sombras, sem gradientes, sem bordas arredondadas exageradas.** Linhas finas, hairlines (`1px solid`).
- **Animações sutis.** Transições de 150-200ms, easing natural.

## Tokens de design (referência)

Definir em `frontend/src/styles/tokens.css` como CSS variables, alternando em `[data-theme="dark"]`:

```css
:root {
  --color-bg: #ffffff;
  --color-fg: #000000;
  --color-muted: #6b6b6b;
  --color-border: #e5e5e5;
  --color-surface: #fafafa;

  --font-display: 'Instrument Serif', serif;
  --font-body: 'Geist', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-sm: 2px;
  --radius-md: 4px;

  --transition: 180ms ease;
}

[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-fg: #fafafa;
  --color-muted: #909090;
  --color-border: #1f1f1f;
  --color-surface: #141414;
}
```

## Estrutura de pastas (frontend)

```
frontend/
├── public/
│   └── data/
│       └── bairros-sp.geojson     # GeoJSON dos bairros (mock inicial)
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.js
│   │   ├── page.js                # home: mapa + filtros
│   │   ├── comparar/
│   │   │   └── page.js            # tela de comparação
│   │   └── globals.css
│   ├── components/
│   │   ├── Map/                   # mapa Leaflet + camadas
│   │   ├── Filters/               # painel de filtros
│   │   ├── NeighborhoodCard/      # card de bairro
│   │   ├── Compare/               # tabela comparativa
│   │   ├── ThemeToggle/
│   │   └── Layout/                # header, footer
│   ├── data/                      # mocks JSON
│   │   ├── bairros.json           # dados fictícios dos bairros
│   │   └── transporte.json        # custos estimados
│   ├── hooks/
│   │   ├── useTheme.js
│   │   └── useFilters.js
│   ├── lib/                       # funções utilitárias puras
│   │   ├── calcularCusto.js
│   │   └── format.js              # formatadores BR (R$, km, etc)
│   └── styles/
│       ├── tokens.css
│       └── reset.css
└── package.json
```

## Convenções de código

- Componentes em PascalCase, um por pasta, com `index.js` + `styles.module.css`
- Hooks em camelCase começando com `use`
- Funções utilitárias puras em `lib/`, testáveis isoladamente
- Idioma do código: **inglês para nomes técnicos, português para conteúdo de UI** (labels, mensagens)
- Comentários só onde necessário, não óbvio
- Sem `any` se migrar pra TS

## Dados fictícios — o que importa

Os mocks devem ser **plausíveis**, não aleatórios. Bairros caros como Itaim Bibi e Jardins precisam ter aluguel alto coerente. Bairros periféricos com aluguel baixo mas transporte caro. Isso valida o conceito visualmente.

Dados mínimos por bairro:
- `id`, `nome`, `zona` (norte/sul/leste/oeste/centro)
- `aluguelMedioM2` (R$/m²)
- `condominioMedio` (R$)
- `renda` (renda média familiar)
- `populacao`
- `seguranca` (índice 0-100, 100 = mais seguro)
- `metro` (boolean — tem estação?)
- `vidaNoturna` (0-10)
- `comercio` (0-10)
- `parques` (0-10)
- `descricao` (texto curto sobre o "vibe")
- `geometria` (vai no GeoJSON separado)

## Idioma

UI em **português brasileiro**. Código, commits, comentários em **inglês**.

## O que NÃO fazer agora

- Não criar backend
- Não fazer scraping
- Não integrar APIs reais (IBGE, SSP, etc) — só mocks
- Não implementar autenticação
- Não usar bibliotecas pesadas de UI

## Próximas fases (referência, não fazer agora)

Ver `docs/ROADMAP.md`.
