import re
from datetime import date

import pandas as pd
import pytest

from risco.lugares import carregar_lugares
from risco.relatos import COLUNAS_RELATO, gerar_relatos

TIPOS = {"celular", "bolsa_mochila", "veiculo", "bicicleta", "comercio", "outro"}


@pytest.fixture(scope="module")
def lugares():
    return carregar_lugares()


@pytest.fixture(scope="module")
def agregado():
    # bela_vista concentra 90% dos roubos; Guarulhos e Pinheiros dividem o resto
    linhas = []
    for dia in pd.date_range("2025-01-01", "2025-03-31"):
        linhas.append(("bela_vista", dia.date(), "noite", 9, 7, 2))
        linhas.append(("mun_3518800", dia.date(), "tarde", 1, 0, 1))
    linhas.append(("dis_355030862", date(2025, 1, 2), "manha", 0, 0, 0))
    return pd.DataFrame(linhas, columns=["bairro", "data", "faixa_horaria", "roubos", "roubos_celular", "roubos_veiculo"])


@pytest.fixture(scope="module")
def relatos(agregado, lugares):
    return gerar_relatos(agregado, lugares, n=2000)


def test_colunas_na_ordem(relatos):
    assert list(relatos.columns) == ["id", "tipo", "descricao", "latitude", "longitude", "bairro", "ocorrido_em", "status", "origem"]
    assert COLUNAS_RELATO == list(relatos.columns)


def test_deterministico(agregado, lugares):
    assert gerar_relatos(agregado, lugares, n=200).equals(gerar_relatos(agregado, lugares, n=200))


def test_valores_validos(relatos, lugares):
    assert set(relatos.tipo) <= TIPOS
    assert set(relatos.status) == {"pendente", "aprovado", "rejeitado"}
    assert set(relatos.origem) == {"mobile", "desktop", "iot"}
    assert set(relatos.bairro) <= set(lugares.codigo)
    assert relatos.descricao.fillna("").str.len().max() <= 280
    assert relatos.id.is_unique
    assert relatos.id.str.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}").all()


def test_coordenadas(relatos):
    assert relatos.latitude.between(-24.1, -23.15).all()
    assert relatos.longitude.between(-47.1, -45.75).all()
    assert ((relatos.latitude * 1000).round(6) % 1 == 0).all()
    assert ((relatos.longitude * 1000).round(6) % 1 == 0).all()


def test_data_e_faixa(relatos):
    assert relatos.ocorrido_em.str.fullmatch(r"2026-(0[5-9]|10)-\d\dT\d\d:\d\d:00-03:00").all()
    horas = relatos[relatos.bairro == "bela_vista"].ocorrido_em.str.slice(11, 13).astype(int)
    assert horas.between(18, 23).all()


def test_segue_a_distribuicao(relatos):
    parte = (relatos.bairro == "bela_vista").mean()
    assert 0.80 <= parte <= 0.97


def test_descricoes_vazias_e_sem_dado_pessoal(relatos):
    vazias = relatos.descricao.isna().mean()
    assert 0.2 <= vazias <= 0.4
    texto = relatos.descricao.dropna()
    assert not texto.str.contains(r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}|[A-Z]{3}-?\d[A-Z0-9]\d{2}", regex=True).any()


def test_so_os_bairros_pedidos(agregado, lugares):
    df = gerar_relatos(agregado, lugares, n=300, bairros=["bela_vista", "cerqueira_cesar", "consolacao"])
    assert set(df.bairro) <= {"bela_vista", "cerqueira_cesar", "consolacao"}
    assert len(df) == 300


def test_ordem_por_data(relatos):
    assert relatos.ocorrido_em.is_monotonic_decreasing
    assert re.match(r"\d{4}", relatos.ocorrido_em.iloc[0])
