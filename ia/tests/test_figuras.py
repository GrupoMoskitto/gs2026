import numpy as np
import pandas as pd
import pytest
from matplotlib.figure import Figure

from risco import estilo, figuras
from risco.lugares import carregar_lugares


@pytest.fixture(scope="module")
def dados():
    estilo.aplicar()
    lugares = carregar_lugares()
    rng = np.random.default_rng(0)
    prev = pd.DataFrame(
        [(c, f) for c in lugares.codigo for f in figuras.FAIXAS], columns=["bairro", "faixa_horaria"]
    )
    prev["score"] = rng.uniform(0.05, 0.95, len(prev)).round(2)
    prev["nivel_risco"] = np.select([prev.score >= 0.6, prev.score >= 0.35], ["alto", "medio"], "baixo")
    prev["taxa"] = rng.uniform(0, 5, len(prev))
    por_hora = pd.DataFrame([(h, d, int(rng.integers(10, 100))) for d in range(7) for h in range(24)], columns=["hora", "dia_semana", "roubos"])
    mensal = pd.DataFrame({"mes": pd.date_range("2024-01-01", "2026-09-01", freq="MS")})
    mensal["celular"] = rng.integers(4000, 6000, len(mensal))
    mensal["veiculo"] = rng.integers(1000, 2000, len(mensal))
    resumo = {"linhas_lidas": 1000, "bos_roubo": 500, "fora_da_rmsp": 100, "roubos_contados": 350, "sem_coordenada": 20, "sem_hora": 10, "fora_do_periodo": 20}
    ranking = prev[prev.faixa_horaria == "noite"].merge(lugares, left_on="bairro", right_on="codigo")[["nome", "taxa", "nivel_risco"]]
    return lugares, prev, por_hora, mensal, resumo, ranking


def test_todas_as_figuras(dados, tmp_path):
    lugares, prev, por_hora, mensal, resumo, ranking = dados
    figs = {
        "mapa": figuras.mapa_risco(lugares, prev),
        "funil": figuras.funil(resumo),
        "relogio": figuras.relogio(por_hora),
        "calendario": figuras.calendario(por_hora),
        "serie": figuras.serie_mensal(mensal),
        "ranking": figuras.ranking(ranking),
        "matriz": figuras.matriz_confusao([[50, 5, 1], [6, 30, 4], [0, 3, 20]]),
        "f1": figuras.comparacao_f1({"modelo": 0.8, "nivel_anterior": 0.75, "classe_mais_comum": 0.2}),
        "importancia": figuras.importancia(["taxa_celula", "faixa_codigo"], [0.7, 0.3]),
        "grade": figuras.grade_lugar_faixa(prev, lugares, top=10),
    }
    for nome, fig in figs.items():
        assert isinstance(fig, Figure)
        assert fig.axes
        caminho = estilo.salvar(fig, nome, pasta=tmp_path)
        assert caminho.stat().st_size > 10_000
