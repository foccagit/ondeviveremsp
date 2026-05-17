# Pipeline de Dados — ondeviveremsp

Scripts Python que rodam UMA VEZ no seu Mac, consultam APIs do Google e geram arquivos JSON estáticos pro frontend.

## Filosofia

- **Roda local**, nunca em produção
- **Gera arquivos JSON estáticos** que ficam no projeto
- **Sem servidor**, sem banco de dados
- **Custo previsível**: ~R$ 340 uma vez, depois R$ 0

## Estrutura

```
data-pipeline/
├── README.md
├── requirements.txt
├── .env.example
├── bairros.csv           # lista dos 96 bairros com lat/lng
├── 01_geocode.py         # popula lat/lng dos bairros (caso falte)
├── 02_distances.py       # gera matriz 96x96 de distâncias
├── 03_places.py          # busca POIs de cada bairro
├── 04_descricoes.py      # (opcional) gera descrições via Claude API
└── output/               # arquivos gerados
    ├── distancias.json
    ├── pois.json
    └── descricoes.json
```

## Como usar

1. Configure Google Cloud (veja seção abaixo)
2. Copie `.env.example` pra `.env` e cole sua API key
3. Instale dependências: `pip install -r requirements.txt`
4. Rode os scripts EM ORDEM:
   ```bash
   python 01_geocode.py
   python 02_distances.py
   python 03_places.py
   ```
5. Copie os JSONs gerados pro projeto frontend:
   ```bash
   cp output/*.json ../frontend/public/data/
   ```
6. Commita no git, faz deploy.

## Custo estimado

| Script | API chamada | Custo |
|---|---|---|
| 01_geocode.py | Geocoding × 96 | ~R$ 0 (free tier cobre) |
| 02_distances.py | Distance Matrix × 9.216 elementos | ~R$ 240 |
| 03_places.py | Places API × 1.152 | ~R$ 100 |
| **TOTAL** | | **~R$ 340** |

## Quando re-rodar

- **Distâncias**: a cada 6 meses (tempo de trânsito médio muda com obras, novas linhas de metrô)
- **POIs**: a cada 3 meses (abertura/fechamento de estabelecimentos)
- **Descrições**: anualmente ou quando mudar características do bairro

Para re-rodar, simplesmente execute os scripts de novo. Os arquivos JSON são sobrescritos.

## Setup do Google Cloud

1. Cria projeto em https://console.cloud.google.com
2. Habilita billing
3. Habilita APIs: Distance Matrix, Places, Geocoding
4. Define quotas diárias (limite de gasto):
   - Distance Matrix: 15.000 elementos/dia
   - Places: 2.000 requests/dia
   - Geocoding: 200 requests/dia
5. Cria budget alert em R$ 400
6. Cria API key restringida às 3 APIs acima

## Segurança

- A API key vai em `.env` (já está no `.gitignore`)
- NUNCA commita `.env`
- Depois de rodar o pipeline, **rotaciona a chave** no Console (deleta a velha, cria uma nova)
- Os JSONs gerados são públicos (vão no `public/`) - são só dados de bairros, não tem informação sensível
