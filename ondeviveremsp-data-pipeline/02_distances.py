"""
02_distances.py
───────────────
Calcula matriz 96x96 de distâncias e tempos entre todos os bairros.

Como o Distance Matrix API permite até 25 origens × 25 destinos por request,
fazemos em batches.

Para cada par origem-destino, calculamos 2 cenários de tempo:
  - Fora de pico (departure_time = sábado 10h)
  - Pico (departure_time = quarta 8h)

CUSTO: 9.216 elementos × US$ 5/1000 × 2 cenários = ~US$ 92 = R$ 480
ALTERNATIVA mais barata: só 1 cenário = R$ 240

O script PERGUNTA antes de gastar acima de um limite.

Saída: output/distancias.json
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
MAX_ELEMENTS = int(os.getenv("MAX_DISTANCE_ELEMENTS", "15000"))

if not API_KEY:
    raise SystemExit("ERRO: configure GOOGLE_API_KEY no arquivo .env")

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

# Distance Matrix API limit: 25 origens × 25 destinos
BATCH_SIZE = 10

# Configuração: rodar apenas com cenário de fora de pico (mais barato)
# Para incluir pico também, troque para True (DOBRA o custo)
INCLUIR_HORARIO_PICO = False

# Próxima quarta-feira às 8h (horário de pico)
def proxima_quarta_8h():
    hoje = datetime.now()
    dias_ate_quarta = (2 - hoje.weekday()) % 7
    if dias_ate_quarta == 0:
        dias_ate_quarta = 7
    quarta = hoje + timedelta(days=dias_ate_quarta)
    return quarta.replace(hour=8, minute=0, second=0, microsecond=0)


def proxima_sabado_10h():
    hoje = datetime.now()
    dias_ate_sabado = (5 - hoje.weekday()) % 7
    if dias_ate_sabado == 0:
        dias_ate_sabado = 7
    sabado = hoje + timedelta(days=dias_ate_sabado)
    return sabado.replace(hour=10, minute=0, second=0, microsecond=0)


def chamar_distance_matrix(origens, destinos, departure_time=None, mode="driving"):
    """Chama Distance Matrix API com batch de até 25x25."""
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    
    origins_str = "|".join(f"{o['lat']},{o['lng']}" for o in origens)
    destinations_str = "|".join(f"{d['lat']},{d['lng']}" for d in destinos)

    params = {
        "origins": origins_str,
        "destinations": destinations_str,
        "key": API_KEY,
        "mode": mode,
        "language": "pt-BR",
        "region": "br",
        "units": "metric",
    }

    if departure_time:
        params["departure_time"] = int(departure_time.timestamp())
        params["traffic_model"] = "best_guess"

    response = requests.get(url, params=params, timeout=30)
    return response.json()


def confirmar_custo(num_elementos: int, scenarios: int):
    custo_usd = (num_elementos * scenarios) / 1000 * 5
    custo_brl = custo_usd * 5.2  # cotação aproximada

    print()
    print(f"════════════════════════════════════════════════════════")
    print(f" CONFIRMAÇÃO DE CUSTO")
    print(f"════════════════════════════════════════════════════════")
    print(f" Elementos a calcular:  {num_elementos:,}")
    print(f" Cenários (horários):   {scenarios}")
    print(f" Total de requisições:  {num_elementos * scenarios:,}")
    print(f" Custo estimado USD:    ${custo_usd:.2f}")
    print(f" Custo estimado BRL:    R$ {custo_brl:.2f}")
    print(f"════════════════════════════════════════════════════════")
    print()

    if (num_elementos * scenarios) > MAX_ELEMENTS:
        print(f"⚠ ATENÇÃO: vai ultrapassar MAX_DISTANCE_ELEMENTS={MAX_ELEMENTS}")
        print("  Defina um valor maior no .env se quiser continuar.")

    resp = input("Confirma execução? (digite 'sim' para continuar): ").strip().lower()
    if resp != "sim":
        print("Abortado.")
        sys.exit(0)


def main():
    # Carrega bairros geocodificados
    bairros_path = OUTPUT_DIR / "bairros-geocoded.json"
    if not bairros_path.exists():
        raise SystemExit(f"ERRO: rode 01_geocode.py primeiro (faltando {bairros_path})")

    with open(bairros_path, encoding="utf-8") as f:
        bairros = json.load(f)

    bairros = [b for b in bairros if b["lat"] is not None]
    n = len(bairros)
    total_elementos = n * n
    scenarios = 2 if INCLUIR_HORARIO_PICO else 1

    confirmar_custo(total_elementos, scenarios)

    # Mapa id -> índice
    idx = {b["id"]: i for i, b in enumerate(bairros)}

    # Matrizes resultantes
    matriz_normal = [[None] * n for _ in range(n)]
    matriz_pico = [[None] * n for _ in range(n)] if INCLUIR_HORARIO_PICO else None

    horario_normal = proxima_sabado_10h()
    horario_pico = proxima_quarta_8h() if INCLUIR_HORARIO_PICO else None

    print(f"\nHorário normal (referência): {horario_normal.strftime('%A %H:%M')}")
    if INCLUIR_HORARIO_PICO:
        print(f"Horário pico (referência):   {horario_pico.strftime('%A %H:%M')}")

    print()

    # Calcula em batches de 25x25
    batches_origens = [bairros[i:i + BATCH_SIZE] for i in range(0, n, BATCH_SIZE)]
    batches_destinos = [bairros[i:i + BATCH_SIZE] for i in range(0, n, BATCH_SIZE)]

    total_batches = len(batches_origens) * len(batches_destinos)
    progress = tqdm(total=total_batches, desc="Cenário normal")

    for batch_o in batches_origens:
        for batch_d in batches_destinos:
            try:
                resultado = chamar_distance_matrix(batch_o, batch_d, departure_time=horario_normal)
                
                if resultado["status"] != "OK":
                    print(f"\n⚠ API retornou {resultado['status']}: {resultado.get('error_message', '')}")
                    continue

                for i, row in enumerate(resultado["rows"]):
                    origem_id = batch_o[i]["id"]
                    i_idx = idx[origem_id]
                    for j, element in enumerate(row["elements"]):
                        destino_id = batch_d[j]["id"]
                        j_idx = idx[destino_id]
                        
                        if element["status"] == "OK":
                            matriz_normal[i_idx][j_idx] = {
                                "distancia_metros": element["distance"]["value"],
                                "tempo_segundos": element.get("duration_in_traffic", element["duration"])["value"],
                            }
                        else:
                            matriz_normal[i_idx][j_idx] = None
                
                progress.update(1)
                time.sleep(0.2)  # respeitar QPS limit

            except Exception as e:
                print(f"\n⚠ Erro: {e}")
                time.sleep(2)

    progress.close()

    # Cenário pico (se habilitado)
    if INCLUIR_HORARIO_PICO:
        progress = tqdm(total=total_batches, desc="Cenário pico")
        for batch_o in batches_origens:
            for batch_d in batches_destinos:
                try:
                    resultado = chamar_distance_matrix(batch_o, batch_d, departure_time=horario_pico)
                    if resultado["status"] != "OK":
                        continue
                    for i, row in enumerate(resultado["rows"]):
                        origem_id = batch_o[i]["id"]
                        i_idx = idx[origem_id]
                        for j, element in enumerate(row["elements"]):
                            destino_id = batch_d[j]["id"]
                            j_idx = idx[destino_id]
                            if element["status"] == "OK":
                                matriz_pico[i_idx][j_idx] = {
                                    "distancia_metros": element["distance"]["value"],
                                    "tempo_segundos": element.get("duration_in_traffic", element["duration"])["value"],
                                }
                    progress.update(1)
                    time.sleep(0.2)
                except Exception as e:
                    print(f"\n⚠ Erro: {e}")
        progress.close()

    # Converte matriz em dicionário aninhado pra fácil consulta no frontend
    distancias = {}
    for i, origem in enumerate(bairros):
        distancias[origem["id"]] = {}
        for j, destino in enumerate(bairros):
            entry = {
                "normal": matriz_normal[i][j],
            }
            if INCLUIR_HORARIO_PICO:
                entry["pico"] = matriz_pico[i][j]
            distancias[origem["id"]][destino["id"]] = entry

    output = {
        "gerado_em": datetime.now().isoformat(),
        "horario_referencia_normal": horario_normal.isoformat(),
        "horario_referencia_pico": horario_pico.isoformat() if INCLUIR_HORARIO_PICO else None,
        "tem_pico": INCLUIR_HORARIO_PICO,
        "bairros": [b["id"] for b in bairros],
        "distancias": distancias,
    }

    output_path = OUTPUT_DIR / "distancias.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    tamanho_kb = output_path.stat().st_size / 1024
    print(f"\n✓ Matriz salva: {output_path} ({tamanho_kb:.1f} KB)")
    print(f"  {n}×{n} = {n*n:,} entradas")


if __name__ == "__main__":
    main()
