from datetime import date

import numpy as np
import pandas as pd
import pytest

from risco import mensal
from risco.lugares import carregar_lugares


@pytest.fixture(scope="module")
def lugares():
    return carregar_lugares()


def _ag(linhas):
    return pd.DataFrame(linhas, columns=["bairro", "data", "faixa_horaria", "roubos", "roubos_celular", "roubos_veiculo"])


def _serie(lugares, meses=15, valor=1.0):
    """Taxa constante em todas as células por `meses` meses a partir de jan/2024."""
    colunas = pd.period_range("2024-01", periods=meses, freq="M")
    celulas = pd.MultiIndex.from_product([lugares.codigo, mensal.FAIXAS], names=["bairro", "faixa_horaria"])
    return pd.DataFrame(valor, index=celulas, columns=colunas)


def test_taxa_mensal_alinha_celula_e_mes(lugares):
    outro = lugares.codigo.iloc[-1]
    ag = _ag([(outro, date(2024, 2, 10), "tarde", 29, 29, 0), ("bela_vista", date(2024, 1, 5), "noite", 31, 31, 0)])
    t = mensal.taxa_mensal(ag, lugares, date(2024, 2, 29))
    assert t.shape == (129 * 4, 2)
    assert t.loc[("bela_vista", "noite"), pd.Period("2024-01")] == pytest.approx(1.0)
    assert t.loc[("bela_vista", "noite"), pd.Period("2024-02")] == 0
    assert t[pd.Period("2024-02")].sum() == pytest.approx(1.0)  # 29 roubos em fevereiro de 2024 (29 dias)
    # mesma ordem das células em qualquer coluna (o erro que já apareceu ao misturar ordens)
    assert list(t.index.get_level_values("faixa_horaria")[:4]) == mensal.FAIXAS


def test_features_so_usam_meses_publicados(lugares):
    t = _serie(lugares)
    alvo = pd.Period("2025-03")
    antes = mensal.features(t, lugares, alvo, horizonte=3)
    t2 = t.copy()
    t2[[pd.Period("2025-01"), pd.Period("2025-02"), pd.Period("2025-03")]] = 999  # meses ainda não publicados
    depois = mensal.features(t2, lugares, alvo, horizonte=3)
    pd.testing.assert_frame_equal(antes, depois)
    assert list(antes.columns) == mensal.TODAS


def test_features_pedem_um_ano_de_historico(lugares):
    with pytest.raises(ValueError):
        mensal.features(_serie(lugares, meses=12), lugares, pd.Period("2024-12"), horizonte=1)


def test_correcao_sem_relatos_fica_na_previsao():
    assert mensal.corrigir_com_relatos(2.0, 0, 0.1, 30, peso=1e9) == pytest.approx(2.0)


def test_correcao_com_peso_zero_segue_os_relatos():
    # 6 relatos com 10% de adesão em 30 dias: 60 roubos estimados, 2 por dia
    assert mensal.corrigir_com_relatos(5.0, 6, 0.1, 30, peso=0) == pytest.approx(2.0)


def test_simular_relatos_e_reprodutivel_e_nunca_passa_dos_roubos():
    tab = pd.DataFrame({"mes": ["2026-01"] * 3, "real": [1.0, 0.0, 3.0]})
    a = mensal.simular_relatos(tab, 0.5, semente=7)
    assert (a == mensal.simular_relatos(tab, 0.5, semente=7)).all()
    assert (a <= np.array([31, 0, 93])).all() and a[1] == 0


def test_niveis_relativos():
    n = mensal.niveis_relativos(pd.Series(range(10), dtype=float))
    assert n.value_counts().to_dict() == {"baixo": 5, "medio": 3, "alto": 2}


def test_intervalo_contem_a_media():
    lo, hi = mensal.intervalo_poisson(np.array([2.0]), 30)
    assert lo[0] < 60 < hi[0]
