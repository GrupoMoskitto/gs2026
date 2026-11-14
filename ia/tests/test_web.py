import json
from pathlib import Path

import pytest

from web.app import app
from web.dados import FAIXAS, montar


@pytest.fixture(scope="module")
def cliente():
    app.config["TESTING"] = True
    return app.test_client()


def test_pagina_inicial(cliente):
    r = cliente.get("/")
    assert r.status_code == 200
    html = r.get_data(as_text=True)
    assert "<h1>Risco de roubo na Grande São Paulo</h1>" in html
    assert 'lang="pt-BR"' in html
    dados = json.loads(html.split('<script id="dados-json" type="application/json">')[1].split("</script>")[0])
    assert dados["numeros"]["lugares"] == 129


def test_arquivos_estaticos(cliente):
    for caminho in ("/static/estilo.css", "/static/graficos.js", "/static/marca/logo-mark.svg", "/static/marca/logo-mark-light.svg", "/static/icones.svg"):
        r = cliente.get(caminho)
        assert r.status_code == 200, caminho
        r.close()


def test_api_e_saude(cliente):
    assert cliente.get("/health").get_json() == {"status": True}
    d = cliente.get("/api/dados").get_json()
    assert {"numeros", "funil", "lugares", "horas", "mensal", "modelo", "agora", "perfil"} == set(d)


def test_baixar_previsoes(cliente):
    r = cliente.get("/previsoes.json")
    assert r.status_code == 200
    assert "attachment" in r.headers["Content-Disposition"]
    previsoes = json.loads(r.get_data(as_text=True))
    r.close()
    assert len(previsoes) == 516
    assert set(previsoes[0]) == {"bairro", "faixa_horaria", "nivel_risco", "score"}


def test_dados_consistentes():
    d = montar()
    assert len(d["lugares"]) == 129
    for l in d["lugares"]:
        assert set(l["faixas"]) == set(FAIXAS)
        assert all(p["nivel"] in ("baixo", "medio", "alto") and 0 < p["score"] < 1 and p["taxa"] >= 0 for p in l["faixas"].values())
        # cada BO tem celular, veículo ou os dois: o maior tipo nunca passa do total, e a soma nunca fica abaixo dele
        for p in l["faixas"].values():
            assert max(p["taxa_celular"], p["taxa_veiculo"]) <= p["taxa"] + 0.001
            assert p["taxa_celular"] + p["taxa_veiculo"] >= p["taxa"] - 0.001
    assert len(d["horas"]) == 7 and all(len(h) == 24 for h in d["horas"])
    assert d["mensal"][0]["mes"] == "2024-01" and d["mensal"][-1]["mes"] == d["numeros"]["periodo"]["fim"][:7]
    assert d["funil"][-1]["valor"] == d["numeros"]["roubos"]
    assert [c["chave"] for c in d["modelo"]["comparacao"]] == ["modelo", "nivel_anterior", "classe_mais_comum"]
    # nenhum campo com dado de ocorrência individual
    texto = json.dumps(d)
    for proibido in ("NUM_BO", "LOGRADOURO", "PLACA", "CEP"):
        assert proibido not in texto


def test_cabecalhos_de_seguranca(cliente):
    r = cliente.get("/")
    csp = r.headers["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in csp and "object-src 'none'" in csp
    nonce = csp.split("'nonce-")[1].split("'")[0]
    html = r.get_data(as_text=True)
    # todo <script> que roda leva o nonce da resposta; o próximo pedido usa outro
    assert html.count(f'nonce="{nonce}"') == 3
    assert nonce not in cliente.get("/").headers["Content-Security-Policy"]
    assert r.headers["X-Content-Type-Options"] == "nosniff"


def test_estaticos_com_versao(cliente):
    html = cliente.get("/").get_data(as_text=True)
    assert "/static/graficos.js?v=" in html and "/static/estilo.css?v=" in html
    assert "max-age=31536000" in cliente.get("/static/estilo.css").headers["Cache-Control"]


def test_exportar_estatico(tmp_path):
    from web.exportar import exportar

    pasta = exportar(tmp_path / "dist")
    html = (pasta / "index.html").read_text(encoding="utf-8")
    assert "nonce=" not in html and "<h1>Risco de roubo na Grande São Paulo</h1>" in html
    # os dados embutidos na página não têm campo de ocorrência individual (o texto da página cita "CEP" ao explicar isso)
    dados = html.split('<script id="dados-json" type="application/json">')[1].split("</script>")[0]
    for campo in ("NUM_BO", "LOGRADOURO", "PLACA", "CEP"):
        assert campo not in dados
    csp = html.split('<meta http-equiv="Content-Security-Policy" content="')[1].split('"')[0]
    assert csp.count("'sha256-") == 2  # o script do tema e o dos ícones
    assert not (pasta / "vercel.json").exists()
    assert (pasta / "previsoes.json").is_file() and (pasta / "static" / "graficos.js").is_file()


def test_previsao_do_mes():
    d = montar()
    ag = d["agora"]
    assert ag["previstos"] == ["2026-09", "2026-10", "2026-11"] and len(ag["meses"]) == 12
    assert ag["erro_regiao"]["modelo"] < ag["erro_regiao"]["media_3m"]  # o que o site afirma
    assert [r["adesao"] for r in ag["relatos"]] == [0.01, 0.02, 0.05, 0.1, 0.2]
    for l in d["lugares"]:
        for f in FAIXAS:
            c = l["mes"][f]
            assert len(c["hist"]) == 12 and len(c["prev"]) == 3
            # previsão arredondada a 0,1; num lugar quase sem roubo o teto da faixa pode ser 0
            assert all(lo <= p <= hi + 0.1 for lo, p, hi in zip(c["min"], c["prev"], c["max"]))


def test_site_sem_os_arquivos_novos(tmp_path):
    # previsão do mês e perfil são opcionais: sem eles, as seções novas somem
    pasta = Path(__file__).resolve().parents[1] / "data"
    for arq in pasta.iterdir():
        if arq.name not in ("previsao_mensal.json", "perfil_roubos.json"):
            (tmp_path / arq.name).symlink_to(arq)
    d = montar(tmp_path)
    assert d["agora"] is None and d["perfil"] is None and d["lugares"][0]["mes"] is None
