"""Limpeza das bases "Celulares Subtraídos" e "Veículos Subtraídos" da SSP-SP.

Regras (ver o README):
- só BOs de roubo (art. 157); furto, perda e outras naturezas ficam fora;
- só a Região Metropolitana de São Paulo (código IBGE do município);
- um BO conta uma vez, pela chave delegacia + ano + número (a base repete linhas);
- faixa horária pela hora da ocorrência ou, sem ela, pelo período informado no BO;
- na capital, o lugar é o centro de distrito mais próximo; nos outros municípios, o próprio município.
Nada por ocorrência é devolvido: só contagens agregadas.
"""

from collections import Counter
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from risco.lugares import CODIGO_CAPITAL, lugar_mais_proximo
from risco.xlsx import ler_linhas

COLUNAS = [
    "NOME_DELEGACIA",
    "ANO_BO",
    "NUM_BO",
    "RUBRICA",
    "DATA_OCORRENCIA_BO",
    "HORA_OCORRENCIA",
    "DESCR_PERIODO",
    "LATITUDE",
    "LONGITUDE",
    "COD IBGE",
    "FLAG_STATUS",
]
APELIDOS = {"COD IBGE": ["CD_IBGE"]}  # nome da coluna nas bases de 2024 e 2025
INICIO = date(2024, 1, 1)
CAIXA = {"lat_min": -24.1, "lat_max": -23.15, "lng_min": -47.1, "lng_max": -45.75}
_ORIGEM_EXCEL = date(1899, 12, 30)
_VAZIOS = {"", "NULL"}


def e_roubo(rubrica: str) -> bool:
    r = rubrica.lower()
    return "roubo" in r or "art. 157" in r


def data_excel(serial: str) -> date | None:
    if serial.strip() in _VAZIOS:
        return None
    try:
        return _ORIGEM_EXCEL + timedelta(days=int(float(serial)))
    except ValueError:
        return None


def faixa_de_hora_cheia(hora: int) -> str:
    return ("madrugada", "manha", "tarde", "noite")[hora // 6]


def hora_cheia(hora_fracao: str) -> int | None:
    if hora_fracao.strip() in _VAZIOS:
        return None
    try:
        f = float(hora_fracao)
    except ValueError:
        return None
    if not 0 <= f < 1:
        return None
    return min(23, int(f * 24 + 1e-9))


def faixa_da_hora(hora_fracao: str, periodo: str) -> str | None:
    h = hora_cheia(hora_fracao)
    if h is not None:
        return faixa_de_hora_cheia(h)
    p = periodo.upper()
    for chave, faixa in (("MADRUGADA", "madrugada"), ("MANH", "manha"), ("TARDE", "tarde"), ("NOITE", "noite")):
        if chave in p:
            return faixa
    return None


def numero(texto: str) -> float | None:
    t = texto.strip()
    if t in _VAZIOS:
        return None
    try:
        v = float(t.replace(",", "."))
    except ValueError:
        return None
    return None if v == 0 else v


def cod_ibge(texto: str) -> int | None:
    try:
        v = int(float(texto.strip()))
    except ValueError:
        return None
    return v if 1_000_000 <= v <= 9_999_999 else None


def fim_do_ultimo_mes_completo(data_max: date) -> date:
    if (data_max + timedelta(days=1)).month != data_max.month:
        return data_max
    return data_max.replace(day=1) - timedelta(days=1)


def fim_da_cobertura(mensal: pd.Series, queda: float = 0.7) -> date:
    """Último dia do último mês que a base cobre por inteiro.

    `mensal`: roubos por mês (índice Period mensal, em ordem). Um mês no fim da série que tenha menos de `queda`
    vezes a mediana dos 3 meses anteriores ainda está sendo preenchido (mês corrente ou base atrasada) e sai.
    """
    meses = mensal.sort_index()
    i = len(meses) - 1
    while i >= 3 and meses.iloc[i] < queda * meses.iloc[i - 3 : i].median():
        i -= 1
    return meses.index[i].to_timestamp(how="end").date()


def _dentro_da_caixa(lat: float | None, lng: float | None) -> bool:
    return (
        lat is not None
        and lng is not None
        and CAIXA["lat_min"] <= lat <= CAIXA["lat_max"]
        and CAIXA["lng_min"] <= lng <= CAIXA["lng_max"]
    )


def _ler_bos(arquivos: dict[str, list[Path]], resumo: Counter, progresso=None) -> dict:
    """Junta as linhas de roubo por BO. Campos vazios numa linha são completados por outra linha do mesmo BO."""
    bos: dict[tuple, dict] = {}
    for tipo, caminhos in arquivos.items():
        for caminho in caminhos:
            for r in ler_linhas(caminho, COLUNAS, APELIDOS):
                resumo["linhas_lidas"] += 1
                if progresso and resumo["linhas_lidas"] % 200_000 == 0:
                    progresso(resumo["linhas_lidas"], caminho.name)
                if not e_roubo(r["RUBRICA"]):
                    continue
                chave = (r["NOME_DELEGACIA"], r["ANO_BO"], r["NUM_BO"])
                bo = bos.get(chave)
                if bo is None:
                    bo = bos[chave] = {"tipos": set(), "hora": "", "periodo": "", "lat": None, "lng": None}
                    bo["data"] = data_excel(r["DATA_OCORRENCIA_BO"])
                    bo["ibge"] = cod_ibge(r["COD IBGE"])
                    bo["tentado"] = r["FLAG_STATUS"].upper().startswith("TENTAD")
                bo["tipos"].add(tipo)
                if bo["data"] is None:
                    bo["data"] = data_excel(r["DATA_OCORRENCIA_BO"])
                if bo["ibge"] is None:
                    bo["ibge"] = cod_ibge(r["COD IBGE"])
                if hora_cheia(bo["hora"]) is None and hora_cheia(r["HORA_OCORRENCIA"]) is not None:
                    bo["hora"] = r["HORA_OCORRENCIA"]
                if faixa_da_hora("", bo["periodo"]) is None:
                    bo["periodo"] = r["DESCR_PERIODO"]
                if bo["lat"] is None:
                    lat, lng = numero(r["LATITUDE"]), numero(r["LONGITUDE"])
                    if _dentro_da_caixa(lat, lng):
                        bo["lat"], bo["lng"] = lat, lng
    return bos


def extrair(arquivos: dict[str, list[Path]], lugares: pd.DataFrame, hoje: date | None = None, progresso=None):
    """Lê as bases e devolve (agregado por lugar × data × faixa, resumo com as contagens de cada etapa)."""
    hoje = hoje or date.today()
    resumo: Counter = Counter()
    bos = _ler_bos(arquivos, resumo, progresso)
    resumo["bos_roubo"] = len(bos)

    rmsp = set(lugares.cod_ibge)
    validos = []
    for bo in bos.values():
        if bo["ibge"] not in rmsp:
            resumo["fora_da_rmsp"] += 1
            continue
        if bo["data"] is None or not INICIO <= bo["data"] <= hoje:
            resumo["fora_do_periodo"] += 1
            continue
        validos.append(bo)

    # Os meses mais recentes de cada base ainda estão sendo preenchidos (ex.: em set/2026 metade dos roubos de
    # celular da capital ainda não tinha coordenada). O período vai até o último mês completo da base que acaba
    # primeiro, medido nos roubos que de fato entram na contagem.
    usaveis = [bo for bo in validos if faixa_da_hora(bo["hora"], bo["periodo"]) and (bo["ibge"] != CODIGO_CAPITAL or bo["lat"] is not None)]
    fim_por_base = {}
    for tipo in sorted({t for bo in usaveis for t in bo["tipos"]}):
        datas = pd.to_datetime(pd.Series([bo["data"] for bo in usaveis if tipo in bo["tipos"]]))
        fim_por_base[tipo] = fim_da_cobertura(datas.dt.to_period("M").value_counts().sort_index())
    # e nunca um mês que o calendário ainda não fechou
    fim = min(*fim_por_base.values(), fim_do_ultimo_mes_completo(max(bo["data"] for bo in validos)))
    linhas, horas = [], []
    capital = lugares[lugares.cod_ibge == CODIGO_CAPITAL]
    pontos = []
    for bo in validos:
        if bo["data"] > fim:
            resumo["fora_do_periodo"] += 1
            continue
        faixa = faixa_da_hora(bo["hora"], bo["periodo"])
        if faixa is None:
            resumo["sem_hora"] += 1
            continue
        if bo["ibge"] == CODIGO_CAPITAL:
            if bo["lat"] is None:
                resumo["sem_coordenada"] += 1
                continue
            bairro = None
            pontos.append(len(linhas))
        else:
            bairro = f"mun_{bo['ibge']}"
        resumo["tentados"] += bo["tentado"]
        linhas.append(
            {
                "bairro": bairro,
                "data": bo["data"],
                "faixa_horaria": faixa,
                "roubos_celular": int("celular" in bo["tipos"]),
                "roubos_veiculo": int("veiculo" in bo["tipos"]),
                "_lat": bo["lat"],
                "_lng": bo["lng"],
            }
        )
        h = hora_cheia(bo["hora"])
        if h is not None:
            horas.append((h, bo["data"].weekday()))

    df = pd.DataFrame(linhas, columns=["bairro", "data", "faixa_horaria", "roubos_celular", "roubos_veiculo", "_lat", "_lng"])
    if pontos:
        idx = np.array(pontos)
        df.loc[idx, "bairro"] = lugar_mais_proximo(df.loc[idx, "_lat"].to_numpy(), df.loc[idx, "_lng"].to_numpy(), capital)
    df["roubos"] = 1
    agregado = (
        df.groupby(["bairro", "data", "faixa_horaria"], as_index=False)[["roubos", "roubos_celular", "roubos_veiculo"]]
        .sum()
        .sort_values(["bairro", "data", "faixa_horaria"], ignore_index=True)
    )
    por_hora = (
        pd.DataFrame(horas, columns=["hora", "dia_semana"])
        .value_counts()
        .rename("roubos")
        .reset_index()
        .sort_values(["dia_semana", "hora"], ignore_index=True)
    )
    saida = dict(resumo)
    for chave in ("fora_da_rmsp", "fora_do_periodo", "sem_hora", "sem_coordenada", "tentados"):
        saida.setdefault(chave, 0)
    saida["roubos_contados"] = int(agregado.roubos.sum())
    saida["periodo"] = {"inicio": INICIO.isoformat(), "fim": fim.isoformat()}
    saida["fim_por_base"] = {tipo: d.isoformat() for tipo, d in fim_por_base.items()}
    saida["por_ano"] = {str(a): int(v) for a, v in agregado.groupby(pd.to_datetime(agregado.data).dt.year).roubos.sum().items()}
    saida["por_hora"] = por_hora
    return agregado, saida
