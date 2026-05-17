"""
03_places.py v3
────────────────
Busca POIs (Points of Interest) ao redor de cada bairro com:
- Tipos específicos por categoria (evita misturar clínica com hospital)
- Raio adaptado por categoria (hospitais 3km, bares 1km, etc.)
- Filtros de exclusão pra evitar lixo
- Pega 10 nomes em vez de 3 (mais opções pra UI)
- Indica "20+" quando atinge cap da API (honestidade)

Correções v3:
- Metrô: aceita subway_station E train_station (CPTM), sem excluir nada
- Parques: raio menor (1.5km) e exclui playgrounds

CUSTO: 96 bairros × 14 categorias = 1.344 requests × US$ 17/1000 = ~US$ 23 = R$ 120

MODO DE TESTE:
- Roda apenas 1 bairro pra validar qualidade antes de gastar
- Use: python 03_places.py --test pinheiros

Saída: output/pois.json
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
MAX_REQUESTS = int(os.getenv("MAX_PLACES_REQUESTS", "2000"))

if not API_KEY:
    raise SystemExit("ERRO: configure GOOGLE_API_KEY no arquivo .env")

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

# Configuração de categorias com tipos específicos e raio adaptado
# Documentação: https://developers.google.com/maps/documentation/places/web-service/place-types
CATEGORIAS = {
    # Categorias com poucos resultados reais (raio maior)
    "hospitais": {
        "primary_types": ["hospital"],
        "excluded_types": ["pharmacy", "doctor", "dental_clinic", "physiotherapist"],
        "raio": 3000,
        "modo": "nomes",
    },
    "shoppings": {
        "primary_types": ["shopping_mall"],
        "excluded_types": ["store", "convenience_store", "clothing_store"],
        "raio": 3000,
        "modo": "nomes",
    },
    "parques": {
        "primary_types": ["park"],
        "excluded_types": ["dog_park", "amusement_park", "playground"],
        "raio": 1500,
        "modo": "nomes",
    },
    "metroEstacoes": {
        "primary_types": ["subway_station", "train_station"],
        "excluded_types": [],
        "raio": 2000,
        "modo": "nomes",
    },
    "museus": {
        "primary_types": ["museum"],
        "excluded_types": [],
        "raio": 3000,
        "modo": "nomes",
    },
    "cinemas": {
        "primary_types": ["movie_theater"],
        "excluded_types": [],
        "raio": 3000,
        "modo": "contagem",
    },
    
    # Categorias com muitos resultados (raio menor, conta total)
    "supermercados": {
        "primary_types": ["supermarket"],
        "excluded_types": ["convenience_store"],
        "raio": 1500,
        "modo": "contagem",
    },
    "barRestaurantes": {
        "primary_types": ["restaurant", "bar"],
        "excluded_types": ["fast_food_restaurant", "meal_takeaway"],
        "raio": 1000,
        "modo": "contagem",
    },
    "padarias": {
        "primary_types": ["bakery"],
        "excluded_types": [],
        "raio": 1500,
        "modo": "contagem",
    },
    "farmacias": {
        "primary_types": ["pharmacy"],
        "excluded_types": [],
        "raio": 1500,
        "modo": "contagem",
    },
    "bancos": {
        "primary_types": ["bank"],
        "excluded_types": ["atm"],
        "raio": 1500,
        "modo": "contagem",
    },
    "postosGasolina": {
        "primary_types": ["gas_station"],
        "excluded_types": [],
        "raio": 2000,
        "modo": "contagem",
    },
    "escolas": {
        "primary_types": ["primary_school", "secondary_school", "school"],
        "excluded_types": ["preschool"],
        "raio": 1500,
        "modo": "contagem",
    },
    "academias": {
        "primary_types": ["gym"],
        "excluded_types": [],
        "raio": 1500,
        "modo": "contagem",
    },
}


def confirmar_custo(num_requests):
    custo_usd = num_requests / 1000 * 17
    custo_brl = custo_usd * 5.2

    print()
    print("════════════════════════════════════════════════════════")
    print(" CONFIRMAÇÃO DE CUSTO — Google Places API v3")
    print("════════════════════════════════════════════════════════")
    print(f" Total de requisições:  {num_requests:,}")
    print(f" Custo estimado USD:    ${custo_usd:.2f}")
    print(f" Custo estimado BRL:    R$ {custo_brl:.2f}")
    print("════════════════════════════════════════════════════════")
    print()

    resp = input("Confirma execução? (digite 'sim' para continuar): ").strip().lower()
    if resp != "sim":
        print("Abortado.")
        sys.exit(0)


def buscar_pois_categoria(lat, lng, config):
    """Busca POIs de uma categoria com configuração específica."""
    url = "https://places.googleapis.com/v1/places:searchNearby"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location,places.primaryType,places.types",
    }
    
    body = {
        "includedPrimaryTypes": config["primary_types"],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(config["raio"]),
            }
        },
        "languageCode": "pt-BR",
        "regionCode": "BR",
    }
    
    if config.get("excluded_types"):
        body["excludedTypes"] = config["excluded_types"]

    response = requests.post(url, headers=headers, json=body, timeout=15)
    
    if response.status_code != 200:
        print(f"  ⚠ Erro {response.status_code}: {response.text[:200]}")
        return []

    data = response.json()
    places = data.get("places", [])
    
    # Deduplicação por nome
    nomes_vistos = set()
    resultados = []
    
    for p in places:
        nome = p.get("displayName", {}).get("text", "").strip()
        if not nome:
            continue
        if nome.lower() in nomes_vistos:
            continue
        nomes_vistos.add(nome.lower())
        resultados.append({
            "nome": nome,
            "primary_type": p.get("primaryType", ""),
        })
    
    return resultados


def processar_bairro(bairro):
    """Processa todas as categorias de um bairro."""
    lat = bairro["lat"]
    lng = bairro["lng"]
    resultado = {}
    
    for categoria, config in CATEGORIAS.items():
        try:
            pois = buscar_pois_categoria(lat, lng, config)
            total = len(pois)
            indicador_cap = total >= 20
            
            if config["modo"] == "nomes":
                resultado[categoria] = {
                    "total": total,
                    "tem_mais": indicador_cap,
                    "nomes": [p["nome"] for p in pois[:10]],
                }
            else:  # contagem
                resultado[categoria] = {
                    "total": total,
                    "tem_mais": indicador_cap,
                }
            
            time.sleep(0.15)
        except Exception as e:
            print(f"  ⚠ Erro em {bairro['nome']}/{categoria}: {e}")
            resultado[categoria] = {"total": 0, "tem_mais": False}
    
    return resultado


def main():
    bairros_path = OUTPUT_DIR / "bairros-geocoded.json"
    if not bairros_path.exists():
        raise SystemExit("ERRO: rode 01_geocode.py primeiro")

    with open(bairros_path, encoding="utf-8") as f:
        bairros = json.load(f)

    bairros = [b for b in bairros if b["lat"] is not None]
    
    if len(sys.argv) > 2 and sys.argv[1] == "--test":
        bairro_id = sys.argv[2]
        bairros_filtrados = [b for b in bairros if b["id"] == bairro_id]
        if not bairros_filtrados:
            raise SystemExit(f"Bairro '{bairro_id}' não encontrado.")
        
        print(f"🧪 MODO DE TESTE — apenas {bairros_filtrados[0]['nome']}")
        print(f"Custo estimado: ~R$ 1 (14 requests)")
        print()
        
        bairros = bairros_filtrados
        modo_teste = True
    else:
        modo_teste = False
        num_requests = len(bairros) * len(CATEGORIAS)
        confirmar_custo(num_requests)

    resultado_pois = {}

    for bairro in tqdm(bairros, desc="Buscando POIs"):
        resultado_pois[bairro["id"]] = processar_bairro(bairro)

    output = {
        "gerado_em": datetime.now().isoformat(),
        "modo_teste": modo_teste,
        "categorias": list(CATEGORIAS.keys()),
        "pois": resultado_pois,
    }

    if modo_teste:
        output_path = OUTPUT_DIR / "pois-teste.json"
    else:
        output_path = OUTPUT_DIR / "pois.json"
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    tamanho_kb = output_path.stat().st_size / 1024
    print(f"\n✓ POIs salvos: {output_path} ({tamanho_kb:.1f} KB)")
    
    if modo_teste:
        print("\n=== RESULTADO DO TESTE ===")
        bairro_teste = bairros[0]
        for cat, dados in resultado_pois[bairro_teste["id"]].items():
            total = dados.get("total", 0)
            indicador = "+" if dados.get("tem_mais") else ""
            nomes = dados.get("nomes", [])
            
            linha = f"  {cat:20s}: {total}{indicador}"
            if nomes:
                linha += f"  →  {', '.join(nomes[:5])}"
                if len(nomes) > 5:
                    linha += f" (+{len(nomes)-5})"
            print(linha)
        
        print("\n📊 Avalie a qualidade. Se OK, rode sem --test pra processar todos.")


if __name__ == "__main__":
    main()
