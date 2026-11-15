"""Gera data/resumo_modelo.json para a aba Risco do app. Depois, no mobile/: npm run modelo

Uso: .venv/bin/python scripts/exportar_app.py   (de dentro de ia/, depois de montar_notebook.py)
"""

import json
import sys
from datetime import date
from pathlib import Path

PASTA_IA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PASTA_IA))

from risco.app import resumo_para_app  # noqa: E402
from web.dados import montar  # noqa: E402


def main() -> None:
    resumo = resumo_para_app(montar(), date.today())
    destino = PASTA_IA / "data" / "resumo_modelo.json"
    destino.write_text(json.dumps(resumo, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{destino.relative_to(PASTA_IA)}: {destino.stat().st_size / 1024:.0f} KB, {len(resumo['lugares'])} lugares")


if __name__ == "__main__":
    main()
