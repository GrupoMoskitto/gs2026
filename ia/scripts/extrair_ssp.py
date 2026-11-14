"""Lê as bases da SSP-SP em ia/docs/ e grava só dados agregados em ia/data/.

Uso: .venv/bin/python scripts/extrair_ssp.py   (de dentro de ia/)
As planilhas brutas não vão para o Git (endereços, placas). Veja o README para baixar.
"""

import json
import sys
import time
from pathlib import Path

PASTA_IA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PASTA_IA))

from risco.lugares import carregar_lugares  # noqa: E402
from risco.ssp import extrair  # noqa: E402


def main() -> None:
    docs, dados = PASTA_IA / "docs", PASTA_IA / "data"
    dados.mkdir(exist_ok=True)
    arquivos = {
        "celular": sorted(docs.glob("CelularesSubtraidos_*.xlsx")),
        "veiculo": sorted(docs.glob("VeiculosSubtraidos_*.xlsx")),
    }
    if not any(arquivos.values()):
        sys.exit("Nenhuma planilha em ia/docs/. Baixe as bases no portal da SSP-SP (ver README).")
    for tipo, lista in arquivos.items():
        print(f"{tipo}: {', '.join(p.name for p in lista)}")

    inicio = time.time()
    lugares = carregar_lugares()
    agregado, resumo = extrair(
        arquivos, lugares, progresso=lambda n, nome: print(f"  {n:>9,} linhas lidas ({nome})", flush=True)
    )

    lugares.to_csv(dados / "lugares.csv", index=False)
    agregado.to_csv(dados / "roubos_agregados.csv", index=False)
    resumo.pop("por_hora").to_csv(dados / "roubos_por_hora.csv", index=False)
    resumo["arquivos"] = {t: [p.name for p in lista] for t, lista in arquivos.items()}
    (dados / "extracao_resumo.json").write_text(json.dumps(resumo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(resumo, ensure_ascii=False, indent=2))
    print(f"lugares com roubo: {agregado.bairro.nunique()} de {len(lugares)}")
    print(f"pronto em {time.time() - inicio:.0f} s")


if __name__ == "__main__":
    main()
