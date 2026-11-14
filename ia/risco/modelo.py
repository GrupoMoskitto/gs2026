"""Células, rótulos, features, treino, avaliação e exportação do modelo de risco.

Célula = lugar × faixa horária × tipo de dia (útil ou fim de semana): 129 × 4 × 2 = 1.032 células.
Pergunta: com o histórico de um período, qual o nível de risco de cada célula no período seguinte?
"""

from datetime import date, timedelta

import numpy as np
import pandas as pd

from risco.lugares import CENTRO_SE, distancia_km, distancia_paulista_km

FAIXAS = ["madrugada", "manha", "tarde", "noite"]
NIVEIS = ["baixo", "medio", "alto"]
CHAVE = ["bairro", "faixa_horaria", "fim_de_semana"]
COLUNAS_FEATURES = [
    "taxa_celula",
    "taxa_lugar",
    "participacao_faixa",
    "fracao_veiculo",
    "tipo_bairro",
    "tipo_distrito",
    "tipo_municipio",
    "dist_se_km",
    "dist_paulista_km",
    "faixa_codigo",
    "fim_de_semana",
]


def _no_intervalo(agregado: pd.DataFrame, inicio: date, fim: date) -> pd.DataFrame:
    d = pd.to_datetime(agregado.data)
    ag = agregado[(d >= pd.Timestamp(inicio)) & (d <= pd.Timestamp(fim))]
    return ag.assign(fim_de_semana=(pd.to_datetime(ag.data).dt.day_of_week >= 5).astype(int))


def _dias(inicio: date, fim: date) -> dict[int, int]:
    dias = pd.date_range(inicio, fim)
    fds = int((dias.day_of_week >= 5).sum())
    return {0: len(dias) - fds, 1: fds}


def _todas_as_celulas(lugares: pd.DataFrame) -> pd.DataFrame:
    return pd.MultiIndex.from_product([lugares.codigo, FAIXAS, [0, 1]], names=CHAVE).to_frame(index=False)


def taxas(agregado: pd.DataFrame, lugares: pd.DataFrame, inicio: date, fim: date) -> pd.DataFrame:
    """Roubos por dia em cada célula (dias úteis e de fim de semana contados à parte). Célula sem roubo = 0."""
    ag = _no_intervalo(agregado, inicio, fim)
    soma = ag.groupby(CHAVE).roubos.sum()
    t = _todas_as_celulas(lugares)
    t["roubos"] = soma.reindex(pd.MultiIndex.from_frame(t[CHAVE]), fill_value=0).to_numpy()
    t["taxa"] = t.roubos / t.fim_de_semana.map(_dias(inicio, fim))
    return t


def limites(taxa: pd.Series, p_medio: float = 50, p_alto: float = 80) -> tuple[float, float]:
    return float(np.percentile(taxa, p_medio)), float(np.percentile(taxa, p_alto))


def rotular(taxa: pd.Series, lim: tuple[float, float]) -> pd.Series:
    return pd.Series(np.select([taxa <= lim[0], taxa <= lim[1]], ["baixo", "medio"], "alto"), index=taxa.index)


def features(agregado: pd.DataFrame, lugares: pd.DataFrame, inicio: date, fim: date) -> pd.DataFrame:
    """Features de cada célula calculadas só com os roubos de `inicio` a `fim` (nada do período a prever)."""
    ag = _no_intervalo(agregado, inicio, fim)
    t = taxas(agregado, lugares, inicio, fim)
    total_dias = sum(_dias(inicio, fim).values())

    por_lugar = ag.groupby("bairro")[["roubos", "roubos_veiculo"]].sum().reindex(lugares.codigo, fill_value=0)
    por_faixa = ag.groupby(["bairro", "faixa_horaria"]).roubos.sum()

    lug = lugares.set_index("codigo")
    f = t[CHAVE].copy()
    f["taxa_celula"] = t.taxa
    f["taxa_lugar"] = f.bairro.map(por_lugar.roubos) / total_dias
    total = f.bairro.map(por_lugar.roubos)
    f["participacao_faixa"] = (
        por_faixa.reindex(pd.MultiIndex.from_frame(f[["bairro", "faixa_horaria"]]), fill_value=0).to_numpy() / total.replace(0, np.nan)
    ).fillna(0)
    f["fracao_veiculo"] = (f.bairro.map(por_lugar.roubos_veiculo) / total.replace(0, np.nan)).fillna(0)
    tipo = f.bairro.map(lug.tipo)
    for nome in ("bairro", "distrito", "municipio"):
        f[f"tipo_{nome}"] = (tipo == nome).astype(int)
    lat, lng = f.bairro.map(lug.latitude), f.bairro.map(lug.longitude)
    f["dist_se_km"] = distancia_km(lat, lng, *CENTRO_SE)
    f["dist_paulista_km"] = distancia_paulista_km(lat.to_numpy(), lng.to_numpy())
    f["faixa_codigo"] = f.faixa_horaria.map({x: i for i, x in enumerate(FAIXAS)})
    f["fim_de_semana_col"] = f.fim_de_semana
    f = f.set_index(CHAVE).rename(columns={"fim_de_semana_col": "fim_de_semana"})
    return f[COLUNAS_FEATURES]


def janelas(periodo_fim: date) -> dict[str, tuple[date, date]]:
    inicio_final = (pd.Timestamp(periodo_fim) - pd.DateOffset(years=1) + timedelta(days=1)).date()
    return {
        "treino_x": (date(2024, 1, 1), date(2024, 12, 31)),
        "treino_y": (date(2025, 1, 1), date(2025, 12, 31)),
        "teste_x": (date(2025, 1, 1), date(2025, 12, 31)),
        "teste_y": (date(2026, 1, 1), periodo_fim),
        "final_x": (inicio_final, periodo_fim),
    }


# ---------- treino, avaliação e exportação ----------

FAIXA_DO_SCORE = {"baixo": (0.05, 0.34), "medio": (0.35, 0.59), "alto": (0.60, 0.95)}
GRADE = {"n_estimators": [200, 400], "max_depth": [None, 8, 14], "min_samples_leaf": [1, 3]}


def treinar(x: pd.DataFrame, y: pd.Series, semente: int = 42, busca: bool = True):
    """RandomForest com classes balanceadas. Com `busca`, escolhe hiperparâmetros por validação cruzada (F1 macro)."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import GridSearchCV, StratifiedKFold

    base = RandomForestClassifier(class_weight="balanced", random_state=semente, n_jobs=-1)
    if not busca:
        return base.set_params(n_estimators=200).fit(x, y)
    grade = GridSearchCV(
        base, GRADE, scoring="f1_macro", cv=StratifiedKFold(5, shuffle=True, random_state=semente), n_jobs=-1
    )
    grade.fit(x, y)
    modelo = grade.best_estimator_
    modelo.melhores_parametros_ = grade.best_params_
    modelo.f1_validacao_ = float(grade.best_score_)
    return modelo


def referencias(y_treino: pd.Series, y_anterior_teste: pd.Series) -> dict[str, np.ndarray]:
    """Modelos de comparação: sempre a classe mais comum, e o nível do período anterior se repete."""
    mais_comum = y_treino.value_counts().idxmax()
    return {
        "classe_mais_comum": np.full(len(y_anterior_teste), mais_comum, dtype=object),
        "nivel_anterior": np.asarray(y_anterior_teste, dtype=object),
    }


def avaliar(y_true, y_pred) -> dict:
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score

    return {
        "acuracia": float(accuracy_score(y_true, y_pred)),
        "f1_macro": float(f1_score(y_true, y_pred, labels=NIVEIS, average="macro", zero_division=0)),
        "matriz": confusion_matrix(y_true, y_pred, labels=NIVEIS).tolist(),
        "relatorio": classification_report(y_true, y_pred, labels=NIVEIS, output_dict=True, zero_division=0),
    }


def score_da_probabilidade(p_baixo: float, p_medio: float, p_alto: float) -> tuple[str, float]:
    """Nível = classe mais provável. Score = risco esperado, preso à faixa do nível (mesmos cortes do app)."""
    nivel = NIVEIS[int(np.argmax([p_baixo, p_medio, p_alto]))]
    esperado = p_medio * 0.5 + p_alto * 1.0
    lo, hi = FAIXA_DO_SCORE[nivel]
    return nivel, round(float(min(max(esperado, lo), hi)), 2)


def probabilidades(modelo, x: pd.DataFrame) -> pd.DataFrame:
    """Probabilidade de cada nível por lugar × faixa, juntando dia útil (5/7) e fim de semana (2/7)."""
    p = pd.DataFrame(modelo.predict_proba(x), index=x.index, columns=modelo.classes_).reindex(columns=NIVEIS, fill_value=0)
    peso = np.where(p.index.get_level_values("fim_de_semana") == 1, 2 / 7, 5 / 7)
    return p.mul(peso, axis=0).groupby(level=["bairro", "faixa_horaria"]).sum()


def previsoes(modelo, x_final: pd.DataFrame) -> list[dict]:
    """Lista no formato do contrato: {bairro, faixa_horaria, nivel_risco, score}, uma por lugar × faixa."""
    p = probabilidades(modelo, x_final)
    ordem = {f: i for i, f in enumerate(FAIXAS)}
    saida = []
    for (bairro, faixa), linha in sorted(p.iterrows(), key=lambda kv: (kv[0][0], ordem[kv[0][1]])):
        nivel, score = score_da_probabilidade(linha.baixo, linha.medio, linha.alto)
        saida.append({"bairro": bairro, "faixa_horaria": faixa, "nivel_risco": nivel, "score": score})
    return saida
