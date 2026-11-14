"""Previsão do mês corrente: quantos roubos esperar em cada lugar e faixa enquanto a SSP ainda não publicou o mês.

A SSP publica com atraso: em meados de novembro, o último mês completo da base é agosto. O modelo prevê os meses
que faltam a partir do que já está publicado, e os relatos dos moradores (que chegam na hora) corrigem a previsão.

Célula = lugar × faixa horária (129 × 4 = 516). Valor = roubos por dia no mês.
"""

from datetime import date

import numpy as np
import pandas as pd

from risco.lugares import CENTRO_SE, distancia_km

FAIXAS = ["madrugada", "manha", "tarde", "noite"]
ATRASO = 3  # meses entre o último mês publicado e o mês corrente
TODAS = ["r_ultimo", "r_3m", "r_12m", "r_ano_passado", "tendencia", "posicao_12m",
         "faixa_codigo", "dist_se_km", "municipio", "mes_do_ano", "horizonte"]
# As que o modelo usa. "Mesmo mês do ano anterior" e "mês do ano" ficaram de fora: com só 2 anos e meio de dados
# e os roubos caindo, elas puxavam a previsão para o nível mais alto do ano anterior (teste em 2026: o erro do total
# da região subia de 482 para 601 roubos por mês). "Mesmo mês do ano anterior" segue como regra de comparação.
COLUNAS = ["r_ultimo", "r_3m", "r_12m", "tendencia", "faixa_codigo", "dist_se_km", "municipio", "horizonte"]
PESOS = [5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560]  # dias de peso da previsão na correção pelos relatos
ADESOES = [0.01, 0.02, 0.05, 0.10, 0.20]


def taxa_mensal(agregado: pd.DataFrame, lugares: pd.DataFrame, fim: date) -> pd.DataFrame:
    """Roubos por dia de cada célula (linhas, na ordem de `lugares` e FAIXAS) em cada mês (colunas)."""
    ag = agregado[pd.to_datetime(agregado.data) <= pd.Timestamp(fim)]
    mes = pd.to_datetime(ag.data).dt.to_period("M")
    meses = pd.period_range(mes.min(), pd.Timestamp(fim).to_period("M"), freq="M")
    celulas = pd.MultiIndex.from_product([lugares.codigo, FAIXAS], names=["bairro", "faixa_horaria"])
    soma = ag.assign(mes=mes).groupby(["bairro", "faixa_horaria", "mes"]).roubos.sum().unstack("mes")
    soma = soma.reindex(index=celulas, columns=meses, fill_value=0).fillna(0)
    return soma / np.array([m.days_in_month for m in meses])


def _estaticas(t: pd.DataFrame, lugares: pd.DataFrame) -> pd.DataFrame:
    lug = lugares.set_index("codigo")
    b = t.index.get_level_values("bairro")
    return pd.DataFrame({
        "faixa_codigo": [FAIXAS.index(f) for f in t.index.get_level_values("faixa_horaria")],
        "dist_se_km": distancia_km(lug.loc[b, "latitude"].to_numpy(), lug.loc[b, "longitude"].to_numpy(), *CENTRO_SE),
        "municipio": (lug.loc[b, "tipo"].to_numpy() == "municipio").astype(int),
    }, index=t.index)


def features(t: pd.DataFrame, lugares: pd.DataFrame, alvo: pd.Period, horizonte: int) -> pd.DataFrame:
    """Features para prever o mês `alvo` usando só os meses até `alvo - horizonte` (o que já estaria publicado)."""
    publicados = [m for m in t.columns if m <= alvo - horizonte]
    if len(publicados) < 12:
        raise ValueError(f"{alvo}: precisa de 12 meses publicados antes, há {len(publicados)}")
    x = _estaticas(t, lugares)
    x["r_ultimo"] = t[publicados[-1]]
    x["r_3m"] = t[publicados[-3:]].mean(axis=1)
    x["r_12m"] = t[publicados[-12:]].mean(axis=1)
    # mesmo mês do ano anterior (sazonalidade), se já publicado; senão a média de 12 meses
    x["r_ano_passado"] = t[alvo - 12] if (alvo - 12) in publicados else x["r_12m"]
    x["tendencia"] = (x.r_3m + 0.01) / (x.r_12m + 0.01)
    x["posicao_12m"] = x.r_12m.rank(pct=True)
    x["mes_do_ano"] = alvo.month
    x["horizonte"] = horizonte
    return x[TODAS]


def alvos_possiveis(t: pd.DataFrame, horizonte: int) -> list[pd.Period]:
    return [m for m in t.columns if len([p for p in t.columns if p <= m - horizonte]) >= 12]


def treinar(t: pd.DataFrame, lugares: pd.DataFrame, alvos: list[pd.Period], horizontes=(1, 2, 3), semente: int = 42):
    """RandomForest de regressão: um modelo para todos os horizontes (o horizonte é uma feature)."""
    from sklearn.ensemble import RandomForestRegressor

    pares = [(m, h) for h in horizontes for m in alvos if m in alvos_possiveis(t, h)]
    x = pd.concat([features(t, lugares, m, h) for m, h in pares])
    y = pd.concat([t[m] for m, _ in pares])
    return RandomForestRegressor(n_estimators=300, min_samples_leaf=5, random_state=semente, n_jobs=-1).fit(x[COLUNAS], y)


def prever(modelo, x: pd.DataFrame) -> np.ndarray:
    return np.clip(modelo.predict(x[list(modelo.feature_names_in_)]), 0, None)


def referencias(x: pd.DataFrame) -> dict[str, np.ndarray]:
    """Regras simples que o modelo precisa superar."""
    return {
        "ultimo_publicado": x.r_ultimo.to_numpy(),
        "media_3m": x.r_3m.to_numpy(),
        "media_12m": x.r_12m.to_numpy(),
        "mesmo_mes_ano_passado": x.r_ano_passado.to_numpy(),
    }


def teste_retroativo(t: pd.DataFrame, lugares: pd.DataFrame, alvos: list[pd.Period], horizonte: int = ATRASO):
    """Para cada mês de `alvos`: treina só com o que estaria publicado naquela época e prevê o mês.

    Devolve uma tabela com uma linha por célula e mês: real, modelo e as referências (roubos por dia).
    """
    linhas = []
    for alvo in alvos:
        ultimo = alvo - horizonte
        treino = [m for m in t.columns if m <= ultimo]  # rótulos que já seriam conhecidos
        modelo = treinar(t[treino], lugares, treino, horizontes=(horizonte,))
        x = features(t, lugares, alvo, horizonte)
        bloco = pd.DataFrame({"mes": str(alvo), "real": t[alvo].to_numpy(), "modelo": prever(modelo, x),
                              **referencias(x)}, index=t.index)
        linhas.append(bloco)
    return pd.concat(linhas)


def erro_medio(tabela: pd.DataFrame) -> dict[str, float]:
    """Erro absoluto médio (roubos por dia por célula) de cada coluna em relação ao real."""
    return {c: float(np.mean(np.abs(tabela[c] - tabela.real))) for c in tabela.columns if c not in ("mes", "real")}


# ---------- relatos dos moradores ----------

def corrigir_com_relatos(previsto, relatos, adesao: float, dias, peso: float):
    """Média a posteriori gama-Poisson: a previsão vale `peso` dias de observação; os relatos, `dias` dias.

    `adesao` é a fração das vítimas que relatam pelo app: `relatos / adesao` estima os roubos de verdade.
    Sem relatos e com peso alto, fica perto da previsão; com muitos relatos, segue os relatos.
    """
    previsto, relatos, dias = (np.asarray(v, dtype=float) for v in (previsto, relatos, dias))
    return (previsto * peso + relatos / adesao) / (peso + dias)


def simular_relatos(tabela: pd.DataFrame, adesao: float, semente: int = 42) -> np.ndarray:
    """Cada roubo real do mês vira relato no app com probabilidade `adesao`."""
    dias = np.array([pd.Period(m).days_in_month for m in tabela.mes])
    roubos = np.rint(tabela.real.to_numpy() * dias).astype(int)
    return np.random.default_rng(semente).binomial(roubos, adesao)


def avaliar_relatos(calibracao: pd.DataFrame, teste: pd.DataFrame, adesoes=ADESOES, semente: int = 42) -> list[dict]:
    """Para cada adesão: escolhe o peso nos meses de calibração e mede o ganho nos meses de teste."""
    resultado = []
    for i, adesao in enumerate(adesoes):
        dias_c = np.array([pd.Period(m).days_in_month for m in calibracao.mes])
        rel_c = simular_relatos(calibracao, adesao, semente + i)
        erro = lambda p: np.mean(np.abs(corrigir_com_relatos(calibracao.modelo, rel_c, adesao, dias_c, p) - calibracao.real))
        peso = min(PESOS, key=erro)
        dias_t = np.array([pd.Period(m).days_in_month for m in teste.mes])
        rel_t = simular_relatos(teste, adesao, semente + 100 + i)
        corrigido = corrigir_com_relatos(teste.modelo, rel_t, adesao, dias_t, peso)
        sem, com = float(np.mean(np.abs(teste.modelo - teste.real))), float(np.mean(np.abs(corrigido - teste.real)))
        resultado.append({"adesao": adesao, "peso_dias": peso, "erro_modelo": sem, "erro_com_relatos": com,
                          "ganho": 1 - com / sem})
    return resultado


# ---------- previsão dos meses ainda não publicados ----------

def intervalo_poisson(taxa: np.ndarray, dias: int, baixo: float = 0.1, alto: float = 0.9) -> tuple[np.ndarray, np.ndarray]:
    """Faixa provável (10% a 90%) de roubos no mês, se o número seguir uma Poisson com a média prevista."""
    from scipy.stats import poisson

    media = np.asarray(taxa) * dias
    return poisson.ppf(baixo, media), poisson.ppf(alto, media)


def prever_proximos(t: pd.DataFrame, lugares: pd.DataFrame, meses_a_frente: int = ATRASO) -> pd.DataFrame:
    """Previsão dos `meses_a_frente` meses depois do último publicado, com um modelo treinado em tudo."""
    ultimo = t.columns[-1]
    horizontes = tuple(range(1, meses_a_frente + 1))
    modelo = treinar(t, lugares, list(t.columns), horizontes=horizontes)
    linhas = []
    for h in horizontes:
        alvo = ultimo + h
        x = features(t, lugares, alvo, h)
        taxa = prever(modelo, x)
        lo, hi = intervalo_poisson(taxa, alvo.days_in_month)
        linhas.append(pd.DataFrame({"mes": str(alvo), "taxa": taxa, "roubos": taxa * alvo.days_in_month,
                                    "roubos_min": lo, "roubos_max": hi}, index=t.index))
    return pd.concat(linhas)


def niveis_relativos(taxa: pd.Series, p_medio: float = 50, p_alto: float = 80) -> pd.Series:
    """Nível de cada célula entre as outras do mesmo mês (mesmos percentis do modelo anual)."""
    a, b = np.percentile(taxa, p_medio), np.percentile(taxa, p_alto)
    return pd.Series(np.select([taxa <= a, taxa <= b], ["baixo", "medio"], "alto"), index=taxa.index)
