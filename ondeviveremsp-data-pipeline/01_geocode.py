"""
01_geocode.py
─────────────
Resolve latitude/longitude do centróide de cada bairro de SP.

Custa praticamente nada (96 requests × R$ 0,026 = ~R$ 2,50),
e o free tier de 10.000/mês cobre isso facilmente.

Saída: output/bairros-geocoded.json
"""

import csv
import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise SystemExit("ERRO: configure GOOGLE_API_KEY no arquivo .env")

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)


def geocode(nome_bairro: str) -> "tuple[float, float] | None":
    """Busca lat/lng do bairro no Google Geocoding API."""
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": f"{nome_bairro}, São Paulo, SP, Brasil",
        "key": API_KEY,
        "region": "br",
        "language": "pt-BR",
    }

    response = requests.get(url, params=params, timeout=10)
    data = response.json()

    if data["status"] == "OK" and data["results"]:
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]

    print(f"  ⚠ Não encontrou: {nome_bairro} (status: {data['status']})")
    return None


def main():
    bairros = []
    with open("bairros.csv", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        bairros = list(reader)

    print(f"Geocodificando {len(bairros)} bairros...")
    resultados = []

    for bairro in tqdm(bairros):
        coords = geocode(bairro["nome"])
        if coords:
            lat, lng = coords
            resultados.append({
                "id": bairro["id"],
                "nome": bairro["nome"],
                "zona": bairro["zona"],
                "lat": round(lat, 6),
                "lng": round(lng, 6),
            })
        else:
            resultados.append({
                "id": bairro["id"],
                "nome": bairro["nome"],
                "zona": bairro["zona"],
                "lat": None,
                "lng": None,
            })

        # Rate limit: Google permite até 50 req/sec, mas seguramos a barra
        time.sleep(0.1)

    output_path = OUTPUT_DIR / "bairros-geocoded.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    sem_coords = [r for r in resultados if r["lat"] is None]
    print(f"\n✓ {len(resultados) - len(sem_coords)}/{len(resultados)} bairros geocodificados")
    if sem_coords:
        print(f"⚠ {len(sem_coords)} bairros não encontrados:")
        for b in sem_coords:
            print(f"   - {b['nome']}")
        print("Ajuste manualmente o arquivo bairros-geocoded.json antes de prosseguir.")

    print(f"\nArquivo salvo: {output_path}")


if __name__ == "__main__":
    main()
