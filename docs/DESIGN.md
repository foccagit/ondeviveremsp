# Design

## Referência visual

[justadesignlist.com](https://www.justadesignlist.com) — editorial, minimalista, tipografia como protagonista.

## Princípios

1. **Tipografia é UI.** Hierarquia clara, contraste forte entre serif (display) e sans (corpo).
2. **Branco é cor.** Espaço negativo generoso. Densidade de informação só onde necessário.
3. **Sem decoração.** Sem ícones decorativos, sem ilustrações, sem gradientes, sem sombras coloridas.
4. **Hairlines.** Linhas de 1px em cinza muito claro separam seções. Sem cards com sombra.
5. **Dados destacados em mono.** Números, valores, métricas em JetBrains Mono. Reforça a sensação de "informação concreta".

## Paleta

| Token             | Light    | Dark     | Uso                          |
| ----------------- | -------- | -------- | ---------------------------- |
| `--color-bg`      | #ffffff  | #0a0a0a  | Fundo principal              |
| `--color-fg`      | #000000  | #fafafa  | Texto principal              |
| `--color-muted`   | #6b6b6b  | #909090  | Texto secundário, metadados  |
| `--color-border`  | #e5e5e5  | #1f1f1f  | Hairlines, divisores         |
| `--color-surface` | #fafafa  | #141414  | Cards, hover states          |

Sem cor de "destaque" ou "primária". Se precisar de ênfase visual, usa peso da fonte ou tamanho.

## Tipografia

| Token              | Família                          | Uso                                |
| ------------------ | -------------------------------- | ---------------------------------- |
| `--font-display`   | Instrument Serif                 | H1, hero, citações                 |
| `--font-body`      | Geist                            | Corpo, navegação, botões, labels   |
| `--font-mono`      | JetBrains Mono                   | Números, valores, metadados, tags  |

### Escala

```css
--text-xs:   12px / 1.4   /* metadados, captions */
--text-sm:   14px / 1.5   /* corpo secundário */
--text-base: 16px / 1.6   /* corpo principal */
--text-lg:   20px / 1.4   /* subtítulos */
--text-xl:   28px / 1.3   /* H2 */
--text-2xl:  40px / 1.2   /* H1 */
--text-3xl:  64px / 1.1   /* hero (display, serif) */
```

## Espaçamento

Sistema de 4px:
```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px
```

## Componentes-chave

### Botão
- Sem fundo por padrão
- Texto sublinhado on hover
- Variante "primário": fundo `--color-fg`, texto `--color-bg`

### Input
- Sem fundo, hairline embaixo
- Foco: hairline mais grossa (1.5px) ou cor `--color-fg`

### Card de bairro
- Sem fundo, sem sombra
- Hairline em cima e embaixo
- Nome em display serif, dados em mono

### Toggle de tema
- Mínimo, em mono ("dark" / "light" ou um símbolo)
- Canto superior direito do header
