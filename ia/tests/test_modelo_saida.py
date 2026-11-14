from datetime import date

import numpy as np
import pandas as pd
import pytest

from risco.lugares import carregar_lugares
from risco.modelo import NIVEIS, avaliar, features, previsoes, referencias, score_da_probabilidade, treinar


@pytest.mark.parametrize(
    ("p", "esperado"),
    [
        ((0, 0.55, 0.45), ("medio", 0.59)),
        ((0.3, 0.3, 0.4), ("alto", 0.60)),
        ((1, 0, 0), ("baixo", 0.05)),
        ((0, 0, 1), ("alto", 0.95)),
        ((0.2, 0.6, 0.2), ("medio", 0.5)),
    ],
)
def test_score_da_probabilidade(p, esperado):
    assert score_da_probabilidade(*p) == esperado


def test_score_concorda_com_o_app():
    rng = np.random.default_rng(0)
    for p in rng.dirichlet([1, 1, 1], size=500):
        nivel, score = score_da_probabilidade(*p)
        do_app = "alto" if score >= 0.6 else "medio" if score >= 0.35 else "baixo"
        assert nivel == do_app


def test_referencias():
    y_treino = pd.Series(["baixo", "baixo", "alto"])
    y_anterior = pd.Series(["alto", "medio"])
    r = referencias(y_treino, y_anterior)
    assert list(r["classe_mais_comum"]) == ["baixo", "baixo"]
    assert list(r["nivel_anterior"]) == ["alto", "medio"]


def test_avaliar():
    m = avaliar(pd.Series(["baixo", "alto", "medio", "alto"]), pd.Series(["baixo", "alto", "alto", "alto"]))
    assert m["acuracia"] == 0.75
    assert np.array(m["matriz"]).shape == (3, 3)
    assert m["matriz"][1][2] == 1  # um médio previsto como alto
    assert 0 < m["f1_macro"] < 1


@pytest.fixture(scope="module")
def modelo_e_x():
    lugares = carregar_lugares()
    rng = np.random.default_rng(1)
    linhas = []
    for codigo in lugares.codigo:
        base = rng.integers(0, 6)
        for d in pd.date_range("2024-01-01", "2024-03-31", freq="3D"):
            for faixa in ("madrugada", "manha", "tarde", "noite"):
                linhas.append((codigo, d.date(), faixa, int(base + (faixa == "noite") * 3), 1, 0))
    ag = pd.DataFrame(linhas, columns=["bairro", "data", "faixa_horaria", "roubos", "roubos_celular", "roubos_veiculo"])
    x = features(ag, lugares, date(2024, 1, 1), date(2024, 3, 31))
    y = pd.Series(np.where(x.taxa_celula > x.taxa_celula.median(), "alto", "baixo"), index=x.index)
    y.iloc[::7] = "medio"
    return treinar(x, y, busca=False), x


def test_previsoes(modelo_e_x):
    modelo, x = modelo_e_x
    prev = previsoes(modelo, x)
    assert len(prev) == 516
    assert set(prev[0]) == {"bairro", "faixa_horaria", "nivel_risco", "score"}
    assert all(p["nivel_risco"] in NIVEIS for p in prev)
    assert all(round(p["score"], 2) == p["score"] and 0.05 <= p["score"] <= 0.95 for p in prev)
    assert prev[0]["bairro"] <= prev[-1]["bairro"]
