# Scrapers — moradai

**Não implementado ainda.** Placeholder para Fase 3+.

## Stack planejada

- Python 3.11+
- Playwright (sites SPA como QuintoAndar e Zap)
- httpx (sites estáticos e APIs)
- BeautifulSoup4 + pdfplumber (parsing de PDFs da SSP-SP)
- Schedule via cron no container

## Scrapers planejados

| Scraper          | Fonte                 | Frequência | Status      |
| ---------------- | --------------------- | ---------- | ----------- |
| `quintoandar.py` | QuintoAndar           | Semanal    | Não iniciado |
| `zap.py`         | Zap Imóveis           | Semanal    | Não iniciado |
| `ssp.py`         | SSP-SP (PDFs)         | Mensal     | Não iniciado |
| `overpass.py`    | OpenStreetMap         | Mensal     | Não iniciado |
| `ibge.py`        | IBGE/SEADE (CSV)      | Anual      | Não iniciado |

Cada scraper grava direto no Postgres com timestamp da coleta. Nada acoplado à API.

## Considerações legais

Scraping de imobiliárias está em zona cinza. Estratégia:
- Respeitar `robots.txt`
- Rate limit agressivo (1 request a cada 3-5s)
- User-agent identificado
- Não republicar conteúdo, só agregar estatísticas
- Cache local para reduzir requests
