# Prompt para Claude Code — Fase 1 (MVP Frontend)

Cole este prompt no Claude Code rodando na raiz do projeto (`moradai/`). Antes disso, garanta que:

1. Você já leu este arquivo, o `CLAUDE.md` e o `docs/DESIGN.md`
2. Está em uma branch nova (`git checkout -b feat/mvp-frontend`)

---

## Prompt

> Leia `CLAUDE.md`, `docs/DESIGN.md` e `docs/ROADMAP.md` antes de começar. Eles contêm contexto obrigatório sobre stack, tokens, fontes e princípios visuais.
>
> Sua tarefa é construir a **Fase 1** do `moradai`: um frontend Next.js completo com dados fictícios, dentro da pasta `frontend/`. Sem backend, sem APIs reais. Tudo deve rodar com `npm run dev`.
>
> ### Setup
>
> 1. Inicialize Next.js 14 com App Router dentro de `frontend/`:
>    - JavaScript puro (não TypeScript)
>    - CSS Modules (NÃO Tailwind)
>    - ESLint sim, sem `src/` flag — usar estrutura `frontend/src/app/`
>    - Sem `import alias` automático, configurar manualmente `@/*` apontando para `src/*`
> 2. Instale dependências adicionais: `leaflet`, `react-leaflet`, `recharts`
> 3. Importe as fontes via `next/font/google`: `Instrument_Serif`, `Geist`, `JetBrains_Mono`
>
> ### Tokens e tema
>
> Crie `src/styles/tokens.css` com as CSS variables definidas em `CLAUDE.md` (paleta light/dark + fontes + espaçamento + escala tipográfica).
>
> Crie `src/styles/reset.css` com um reset moderno (margin/padding zero, box-sizing border-box, font inheritance, smooth scrolling, image responsiva).
>
> Importe ambos em `src/app/globals.css`. O `<html>` recebe `data-theme="light"` ou `data-theme="dark"`.
>
> ### Tema claro/escuro
>
> Crie hook `src/hooks/useTheme.js`:
> - Lê preferência do `localStorage` (chave `moradai-theme`)
> - Se não tiver, usa `prefers-color-scheme`
> - Aplica `data-theme` no `<html>`
> - Retorna `{ theme, toggleTheme }`
>
> Crie componente `src/components/ThemeToggle/` (index.js + styles.module.css):
> - Botão minimalista em JetBrains Mono mostrando o estado oposto ("dark" no claro, "light" no escuro)
> - Sem ícone, só texto
>
> ### Dados fictícios
>
> Crie `src/data/bairros.json` com **30 bairros plausíveis de São Paulo** (não precisa dos 96 ainda — começamos com os mais conhecidos). Inclua bairros caros (Itaim Bibi, Jardins, Pinheiros, Vila Olímpia, Vila Madalena, Moema, Perdizes), médios (Tatuapé, Santana, Brooklin, Vila Mariana, Saúde, Bela Vista, Liberdade, Consolação), e mais acessíveis (Sapopemba, Itaquera, São Miguel Paulista, Jardim Ângela, Capão Redondo, M'Boi Mirim, Cidade Tiradentes, Ermelino Matarazzo, Brasilândia, Vila Jacuí, Pirituba, Freguesia do Ó, Lapa, Penha, Mooca).
>
> Schema por bairro:
> ```json
> {
>   "id": "itaim-bibi",
>   "nome": "Itaim Bibi",
>   "zona": "oeste",
>   "aluguelMedioM2": 95,
>   "condominioMedio": 1200,
>   "renda": 18500,
>   "populacao": 95000,
>   "seguranca": 78,
>   "metro": true,
>   "vidaNoturna": 9,
>   "comercio": 9,
>   "parques": 6,
>   "descricao": "Coração corporativo e gastronômico de SP. Caro, movimentado, com vida noturna intensa e comércio premium. Bom transporte mas trânsito pesado.",
>   "lat": -23.5836,
>   "lng": -46.6736
> }
> ```
>
> **Importante**: os dados devem ser coerentes. Aluguel/m² alto onde renda é alta. Bairros sem metrô (`metro: false`) na maioria das zonas periféricas. Segurança baixa em bairros notoriamente complicados. Use senso comum e conhecimento público sobre SP.
>
> Crie também `src/data/transporte.json`:
> ```json
> {
>   "uber": { "tarifaBase": 7, "porKm": 2.8 },
>   "metro": { "passagem": 5, "viagensPorMes": 44 },
>   "onibus": { "passagem": 5, "viagensPorMes": 44 },
>   "carro": { "custoFixoMensal": 1200, "porKm": 0.85 }
> }
> ```
>
> ### GeoJSON dos bairros
>
> Crie `frontend/public/data/bairros-sp.geojson` com **polígonos simplificados** (não precisa ser geograficamente preciso ainda — pode ser quadrados/retângulos aproximados ao redor das coordenadas centrais de cada bairro). Cada feature tem `properties.id` matching o ID do `bairros.json`.
>
> ### Layout geral
>
> `src/app/layout.js`:
> - Aplica as 3 fontes via `next/font/google` como CSS variables
> - Carrega tokens e reset
> - `<body>` com `--font-body` como base
>
> Componente `src/components/Layout/Header.jsx`:
> - Linha única, hairline embaixo
> - Esquerda: "moradai" em Instrument Serif, 24px
> - Centro: navegação ("Mapa", "Comparar") em Geist 14px
> - Direita: ThemeToggle
> - Padding generoso (24px vertical, 32px horizontal)
>
> Componente `src/components/Layout/Footer.jsx`:
> - Hairline em cima
> - Texto pequeno em mono: "Dados fictícios — MVP" + ano + link genérico
>
> ### Página inicial (`src/app/page.js`)
>
> Layout em duas colunas no desktop, stack no mobile:
>
> **Coluna esquerda (40% no desktop, 100% no mobile)**: `<Filters />`
>
> **Coluna direita (60%)**: `<Map />` + abaixo `<ResultsList />`
>
> No topo da página, antes das colunas, um hero curto:
> - Título em Instrument Serif 64px (40px no mobile): "Onde morar em São Paulo"
> - Subtítulo em Geist 18px, cor `--color-muted`: "Compare bairros pelo custo total real — aluguel, transporte e estilo de vida."
> - Padding vertical generoso (80px no desktop, 48px no mobile)
>
> ### Componente Filters
>
> `src/components/Filters/index.jsx` + `styles.module.css`:
>
> Estado controlado via hook `useFilters` (em `src/hooks/useFilters.js`) com:
> - `salario` (number, default 8000)
> - `bairroTrabalho` (string id, default "itaim-bibi")
> - `transporte` (enum: "metro", "uber", "carro", "onibus", default "metro")
> - `prioridades` (array de: "vidaNoturna", "comercio", "parques", "seguranca", "metro")
>
> UI:
> - Cada filtro num bloco separado, com label pequena em mono uppercase e o input embaixo
> - Inputs sem fundo, com hairline embaixo (não input box completo)
> - Salário: number input, formato R$
> - Bairro de trabalho: select com lista de bairros
> - Transporte: 4 botões em linha, o ativo fica com texto em `--color-fg` e linha embaixo, os outros em `--color-muted`
> - Prioridades: lista de checkboxes minimalistas (quadrado vazio/preenchido em hairline)
>
> ### Componente Map
>
> `src/components/Map/index.jsx`:
>
> Como Leaflet não roda no SSR, importe dinamicamente:
> ```js
> import dynamic from 'next/dynamic';
> const MapInner = dynamic(() => import('./MapInner'), { ssr: false });
> ```
>
> `src/components/Map/MapInner.jsx`:
> - Carrega o GeoJSON via fetch de `/data/bairros-sp.geojson`
> - Tile layer **monocromático** — use Stadia Maps Stamen Toner Lite ou CartoDB Positron (light) / DarkMatter (dark), trocando conforme o tema
> - Centro em São Paulo (-23.55, -46.63), zoom 11
> - Cada polígono de bairro: stroke `--color-fg` 1px, fill transparente
> - Hover: fill `--color-fg` com opacity 0.1
> - Click no bairro: dispara callback que atualiza um estado global de "bairro selecionado"
> - Tooltip mostra nome + aluguel médio em mono
>
> Altura do mapa: 500px desktop, 350px mobile.
>
> ### Lista de resultados
>
> `src/components/NeighborhoodCard/index.jsx`:
>
> Card minimalista (sem fundo, hairline em cima e embaixo):
> - Linha 1: nome do bairro (Instrument Serif 28px) + zona (mono 12px uppercase, cor muted)
> - Linha 2: descrição curta (Geist 14px, máx 2 linhas)
> - Linha 3 (grid de 4 colunas): aluguel total estimado, transporte/mês, custo total, "score" do estilo de vida
>   - Cada métrica: label pequena em mono uppercase + valor grande em mono
> - Botão "Comparar" no canto direito (texto, sem fundo, sublinhado on hover)
>
> O cálculo do custo total deve viver em `src/lib/calcularCusto.js`:
> ```js
> export function calcularCustoTotal(bairro, filtros, bairroTrabalho, dadosTransporte) {
>   // assume aluguel para apto de 50m²
>   const aluguel = bairro.aluguelMedioM2 * 50;
>   const condominio = bairro.condominioMedio;
>
>   // distância euclidiana entre lat/lng × ~111km, multiplicada por 1.3 (fator urbano)
>   const distanciaKm = calcularDistancia(bairro, bairroTrabalho) * 1.3;
>
>   const transporte = calcularTransporte(distanciaKm, filtros.transporte, dadosTransporte);
>
>   return {
>     aluguel,
>     condominio,
>     transporte,
>     total: aluguel + condominio + transporte
>   };
> }
> ```
>
> Função `calcularScore(bairro, prioridades)` em `src/lib/calcularCusto.js`:
> Soma as métricas que o usuário marcou como prioridade, normaliza para 0-100.
>
> `ResultsList` (em `src/app/page.js` mesmo ou componente separado):
> - Ordena bairros por melhor match (menor custo total que cabe no salário + maior score de prioridades)
> - Mostra top 10
> - Filtra fora bairros onde custo total > 35% do salário (rule of thumb)
>
> ### Página de comparação (`src/app/comparar/page.js`)
>
> Recebe `?ids=itaim-bibi,vila-madalena,tatuape` via search params.
>
> Layout: até 3 colunas (uma por bairro), cada uma com:
> - Nome em display serif 40px
> - Bloco de métricas em grid:
>   - Aluguel/m²
>   - Aluguel estimado (50m²)
>   - Condomínio
>   - Custo transporte mensal (calculado com base nos filtros — assumir os mesmos do localStorage)
>   - Custo total
>   - Renda média
>   - População
>   - Score segurança
>   - Tem metrô?
>   - Vida noturna (0-10)
>   - Comércio (0-10)
>   - Parques (0-10)
> - Cada métrica: label em mono uppercase + valor em mono grande, hairline embaixo
>
> Abaixo das colunas, gráfico de barras Recharts comparando "custo total mensal" dos 3 bairros. Sem cor — barras pretas no light, brancas no dark.
>
> Botão "Voltar ao mapa" no topo.
>
> ### Estado de comparação
>
> Gerenciado via Context API simples em `src/lib/CompareContext.js`:
> - `bairrosSelecionados: string[]` (máx 3)
> - `addBairro(id)`, `removeBairro(id)`, `clear()`
>
> Persistir em `localStorage` (`moradai-compare`).
>
> Botão "Comparar" no card adiciona ao contexto. Se chegou a 3, desabilita.
>
> Um botão fixo no canto inferior direito (só aparece se tiver >= 2 bairros): "Comparar (N)" — link para `/comparar?ids=...`.
>
> ### Formatadores
>
> Em `src/lib/format.js`:
> - `formatBRL(value)` → `R$ 1.250`
> - `formatNumber(value)` → `1.250`
> - `formatM2(value)` → `R$ 95/m²`
>
> Usar em todos os números exibidos.
>
> ### Responsividade
>
> Breakpoints em mobile-first:
> - Mobile: até 767px (default)
> - Tablet: 768px+
> - Desktop: 1024px+
>
> No mobile:
> - Header colapsa nav (sem hamburger, só esconde — voltamos depois)
> - Filtros viram tela cheia abertos via botão "Filtros" no topo
> - Mapa reduz altura
> - Cards de resultado em coluna única
> - Comparação rola horizontalmente
>
> ### Critérios de aceite
>
> - `npm run dev` na pasta `frontend/` sobe sem erro
> - Mapa renderiza com bairros clicáveis
> - Filtros atualizam a lista de resultados em tempo real
> - Tema claro/escuro alterna e persiste no reload
> - É possível selecionar 2-3 bairros e ver a tela `/comparar`
> - Layout não quebra entre 320px e 1920px de largura
> - Nenhum console.error
> - Zero warnings de chave duplicada no React
>
> ### O que NÃO fazer
>
> - Não criar backend
> - Não usar Tailwind, MUI, shadcn, ou qualquer UI kit
> - Não fazer scraping
> - Não integrar nenhuma API externa (exceto tiles do Leaflet)
> - Não adicionar autenticação
> - Não usar TypeScript
> - Não adicionar `framer-motion` ou bibliotecas de animação — transições só com CSS
>
> Pode começar. Pergunte se tiver decisão ambígua, mas tente decidir sozinho onde for óbvio pelo contexto deste documento e do `CLAUDE.md`.

---

## Depois desse prompt

Quando o Claude Code terminar, faça:

1. `cd frontend && npm run dev` — confere visual
2. Testa: troca tema, clica em bairros no mapa, abre `/comparar`
3. Commit: `git add . && git commit -m "feat: MVP frontend with mock data"`
4. Próximo prompt no Claude Code será **substituir o GeoJSON mock pelo oficial do GeoSampa** (Fase 2)
