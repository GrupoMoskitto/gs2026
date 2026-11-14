"""Site do Moskitto Radar para ver o resultado da parte de IA.

Rodar (de dentro de ia/):  .venv/bin/python web/app.py   →  http://localhost:5000
Com Docker (de dentro de ia/):  docker compose up --build   →  http://localhost:5000
"""

import os
import secrets

from flask import Flask, g, jsonify, render_template, send_from_directory

try:
    from web.dados import PASTA_DADOS, montar
except ImportError:  # rodando como script: python web/app.py
    from dados import PASTA_DADOS, montar

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = os.environ.get("RECARREGAR_TEMPLATES") == "1"
# estáticos levam ?v=<data do arquivo>, então podem ficar um ano no cache
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 60 * 60 * 24 * 365
DADOS = montar()


@app.url_defaults
def versao_dos_estaticos(endpoint, valores):
    if endpoint == "static" and "filename" in valores:
        caminho = os.path.join(app.static_folder, valores["filename"])
        if os.path.isfile(caminho):
            valores["v"] = int(os.stat(caminho).st_mtime)


@app.before_request
def gerar_nonce():
    g.nonce = secrets.token_urlsafe(16)


@app.context_processor
def nonce_no_template():
    return {"nonce": g.get("nonce", "")}


@app.after_request
def cabecalhos_de_seguranca(resposta):
    nonce = g.get("nonce", "")
    resposta.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        f"script-src 'self' 'nonce-{nonce}'; "
        "style-src 'self' 'unsafe-inline'; "  # os gráficos pintam cores com style=""
        "img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; font-src 'self'; "
        "object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    )
    resposta.headers["X-Content-Type-Options"] = "nosniff"
    resposta.headers["X-Frame-Options"] = "DENY"
    resposta.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"  # os blocos do OSM pedem a origem
    resposta.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    return resposta


@app.get("/")
def inicio():
    return render_template("index.html", dados=DADOS)


@app.get("/api/dados")
def api_dados():
    return jsonify(DADOS)


@app.get("/previsoes.json")
def baixar_previsoes():
    """O mesmo arquivo que a API do João carrega: risco por lugar e faixa do dia."""
    return send_from_directory(PASTA_DADOS, "previsoes.json", as_attachment=True)


@app.get("/health")
def Health():
    return {"status": True}


if __name__ == "__main__":
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "5000")))
