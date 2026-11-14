"""Gera os relatos simulados para a API (formato do AGENTS.md, seção 4), calibrados pelos roubos reais da SSP-SP.

Uso: .venv/bin/python scripts/gerar_relatos.py   (de dentro de ia/, depois de extrair_ssp.py)
"""

import sys
from pathlib import Path

PASTA_IA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PASTA_IA))

import pandas as pd  # noqa: E402

from risco.lugares import BAIRROS_PAULISTA  # noqa: E402
from risco.relatos import gerar_relatos  # noqa: E402


def main() -> None:
    dados = PASTA_IA / "data"
    agregado_csv = dados / "roubos_agregados.csv"
    if not agregado_csv.exists():
        sys.exit("Falta data/roubos_agregados.csv. Rode antes: .venv/bin/python scripts/extrair_ssp.py")
    agregado = pd.read_csv(agregado_csv, parse_dates=["data"])
    lugares = pd.read_csv(dados / "lugares.csv")

    todos = gerar_relatos(agregado, lugares, n=10_000)
    todos.to_csv(dados / "relatos_simulados.csv", index=False)
    # reserva: só os 3 bairros da Av. Paulista, enquanto a API aceitar apenas esses códigos
    paulista = gerar_relatos(agregado, lugares, n=1_000, bairros=list(BAIRROS_PAULISTA))
    paulista.to_csv(dados / "relatos_paulista.csv", index=False)

    print(f"relatos_simulados.csv: {len(todos)} linhas, {todos.bairro.nunique()} lugares")
    print(todos.tipo.value_counts().to_string())
    print(f"relatos_paulista.csv: {len(paulista)} linhas, {sorted(paulista.bairro.unique())}")


if __name__ == "__main__":
    main()
