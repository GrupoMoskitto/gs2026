from datetime import date

import pytest

from risco.app import FAIXAS, resumo_para_app
from web.dados import montar


@pytest.fixture(scope="module")
def dados():
    return montar()


def test_resumo_cobre_os_129_lugares_nas_4_faixas(dados):
    r = resumo_para_app(dados, date(2026, 11, 15))
    assert len(r["lugares"]) == 129
    for item in r["lugares"].values():
        for chave in ("taxa", "celular", "veiculo", "mes"):
            assert len(item[chave]) == len(FAIXAS)
    assert len(r["horas"]) == 24
    assert sum(r["horas"]) > 0


def test_mes_de_referencia_e_o_corrente_ou_o_ultimo_previsto(dados):
    previstos = dados["agora"]["previstos"]
    assert resumo_para_app(dados, date(2026, 11, 15))["mes"]["referencia"] == "2026-11"
    assert resumo_para_app(dados, date(2030, 1, 1))["mes"]["referencia"] == previstos[-1]
    assert resumo_para_app(dados, date.fromisoformat(previstos[0] + "-10"))["mes"]["referencia"] == previstos[0]
    assert resumo_para_app(dados, date(2020, 1, 1))["mes"]["referencia"] == previstos[0]


def test_metricas_iguais_as_do_site(dados):
    r = resumo_para_app(dados, date(2026, 11, 15))
    assert r["modelo"]["f1"] == dados["numeros"]["f1"]
    assert r["roubos"] == dados["numeros"]["roubos"]
