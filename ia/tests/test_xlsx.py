import pytest

from risco.xlsx import ler_linhas
from tests.fabrica_xlsx import criar


def test_le_so_colunas_pedidas(tmp_path):
    p = criar(tmp_path / "a.xlsx", ["A", "B", "C"], [["x", 1.5, None]])
    assert list(ler_linhas(p, ["C", "A"])) == [{"C": "", "A": "x"}]


def test_numero_vira_texto(tmp_path):
    p = criar(tmp_path / "a.xlsx", ["H"], [[0.625]])
    assert next(ler_linhas(p, ["H"]))["H"] == "0.625"


def test_le_da_aba_de_dados(tmp_path):
    p = criar(tmp_path / "a.xlsx", ["RUBRICA"], [["Roubo (art. 157)"], ["Furto (art. 155)"]], aba="VEICULOS_2026")
    assert [r["RUBRICA"] for r in ler_linhas(p, ["RUBRICA"])] == ["Roubo (art. 157)", "Furto (art. 155)"]


def test_muitas_colunas(tmp_path):
    cab = [f"C{i}" for i in range(60)]
    p = criar(tmp_path / "a.xlsx", cab, [[str(i) for i in range(60)]])
    assert next(ler_linhas(p, ["C55"]))["C55"] == "55"


def test_coluna_faltando(tmp_path):
    p = criar(tmp_path / "a.xlsx", ["A"], [["1"]])
    with pytest.raises(KeyError, match="LATITUDE"):
        list(ler_linhas(p, ["LATITUDE"]))


def test_dicionario_com_acento(tmp_path):
    p = criar(tmp_path / "a.xlsx", ["A"], [["1"]], aba="CELULAR_2024", dicionario="DICIONÁRIO DE DADOS")
    assert list(ler_linhas(p, ["A"])) == [{"A": "1"}]


def test_apelido_de_coluna(tmp_path):
    p = criar(tmp_path / "a.xlsx", ["CD_IBGE"], [["3550308"]])
    assert list(ler_linhas(p, ["COD IBGE"], apelidos={"COD IBGE": ["CD_IBGE"]})) == [{"COD IBGE": "3550308"}]


def test_le_todas_as_abas_de_dados(tmp_path):
    # a base de objetos vem com uma aba por trimestre, cada uma com o próprio cabeçalho
    p = criar(tmp_path / "a.xlsx", ["RUBRICA", "X"], [["Roubo (art. 157)", 1]], aba="OBJETOS_01_TRIM_2025",
              outras_abas=[("OBJETOS_02_TRIM_2025", ["X", "RUBRICA"], [[2, "Furto (art. 155)"]])])
    assert [r["RUBRICA"] for r in ler_linhas(p, ["RUBRICA"])] == ["Roubo (art. 157)", "Furto (art. 155)"]
