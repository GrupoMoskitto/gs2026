"""Lê as três bases da SSP-SP (celulares, veículos e objetos) e grava o perfil agregado dos roubos.

Uso: .venv/bin/python scripts/extrair_perfil.py   (de dentro de ia/, depois do extrair_ssp.py)
Saída: data/perfil_roubos.json. Usa o mesmo período de data/extracao_resumo.json.
A base de objetos tem ~1,5 GB por ano; a leitura leva bastante tempo, mas a memória fica pequena.
"""

import json
import sys
import time
from datetime import date
from pathlib import Path

PASTA_IA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PASTA_IA))

from risco.lugares import carregar_lugares  # noqa: E402
from risco.perfil import conferir_cabecalhos, ler_bos, resumir  # noqa: E402


def main() -> None:
    docs, dados = PASTA_IA / "docs", PASTA_IA / "data"
    arquivos = {
        "celular": sorted(docs.glob("CelularesSubtraidos_*.xlsx")),
        "veiculo": sorted(docs.glob("VeiculosSubtraidos_*.xlsx")),
        "objetos": sorted(docs.glob("ObjetosSubtraidos_*.xlsx")),
    }
    if not arquivos["objetos"]:
        sys.exit("Falta a base de objetos (ObjetosSubtraidos_*.xlsx) em ia/docs/.")
    periodo = json.loads((dados / "extracao_resumo.json").read_text())["periodo"]
    fim = date.fromisoformat(periodo["fim"])

    conferir_cabecalhos(arquivos)
    inicio = time.time()
    rmsp = set(carregar_lugares().cod_ibge)
    bos, etapas = ler_bos(arquivos, rmsp, fim, progresso=lambda n, nome: print(f"  {n:>11,} linhas ({nome}, {time.time() - inicio:.0f} s)", flush=True))
    perfil = {"periodo": periodo, "arquivos": {b: [p.name for p in l] for b, l in arquivos.items()}, "etapas": dict(etapas), **resumir(bos)}
    (dados / "perfil_roubos.json").write_text(json.dumps(perfil, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: perfil[k] for k in ("etapas", "total_bos", "cobertura", "levados", "conduta", "local")}, ensure_ascii=False, indent=1))
    print(f"pronto em {time.time() - inicio:.0f} s")


if __name__ == "__main__":
    main()
