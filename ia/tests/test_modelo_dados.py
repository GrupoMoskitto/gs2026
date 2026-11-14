from datetime import date

import pandas as pd
import pytest

from risco.lugares import carregar_lugares
from risco.modelo import FAIXAS, NIVEIS, features, janelas, limites, rotular, taxas


@pytest.fixture(scope="module")
def lugares():
    return carregar_lugares()


def _ag(linhas):
    return pd.DataFrame(linhas, columns=["bairro", "data", "faixa_horaria", "roubos", "roubos_celular", "roubos_veiculo"])


def test_constantes():
    assert FAIXAS == ["madrugada", "manha", "tarde", "noite"]
    assert NIVEIS == ["baixo", "medio", "alto"]


def test_taxas_cobre_todas_as_celulas(lugares):
    ag = _ag([("bela_vista", date(2025, 6, 2), "noite", 3, 3, 0)])
    t = taxas(ag, lugares, date(2025, 6, 2), date(2025, 6, 8))
    assert len(t) == 129 * 4 * 2
    assert (t.taxa == 0).sum() == len(t) - 1


def test_taxa_divide_pelos_dias_do_tipo(lugares):
    # semana de 02/06/2025 (segunda) a 08/06 (domingo): 5 dias úteis e 2 de fim de semana
    ag = _ag([("bela_vista", date(2025, 6, d), "noite", 2, 2, 0) for d in range(2, 7)] + [("bela_vista", date(2025, 6, 7), "noite", 4, 4, 0)])
    t = taxas(ag, lugares, date(2025, 6, 2), date(2025, 6, 8)).set_index(["bairro", "faixa_horaria", "fim_de_semana"])
    assert t.loc[("bela_vista", "noite", 0), "taxa"] == pytest.approx(10 / 5)
    assert t.loc[("bela_vista", "noite", 1), "taxa"] == pytest.approx(4 / 2)


def test_ignora_fora_do_intervalo(lugares):
    ag = _ag([("bela_vista", date(2025, 5, 31), "noite", 9, 9, 0)])
    assert taxas(ag, lugares, date(2025, 6, 2), date(2025, 6, 8)).taxa.sum() == 0


def test_rotular():
    s = pd.Series([0, 1, 2, 3, 10])
    assert list(rotular(s, (1, 3))) == ["baixo", "baixo", "medio", "medio", "alto"]


def test_limites_por_percentil():
    lim = limites(pd.Series(range(101)), 50, 80)
    assert lim == (50, 80)


def test_features_sem_vazamento(lugares):
    base = [("bela_vista", date(2024, 3, 4), "noite", 2, 1, 1), ("mun_3518800", date(2024, 3, 9), "tarde", 1, 1, 0)]
    futuro = [("bela_vista", date(2025, 3, 4), "noite", 50, 50, 0)]
    a = features(_ag(base + futuro), lugares, date(2024, 1, 1), date(2024, 12, 31))
    b = features(_ag(base + [(x[0], x[1], x[2], x[3] * 2, x[4] * 2, x[5]) for x in futuro]), lugares, date(2024, 1, 1), date(2024, 12, 31))
    pd.testing.assert_frame_equal(a, b)


def test_features_colunas(lugares):
    ag = _ag([("bela_vista", date(2024, 3, 4), "noite", 2, 1, 1)])
    f = features(ag, lugares, date(2024, 1, 1), date(2024, 12, 31))
    assert len(f) == 1032
    assert list(f.columns) == [
        "taxa_celula", "taxa_lugar", "participacao_faixa", "fracao_veiculo", "tipo_bairro", "tipo_distrito",
        "tipo_municipio", "dist_se_km", "dist_paulista_km", "faixa_codigo", "fim_de_semana",
    ]
    linha = f.loc[("bela_vista", "noite", 0)]
    assert linha.participacao_faixa == 1.0
    assert linha.fracao_veiculo == 0.5
    assert linha.tipo_bairro == 1


def test_janelas():
    j = janelas(date(2026, 9, 30))
    assert j["treino_x"] == (date(2024, 1, 1), date(2024, 12, 31))
    assert j["treino_y"] == (date(2025, 1, 1), date(2025, 12, 31))
    assert j["teste_x"] == (date(2025, 1, 1), date(2025, 12, 31))
    assert j["teste_y"] == (date(2026, 1, 1), date(2026, 9, 30))
    assert j["final_x"] == (date(2025, 10, 1), date(2026, 9, 30))
