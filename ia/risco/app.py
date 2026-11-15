"""Resumo dos resultados para a aba Risco do app (mobile/src/data/resumo_modelo.json).

Recebe o dicionário de web.dados.montar() e guarda só o que a tela usa, com números arredondados.
"""

from datetime import date

FAIXAS = ["madrugada", "manha", "tarde", "noite"]
ITENS_LEVADOS = 6


def _mes_de_referencia(previstos: list[str], hoje: date) -> int:
    """O mês corrente, se foi previsto; senão o previsto mais próximo (o primeiro ou o último)."""
    alvo = hoje.strftime("%Y-%m")
    if alvo in previstos:
        return previstos.index(alvo)
    return 0 if alvo < previstos[0] else len(previstos) - 1


def resumo_para_app(dados: dict, hoje: date) -> dict:
    agora = dados["agora"]
    i_mes = _mes_de_referencia(agora["previstos"], hoje) if agora else None

    lugares = {}
    for l in dados["lugares"]:
        f = l["faixas"]
        item = {
            "roubos": l["roubos"],
            "taxa": [round(f[x]["taxa"], 2) for x in FAIXAS],
            "celular": [round(f[x]["taxa_celular"], 2) for x in FAIXAS],
            "veiculo": [round(f[x]["taxa_veiculo"], 2) for x in FAIXAS],
        }
        if l["mes"] and i_mes is not None:
            item["mes"] = [round(l["mes"][x]["prev"][i_mes], 1) for x in FAIXAS]
        lugares[l["codigo"]] = item

    horas = [sum(dia[h] for dia in dados["horas"]) for h in range(24)]
    comparacao = {c["chave"]: c for c in dados["modelo"]["comparacao"]}
    perfil = dados["perfil"]
    n = dados["numeros"]
    return {
        "periodo": n["periodo"],
        "roubos": n["roubos"],
        "horas": horas,
        "parte_noite": n["parte_noite"],
        "modelo": {
            "f1": comparacao["modelo"]["f1"],
            "acuracia": comparacao["modelo"]["acuracia"],
            "f1_regra_simples": comparacao["nivel_anterior"]["f1"],
        },
        "levados": (
            {"total": perfil["total_bos"], "itens": [{"rotulo": i["rotulo"], "parte": round(i["pct"], 3)} for i in perfil["levados"][:ITENS_LEVADOS]]}
            if perfil else None
        ),
        "mes": (
            {"referencia": agora["previstos"][i_mes], "regiao": agora["futuro_regiao"][i_mes], "atraso": agora["atraso"]}
            if agora else None
        ),
        "lugares": lugares,
    }
