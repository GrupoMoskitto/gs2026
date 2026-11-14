"""Gera a versão estática do site para publicar sem servidor (qualquer hospedagem de arquivos).

Rodar (de dentro de ia/):  .venv/bin/python web/exportar.py   →  web/dist/

Os dados do site são fixos (saem do notebook), então a página pode ser montada uma vez só.
O HTML estático não tem nonce: a CSP vai numa tag <meta> no próprio HTML e libera cada script
da página pelo hash SHA-256 dele, então a proteção não depende da hospedagem.
"""

import base64
import hashlib
import re
import shutil
from pathlib import Path

try:
    from web.app import app
    from web.dados import PASTA_DADOS
except ImportError:  # rodando como script: python web/exportar.py
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from web.app import app
    from web.dados import PASTA_DADOS

PASTA_WEB = Path(__file__).resolve().parent
DESTINO = PASTA_WEB / "dist"


def _hash(script: str) -> str:
    return "'sha256-" + base64.b64encode(hashlib.sha256(script.encode()).digest()).decode() + "'"


def politica(hashes: list[str]) -> str:
    # frame-ancestors não vale em <meta>
    return (
        "default-src 'self'; "
        f"script-src 'self' {' '.join(hashes)}; "
        "style-src 'self' 'unsafe-inline'; "  # os gráficos pintam cores com style=""
        "img-src 'self' data:; connect-src 'self'; font-src 'self'; "
        "object-src 'none'; base-uri 'none'; form-action 'none'"
    )


def montar_html() -> str:
    """Renderiza a página, tira o nonce e põe a CSP com os hashes dos scripts numa tag <meta>."""
    with app.test_client() as cliente:
        html = cliente.get("/").get_data(as_text=True)
    html = re.sub(r' nonce="[^"]*"', "", html)
    # o JSON de dados não é executado, então não precisa de hash
    hashes = [_hash(corpo) for attrs, corpo in re.findall(r"<script([^>]*)>(.*?)</script>", html, re.S)
              if "src=" not in attrs and "application/json" not in attrs]
    metas = (f'\n  <meta http-equiv="Content-Security-Policy" content="{politica(hashes)}">'
             '\n  <meta name="referrer" content="no-referrer">')
    return html.replace("<head>", "<head>" + metas, 1)


def exportar(destino: Path = DESTINO) -> Path:
    if destino.exists():
        shutil.rmtree(destino)
    destino.mkdir(parents=True)
    (destino / "index.html").write_text(montar_html(), encoding="utf-8")
    shutil.copytree(PASTA_WEB / "static", destino / "static")
    shutil.copy(Path(PASTA_DADOS) / "previsoes.json", destino / "previsoes.json")
    return destino


if __name__ == "__main__":
    pasta = exportar()
    arquivos = sorted(p.relative_to(pasta).as_posix() for p in pasta.rglob("*") if p.is_file())
    print(f"{len(arquivos)} arquivos em {pasta}:")
    for a in arquivos:
        print("  ", a)
