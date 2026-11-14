from datetime import date

from risco.perfil import COLUNAS, COLUNAS_OBJETOS, ler_bos, resumir
from tests.fabrica_xlsx import criar

SP, FORA = 3550308, 3304557  # capital e Rio de Janeiro
ROUBO, FURTO = "Roubo (art. 157)", "Furto (art. 155)"
DIA = 45700  # 12/02/2025 no calendário do Excel


def _linha(bo, rubrica=ROUBO, ibge=SP, conduta="Transeunte", local="Via Pública", hora=0.9, objeto=None):
    base = ["DP 1", "2025", str(bo), rubrica, DIA, hora, "", ibge, conduta, local]
    return base + ([objeto] if objeto is not None else [])


def test_junta_bases_pelo_bo(tmp_path):
    cel = criar(tmp_path / "c.xlsx", COLUNAS, [_linha(1), _linha(2, conduta="Outros"), _linha(3, rubrica=FURTO)])
    obj = criar(tmp_path / "o.xlsx", COLUNAS_OBJETOS,
                [_linha(1, objeto="Documentos"), _linha(1, objeto="Valor/Moeda"), _linha(4, objeto="Jóias e Afins", conduta="Residência", local="Residência"),
                 _linha(5, ibge=FORA, objeto="Documentos")], aba="OBJETOS_01_TRIM_2025")
    bos, etapas = ler_bos({"celular": [cel], "objetos": [obj]}, {SP}, date(2026, 8, 31))
    assert etapas["bos_roubo"] == 4 and etapas["bos_validos"] == 3 and etapas["fora_da_rmsp"] == 1
    p = resumir(bos)
    assert p["total_bos"] == 3
    levados = {i["rotulo"]: i["bos"] for i in p["levados"]}
    assert levados == {"Celular": 2, "Documentos": 1, "Dinheiro": 1, "Joias e relógios": 1}
    assert {i["rotulo"]: i["bos"] for i in p["levados_com_celular"]} == {"Documentos": 1, "Dinheiro": 1}
    assert p["cobertura"]["celular_ou_veiculo"]["bos"] == 2 and p["cobertura"]["outros_objetos"]["bos"] == 1
    condutas = {c["rotulo"]: c["bos"] for c in p["conduta"]}
    assert condutas == {"A pé, na rua": 1, "Em casa": 1, "Outros ou não informado": 1}
    assert p["conduta"][-1]["rotulo"] == "Outros ou não informado"
    assert p["conduta_por_faixa"]["A pé, na rua"]["noite"] == 1
    assert p["por_mes"] == [{"mes": "2025-02", "celular_ou_veiculo": 2, "outros_objetos": 1}]


def test_fora_do_periodo(tmp_path):
    cel = criar(tmp_path / "c.xlsx", COLUNAS, [_linha(1)])
    bos, etapas = ler_bos({"celular": [cel]}, {SP}, date(2025, 1, 31))
    assert not bos and etapas["fora_do_periodo"] == 1
