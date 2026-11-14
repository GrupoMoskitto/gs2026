from datetime import date

import pandas as pd
import pytest

from risco.lugares import carregar_lugares
from risco.ssp import (
    COLUNAS,
    cod_ibge,
    data_excel,
    e_roubo,
    extrair,
    faixa_da_hora,
    fim_da_cobertura,
    fim_do_ultimo_mes_completo,
    numero,
)
from tests.fabrica_xlsx import criar


def test_e_roubo():
    assert e_roubo("Roubo (art. 157)")
    assert not e_roubo("Furto (art. 155)")
    assert not e_roubo("Localização/Apreensão de veículo")


def test_data_excel():
    assert data_excel("46019") == date(2025, 12, 28)
    assert data_excel("NULL") is None


@pytest.mark.parametrize(
    ("hora", "periodo", "faixa"),
    [
        ("0.625", "", "tarde"),
        ("0.0", "", "madrugada"),
        ("3.125E-2", "NULL", "madrugada"),
        ("0.25", "", "manha"),
        ("0.99", "", "noite"),
        ("NULL", "A noite", "noite"),
        ("", "Pela manhã", "manha"),
        ("NULL", "De madrugada", "madrugada"),
        ("", "Em hora incerta", None),
        ("NULL", "NULL", None),
    ],
)
def test_faixa_da_hora(hora, periodo, faixa):
    assert faixa_da_hora(hora, periodo) == faixa


def test_numero():
    assert numero("-23,55") == -23.55
    assert numero("-23.558262899999999") == pytest.approx(-23.5582629)
    assert numero("NULL") is None
    assert numero("0") is None
    assert numero("") is None


def test_cod_ibge():
    assert cod_ibge("3550308.0") == 3550308
    assert cod_ibge(" 3518800 ") == 3518800
    assert cod_ibge("") is None
    assert cod_ibge("355") is None


def test_fim_do_ultimo_mes_completo():
    assert fim_do_ultimo_mes_completo(date(2026, 10, 17)) == date(2026, 9, 30)
    assert fim_do_ultimo_mes_completo(date(2026, 10, 31)) == date(2026, 10, 31)
    assert fim_do_ultimo_mes_completo(date(2024, 3, 1)) == date(2024, 2, 29)


def _linha(delegacia, num, rubrica, data, hora, periodo, lat, lng, ibge):
    valores = {
        "NOME_DELEGACIA": delegacia,
        "ANO_BO": "2025",
        "NUM_BO": num,
        "RUBRICA": rubrica,
        "DATA_OCORRENCIA_BO": data,
        "HORA_OCORRENCIA": hora,
        "DESCR_PERIODO": periodo,
        "LATITUDE": lat,
        "LONGITUDE": lng,
        "COD IBGE": ibge,
        "FLAG_STATUS": "CONSUMADO",
    }
    return [valores[c] for c in COLUNAS]


@pytest.fixture
def bases(tmp_path):
    # 2025-06-10 = série 45818 (terça-feira); 2025-06-30 fecha o mês.
    roubo_paulista = _linha("1 DP", "10", "Roubo (art. 157)", "45818", "0.875", "", "-23.5615", "-46.6535", "3550308")
    celular = [
        roubo_paulista,
        roubo_paulista,
        _linha("1 DP", "10", "Lesão corporal (art. 129)", "45818", "0.875", "", "-23.5615", "-46.6535", "3550308"),
        _linha("2 DP", "11", "Furto (art. 155)", "45818", "0.5", "", "-23.5615", "-46.6535", "3550308"),
        _linha("3 DP", "12", "Roubo (art. 157)", "45818", "0.5", "", "-22.9", "-47.06", "3509502"),  # Campinas
        _linha("4 DP", "13", "Roubo (art. 157)", "45818", "0.5", "", "NULL", "NULL", "3550308"),  # sem coordenada
        _linha("5 DP", "14", "Roubo (art. 157)", "45818", "NULL", "Em hora incerta", "-23.56", "-46.65", "3550308"),
        _linha("6 DP", "15", "Roubo (art. 157)", "45818", "NULL", "A tarde", "NULL", "NULL", "3518800.0"),  # Guarulhos
        _linha("7 DP", "16", "Roubo (art. 157)", "45838", "0.1", "", "-23.5615", "-46.6535", "3550308"),  # 30/06
    ]
    # a base de veículos também vai até 30/06 (um furto, que não conta como roubo)
    veiculo = [roubo_paulista, _linha("8 DP", "17", "Furto (art. 155)", "45838", "0.5", "", "-23.56", "-46.65", "3550308")]
    return {
        "celular": [criar(tmp_path / "c.xlsx", COLUNAS, celular)],
        "veiculo": [criar(tmp_path / "v.xlsx", COLUNAS, veiculo, aba="VEICULOS_2025")],
    }


def test_extrair_conta_cada_bo_uma_vez(bases):
    agregado, resumo = extrair(bases, carregar_lugares())
    linha = agregado[(agregado.bairro == "bela_vista") & (agregado.faixa_horaria == "noite")].iloc[0]
    assert (linha.roubos, linha.roubos_celular, linha.roubos_veiculo) == (1, 1, 1)
    assert linha.data == date(2025, 6, 10)


def test_extrair_filtra_e_conta_descartes(bases):
    agregado, resumo = extrair(bases, carregar_lugares())
    assert resumo["linhas_lidas"] == 11
    assert resumo["bos_roubo"] == 6
    assert resumo["fora_da_rmsp"] == 1
    assert resumo["sem_coordenada"] == 1
    assert resumo["sem_hora"] == 1
    assert agregado.roubos.sum() == 3
    assert set(agregado.bairro) == {"bela_vista", "mun_3518800"}


def test_extrair_periodo_e_por_hora(bases):
    _, resumo = extrair(bases, carregar_lugares())
    assert resumo["periodo"] == {"inicio": "2024-01-01", "fim": "2025-06-30"}
    por_hora = resumo["por_hora"]
    # só BOs com hora cheia: Paulista 21h (terça) e Paulista 2h (segunda 30/06)
    assert por_hora.roubos.sum() == 2
    assert set(zip(por_hora.hora, por_hora.dia_semana)) == {(21, 1), (2, 0)}



def test_fim_da_cobertura():
    meses = pd.period_range("2026-04", "2026-10", freq="M")
    cheia = pd.Series([5600, 5800, 6200, 5600, 5500, 2100, 30], index=meses)
    assert fim_da_cobertura(cheia) == date(2026, 8, 31)
    estavel = pd.Series([1100, 1050, 1000, 1100, 1080, 1000, 300], index=meses)
    assert fim_da_cobertura(estavel) == date(2026, 9, 30)
    curta = pd.Series([10, 1], index=meses[:2])  # poucos meses: não dá para comparar, fica o último
    assert fim_da_cobertura(curta) == date(2026, 5, 31)


def test_mes_sem_coordenada_fica_fora(tmp_path):
    # jan a abr/2025 com 4 roubos por mês; em maio os da capital ainda não têm coordenada
    linhas, n = [], 0
    for serial in (45667, 45698, 45726, 45757):  # 10/01, 10/02, 10/03, 10/04
        for _ in range(4):
            n += 1
            linhas.append(_linha("1 DP", str(n), "Roubo (art. 157)", str(serial), "0.5", "", "-23.5615", "-46.6535", "3550308"))
    for _ in range(4):
        n += 1
        linhas.append(_linha("1 DP", str(n), "Roubo (art. 157)", "45787", "0.5", "", "NULL", "NULL", "3550308"))  # 10/05
    bases = {"celular": [criar(tmp_path / "c.xlsx", COLUNAS, linhas)]}
    agregado, resumo = extrair(bases, carregar_lugares())
    assert resumo["periodo"]["fim"] == "2025-04-30"
    assert resumo["fora_do_periodo"] == 4
    assert resumo["sem_coordenada"] == 0
    assert agregado.roubos.sum() == 16
