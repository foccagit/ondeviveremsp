# Backend — moradai

**Não implementado ainda.** Esta pasta está aqui como placeholder para a Fase 3+ do roadmap.

## Stack planejada

- FastAPI (Python)
- PostgreSQL + PostGIS
- Redis (cache)
- Docker Compose para deploy no VPS Hostinger

## Endpoints planejados

```
GET  /api/bairros                    Lista todos os bairros com métricas agregadas
GET  /api/bairros/{id}               Detalhes de um bairro
GET  /api/bairros/{id}/aluguel       Histórico de aluguel
POST /api/comparar                   Recebe ids[] e filtros, retorna comparação computada
GET  /api/poi/{bairro_id}            POIs num raio do bairro
```

Ver `../docs/ROADMAP.md` para o cronograma.
