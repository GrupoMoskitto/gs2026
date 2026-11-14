"""Perfil dos roubos: o que levam, como e onde, juntando as bases de celulares, veículos e objetos da SSP-SP.

Mesmas regras de `risco.ssp` (só roubo, só a Região Metropolitana, um BO conta uma vez pela chave
delegacia + ano + número). Um BO aparece em mais de uma base quando levaram mais de uma coisa: as linhas
de todas as bases são juntadas pelo BO. Nada por ocorrência sai daqui, só contagens.
"""

from collections import Counter
from datetime import date
from pathlib import Path

from risco.ssp import APELIDOS as APELIDOS_SSP, INICIO, cod_ibge, data_excel, e_roubo, faixa_da_hora
from risco.xlsx import ler_linhas

COLUNAS = ["NOME_DELEGACIA", "ANO_BO", "NUM_BO", "RUBRICA", "DATA_OCORRENCIA_BO", "HORA_OCORRENCIA",
           "DESCR_PERIODO", "COD IBGE", "DESCR_CONDUTA", "DESCR_TIPOLOCAL"]
COLUNAS_OBJETOS = COLUNAS + ["DESCR_TIPO_OBJETO"]
FAIXAS = ["madrugada", "manha", "tarde", "noite"]
APELIDOS = {**APELIDOS_SSP, "HORA_OCORRENCIA": ["HORA_OCORRENCIA_BO"]}  # nome na base de objetos de 2026


def conferir_cabecalhos(arquivos: dict[str, list[Path]]) -> None:
    """Lê só o começo de cada planilha: uma coluna faltando aparece antes da leitura longa."""
    for base, caminhos in arquivos.items():
        for caminho in caminhos:
            next(ler_linhas(caminho, COLUNAS_OBJETOS if base == "objetos" else COLUNAS, APELIDOS), None)

# O que foi levado: celular e veículo vêm da base de cada um; o resto, do tipo de objeto da base de objetos.
ITENS = {
    "Documentos": "Documentos",
    "Valor/Moeda": "Dinheiro",
    "Jóias e Afins": "Joias e relógios",
    "Artigos para Viagem": "Bolsa, mochila ou mala",
    "Vestuário e Acessórios": "Roupas e acessórios",
    "Informática": "Notebook ou tablet",
    "Telecomunicação": "Celular",  # alguns celulares aparecem só na base de objetos
}
# Conduta registrada no BO (como a vítima estava). "Outros" e vazio não dizem nada e ficam juntos.
CONDUTAS = {
    "Transeunte": "A pé, na rua",
    "Veículo": "Roubo do veículo",
    "Interior de Veículo": "Dentro do veículo",
    "Carga": "Carga",
    "Aplicativo de Mobilidade Urbana": "Motorista de aplicativo",
    "Residência": "Em casa",
    "Condomínio Residêncial": "Em casa",
    "Estabelecimento Comercial": "Comércio",
    "Interior Estabelecimento": "Comércio",
    "Estabelecimento-Outros": "Comércio",
    "Condomínio Comercial": "Comércio",
    "Joalheria": "Comércio",
    "Coletivo": "Transporte coletivo",
    "Interior Transporte Coletivo": "Transporte coletivo",
    "Saidinha de Banco": "Saída de banco ou caixa",
    "Caixa Eletrônico": "Saída de banco ou caixa",
}
LOCAIS = {
    "Via Pública": "Rua",
    "Residência": "Casa",
    "Condomínio Residencial": "Casa",
    "Terminal/Estação": "Terminal ou estação",
    "Comércio e Serviços": "Comércio",
    "Restaurante e Afins": "Comércio",
    "Shopping Center": "Comércio",
    "Centro Comercial/Empresarial": "Comércio",
    "Estacionamento/Garagem": "Estacionamento",
    "Rodovia/Estrada": "Rodovia",
}
NAO_INFORMADO = "Outros ou não informado"
_VAZIOS = {"", "NULL", "OUTROS"}


def _informado(v: str) -> bool:
    return v.strip().upper() not in _VAZIOS


def ler_bos(arquivos: dict[str, list[Path]], codigos_rmsp: set[int], fim: date, progresso=None) -> tuple[dict, Counter]:
    """Junta as linhas de roubo de todas as bases por BO. Devolve {chave: bo} e as contagens de cada etapa."""
    bos: dict[tuple, dict] = {}
    etapas: Counter = Counter()
    for base, caminhos in arquivos.items():
        colunas = COLUNAS_OBJETOS if base == "objetos" else COLUNAS
        for caminho in caminhos:
            for r in ler_linhas(caminho, colunas, APELIDOS):
                etapas["linhas_lidas"] += 1
                if progresso and etapas["linhas_lidas"] % 500_000 == 0:
                    progresso(etapas["linhas_lidas"], caminho.name)
                if not e_roubo(r["RUBRICA"]):
                    continue
                chave = (r["NOME_DELEGACIA"], r["ANO_BO"], r["NUM_BO"])
                bo = bos.get(chave)
                if bo is None:
                    bo = bos[chave] = {"bases": set(), "itens": set(), "conduta": "", "local": "", "faixa": None,
                                       "data": None, "ibge": None}
                bo["bases"].add(base)
                if base == "celular":
                    bo["itens"].add("Celular")
                elif base == "veiculo":
                    bo["itens"].add("Veículo")
                elif r["DESCR_TIPO_OBJETO"] in ITENS:
                    bo["itens"].add(ITENS[r["DESCR_TIPO_OBJETO"]])
                if bo["data"] is None:
                    bo["data"] = data_excel(r["DATA_OCORRENCIA_BO"])
                if bo["ibge"] is None:
                    bo["ibge"] = cod_ibge(r["COD IBGE"])
                if bo["faixa"] is None:
                    bo["faixa"] = faixa_da_hora(r["HORA_OCORRENCIA"], r["DESCR_PERIODO"])
                if not bo["conduta"] and _informado(r["DESCR_CONDUTA"]):
                    bo["conduta"] = r["DESCR_CONDUTA"].strip()
                if not bo["local"] and _informado(r["DESCR_TIPOLOCAL"]):
                    bo["local"] = r["DESCR_TIPOLOCAL"].strip()

    validos = {}
    for chave, bo in bos.items():
        if bo["ibge"] not in codigos_rmsp:
            etapas["fora_da_rmsp"] += 1
        elif bo["data"] is None or not INICIO <= bo["data"] <= fim:
            etapas["fora_do_periodo"] += 1
        else:
            validos[chave] = bo
    etapas["bos_roubo"] = len(bos)
    etapas["bos_validos"] = len(validos)
    return validos, etapas


def _ordenado(contagem: Counter, total: int, ultimo: str | None = None) -> list[dict]:
    itens = sorted(contagem.items(), key=lambda kv: (kv[0] == ultimo, -kv[1]))
    return [{"rotulo": k, "bos": v, "pct": round(v / total, 4)} for k, v in itens]


def resumir(bos: dict) -> dict:
    """Contagens agregadas do perfil dos roubos (nada por BO)."""
    total = len(bos)
    itens, condutas, locais, por_faixa = Counter(), Counter(), Counter(), {}
    combinacao, por_mes, com_celular = Counter(), {}, Counter()
    for bo in bos.values():
        itens.update(bo["itens"])
        conduta = CONDUTAS.get(bo["conduta"], NAO_INFORMADO)
        condutas[conduta] += 1
        locais[LOCAIS.get(bo["local"], NAO_INFORMADO if not bo["local"] else "Outros lugares")] += 1
        if bo["faixa"]:
            por_faixa.setdefault(conduta, Counter())[bo["faixa"]] += 1
        tem_cel, tem_vei = "celular" in bo["bases"], "veiculo" in bo["bases"]
        grupo = "celular_ou_veiculo" if tem_cel or tem_vei else "outros_objetos"
        combinacao[grupo] += 1
        mes = bo["data"].strftime("%Y-%m")
        por_mes.setdefault(mes, Counter())[grupo] += 1
        if tem_cel:
            com_celular.update(i for i in bo["itens"] if i != "Celular")
            com_celular["_total"] += 1
    n_cel = com_celular.pop("_total", 0)
    return {
        "total_bos": total,
        "cobertura": {k: {"bos": v, "pct": round(v / total, 4)} for k, v in combinacao.items()},
        "levados": _ordenado(itens, total),
        "levados_com_celular": _ordenado(com_celular, n_cel) if n_cel else [],
        "bos_com_celular": n_cel,
        "conduta": _ordenado(condutas, total, NAO_INFORMADO),
        "local": _ordenado(locais, total, NAO_INFORMADO),
        "conduta_por_faixa": {c: {f: por_faixa[c].get(f, 0) for f in FAIXAS} for c in por_faixa},
        "por_mes": [{"mes": m, **{g: por_mes[m].get(g, 0) for g in ("celular_ou_veiculo", "outros_objetos")}}
                    for m in sorted(por_mes)],
    }
