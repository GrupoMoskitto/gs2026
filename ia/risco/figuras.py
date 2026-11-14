"""Figuras do notebook e do README. Cada função recebe tabelas já prontas e devolve uma Figure."""

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle

from risco import estilo as e

FAIXAS = ["madrugada", "manha", "tarde", "noite"]
DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
DIAS_EXTENSO = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def _milhar(v: float) -> str:
    return f"{v:,.0f}".replace(",", ".")


def _legenda_niveis(ax, loc="lower left", **kw):
    itens = [
        Line2D([0], [0], marker="o", ls="", markersize=9, markerfacecolor=e.COR_NIVEL[n], markeredgecolor="white", label=e.NOME_NIVEL[n])
        for n in ("baixo", "medio", "alto")
    ]
    ax.legend(handles=itens, title="Nível de risco", loc=loc, title_fontsize=9.5, fontsize=9.5, **kw)


def mapa_risco(lugares: pd.DataFrame, prev: pd.DataFrame, destaques: int = 6):
    """Pequenos múltiplos: um mapa por faixa horária. Círculo = lugar; tamanho = roubos por dia; cor = nível previsto.

    `prev`: bairro, faixa_horaria, nivel_risco, taxa (roubos por dia no último ano).
    """
    d = prev.merge(lugares, left_on="bairro", right_on="codigo")
    tam = 18 + 900 * np.sqrt(d.taxa / d.taxa.max())
    d = d.assign(tam=tam)
    fig, eixos = plt.subplots(2, 2, figsize=(12, 10.5), sharex=True, sharey=True)
    for ax, faixa in zip(eixos.flat, FAIXAS):
        x = d[d.faixa_horaria == faixa].sort_values("taxa")
        ax.add_patch(Rectangle((-47.1, -24.1), 1.35, 0.95, fill=True, color=e.FUNDO, zorder=0, lw=0))
        ax.scatter(x.longitude, x.latitude, s=x.tam, c=x.nivel_risco.map(e.COR_NIVEL), alpha=0.85, edgecolors="white", linewidths=1.2, zorder=2)
        rotulados: list[tuple[float, float]] = []
        for _, r in x.sort_values("taxa", ascending=False).iterrows():
            if len(rotulados) == destaques:
                break
            # pula o lugar se o rótulo for cair em cima de outro
            if any(abs(r.longitude - a) < 0.17 and abs(r.latitude - b) < 0.05 for a, b in rotulados):
                continue
            rotulados.append((r.longitude, r.latitude))
            ax.annotate(r.nome, (r.longitude, r.latitude), xytext=(8, 6), textcoords="offset points", fontsize=8.5, color=e.TEXTO, zorder=3)
        ax.set_title(e.NOME_FAIXA[faixa], fontsize=12)
        ax.set_aspect("equal")
        ax.set_xlim(-47.05, -45.85)
        ax.set_ylim(-24.05, -23.2)
        ax.set_xticks([])
        ax.set_yticks([])
        for s in ax.spines.values():
            s.set_visible(False)
        altos = int((x.nivel_risco == "alto").sum())
        ax.text(0.98, 0.03, f"{altos} lugares em risco alto", transform=ax.transAxes, ha="right", fontsize=9.5, color=e.TEXTO_SUAVE)
    _legenda_niveis(eixos.flat[0], loc="upper left")
    altos = d[d.nivel_risco == "alto"].groupby("faixa_horaria").size().reindex(FAIXAS, fill_value=0)
    dia = altos.drop("noite")
    e.titulo(fig, f"À noite, {altos['noite']} lugares ficam em risco alto; no resto do dia, de {dia.min()} a {dia.max()}", "Previsão do modelo por lugar e faixa horária. Tamanho do círculo = roubos por dia no último ano.")
    e.fonte(fig, e.FONTE_SSP + " Cada círculo é o centro do distrito (capital) ou do município.")
    fig.tight_layout(h_pad=2.5)
    return fig


def funil(resumo: dict):
    etapas = [
        ("Linhas lidas nas 6 bases", resumo["linhas_lidas"]),
        ("BOs de roubo (sem repetição)", resumo["bos_roubo"]),
        ("Na Região Metropolitana", resumo["bos_roubo"] - resumo["fora_da_rmsp"]),
        ("No período, com hora e local", resumo["roubos_contados"]),
    ]
    fig, ax = plt.subplots(figsize=(10, 3.6))
    nomes, valores = zip(*etapas)
    y = np.arange(len(etapas))[::-1]
    ax.barh(y, valores, color=[e.LINHA, e.LINHA, e.LINHA, e.PRIMARIA], height=0.62)
    for yi, v in zip(y, valores):
        ax.text(v + max(valores) * 0.01, yi, _milhar(v), va="center", fontsize=10.5, color=e.TEXTO)
    ax.set_yticks(y, nomes, fontsize=10.5, color=e.TEXTO)
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.set_xlim(0, max(valores) * 1.15)
    descartes = f"Descartados: {_milhar(resumo['sem_coordenada'])} sem coordenada na capital, {_milhar(resumo['sem_hora'])} sem hora nem período, {_milhar(resumo['fora_do_periodo'])} fora do período."
    e.titulo(fig, f"De {_milhar(resumo['linhas_lidas'])} linhas a {_milhar(resumo['roubos_contados'])} roubos", descartes)
    e.fonte(fig)
    return fig


def relogio(por_hora: pd.DataFrame):
    h = por_hora.groupby("hora").roubos.sum().reindex(range(24), fill_value=0)
    fig, ax = plt.subplots(figsize=(11, 4.2))
    for i, faixa in enumerate(FAIXAS):
        if i % 2 == 0:
            ax.axvspan(i * 6 - 0.5, i * 6 + 5.5, color=e.FUNDO, zorder=0)
        parte = h.iloc[i * 6 : i * 6 + 6].sum() / h.sum()
        ax.text(i * 6 + 2.5, h.max() * 1.1, f"{e.NOME_FAIXA[faixa].split(' ')[0]}\n{parte:.0%}", ha="center", va="bottom", fontsize=10, color=e.TEXTO_SUAVE)
    pico = int(h.idxmax())
    cores = [e.PRIMARIA if i == pico else "#9CC9F5" for i in range(24)]
    ax.bar(h.index, h.values, color=cores, width=0.78, zorder=2)
    ax.set_xticks(range(0, 24, 2), [f"{x}h" for x in range(0, 24, 2)])
    ax.set_ylim(0, h.max() * 1.3)
    ax.yaxis.grid(True)
    ax.set_axisbelow(True)
    ax.spines["left"].set_visible(False)
    ax.set_ylabel("Roubos (2024–2026)")
    ax.yaxis.set_major_formatter(lambda v, _: _milhar(v))
    noite = h.iloc[18:].sum() / h.sum()
    e.titulo(fig, f"A noite concentra {noite:.0%} dos roubos; o pico é às {pico}h", "Roubos por hora da ocorrência, BOs com hora informada.")
    e.fonte(fig)
    return fig


def calendario(por_hora: pd.DataFrame):
    m = por_hora.pivot_table(index="dia_semana", columns="hora", values="roubos", aggfunc="sum").reindex(index=range(7), columns=range(24), fill_value=0)
    fig, ax = plt.subplots(figsize=(11, 3.8))
    im = ax.imshow(m.values, cmap=e.RAMPA, aspect="auto")
    ax.set_yticks(range(7), DIAS)
    ax.set_xticks(range(0, 24, 2), [f"{x}h" for x in range(0, 24, 2)])
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks(np.arange(-0.5, 24), minor=True)
    ax.set_yticks(np.arange(-0.5, 7), minor=True)
    ax.grid(which="minor", color="white", linewidth=2)
    ax.tick_params(which="minor", length=0)
    barra = fig.colorbar(im, ax=ax, fraction=0.025, pad=0.02)
    barra.outline.set_visible(False)
    barra.set_label("Roubos", color=e.TEXTO_SUAVE)
    d, hh = np.unravel_index(m.values.argmax(), m.shape)
    e.titulo(fig, f"{DIAS_EXTENSO[d]} às {hh}h é o horário com mais roubos", "Roubos por dia da semana e hora (2024–2026).")
    e.fonte(fig)
    return fig


def serie_mensal(mensal: pd.DataFrame):
    """`mensal`: mes (Timestamp do 1º dia), celular, veiculo."""
    fig, ax = plt.subplots(figsize=(11, 4.2))
    for tipo, rotulo in (("celular", "Roubo com celular"), ("veiculo", "Roubo de veículo")):
        ax.plot(mensal.mes, mensal[tipo], color=e.COR_SERIE[tipo], lw=2.2, marker="o", markersize=4)
        ax.annotate(rotulo, (mensal.mes.iloc[-1], mensal[tipo].iloc[-1]), xytext=(8, 0), textcoords="offset points", va="center", color=e.TEXTO, fontsize=10)
    ax.set_ylim(0, None)
    ax.yaxis.grid(True)
    ax.spines["left"].set_visible(False)
    ax.yaxis.set_major_formatter(lambda v, _: _milhar(v))
    ax.set_ylabel("Roubos por mês")
    ax.set_xlim(mensal.mes.iloc[0] - pd.Timedelta(days=15), mensal.mes.iloc[-1] + pd.Timedelta(days=110))
    ticks = mensal.mes[mensal.mes.dt.month.isin([1, 4, 7, 10])]
    ax.set_xticks(ticks, [f"{MESES[t.month - 1]}/{str(t.year)[2:]}" for t in ticks])
    a, b = mensal.iloc[:12][["celular", "veiculo"]].sum().sum(), mensal.iloc[-12:][["celular", "veiculo"]].sum().sum()
    e.titulo(fig, f"Os roubos caíram {1 - b / a:.0%} entre 2024 e os últimos 12 meses", "Roubos por mês na Região Metropolitana. Um BO com celular e veículo conta nas duas linhas.")
    e.fonte(fig)
    return fig


def ranking(tabela: pd.DataFrame, top: int = 15):
    """`tabela`: nome, taxa (roubos por dia à noite), nivel_risco."""
    t = tabela.nlargest(top, "taxa").iloc[::-1]
    fig, ax = plt.subplots(figsize=(10, 6.2))
    ax.barh(t.nome, t.taxa, color=t.nivel_risco.map(e.COR_NIVEL), height=0.66)
    for i, (v, n) in enumerate(zip(t.taxa, t.nivel_risco)):
        ax.text(v + t.taxa.max() * 0.01, i, f"{v:.1f}".replace(".", ",") + f" · {e.NOME_NIVEL[n]}", va="center", fontsize=9.5, color=e.TEXTO)
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", labelsize=10, labelcolor=e.TEXTO)
    ax.set_xlim(0, t.taxa.max() * 1.22)
    e.titulo(fig, f"{t.nome.iloc[-1]} lidera os roubos à noite", "Roubos por noite no último ano. Municípios inteiros aparecem ao lado de distritos da capital. Cor e texto = nível previsto.")
    e.fonte(fig)
    return fig


def matriz_confusao(matriz: list[list[int]]):
    m = np.array(matriz)
    pct = m / m.sum(axis=1, keepdims=True)
    nomes = [e.NOME_NIVEL[n] for n in ("baixo", "medio", "alto")]
    fig, ax = plt.subplots(figsize=(6.4, 5.2))
    ax.imshow(pct, cmap=e.RAMPA, vmin=0, vmax=1)
    for i in range(3):
        for j in range(3):
            cor = "white" if pct[i, j] > 0.55 else e.TEXTO
            ax.text(j, i, f"{m[i, j]}\n{pct[i, j]:.0%}", ha="center", va="center", color=cor, fontsize=11)
    ax.set_xticks(range(3), nomes)
    ax.set_yticks(range(3), nomes)
    ax.set_xlabel("Previsto pelo modelo")
    ax.set_ylabel("Real (2026)")
    for s in ax.spines.values():
        s.set_visible(False)
    acerto = np.trace(m) / m.sum()
    e.titulo(fig, f"O modelo acerta {acerto:.0%} das células", "Teste: histórico de 2025 → nível real de 2026. % por linha.")
    return fig


def comparacao_f1(f1s: dict[str, float]):
    nomes = {"modelo": "RandomForest (nosso)", "nivel_anterior": "Repetir o nível do ano anterior", "classe_mais_comum": "Sempre a classe mais comum"}
    itens = sorted(f1s.items(), key=lambda kv: kv[1])
    fig, ax = plt.subplots(figsize=(9, 3.2))
    rotulos = [nomes.get(k, k) for k, _ in itens]
    valores = [v for _, v in itens]
    ax.barh(rotulos, valores, color=[e.PRIMARIA if k == "modelo" else e.LINHA for k, _ in itens], height=0.6)
    for i, v in enumerate(valores):
        ax.text(v + 0.01, i, f"{v:.3f}".replace(".", ","), va="center", fontsize=10.5, color=e.TEXTO)
    ax.set_xlim(0, 1.08)
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", labelcolor=e.TEXTO, labelsize=10.5)
    melhor_ref = max(v for k, v in f1s.items() if k != "modelo")
    dif = (f1s["modelo"] - melhor_ref) * 100
    if dif > 0:
        texto = f"O modelo fica {dif:.1f} pontos de F1 à frente da referência mais forte".replace(".", ",")
    else:
        texto = "O modelo não supera a referência mais forte"
    e.titulo(fig, texto, "F1 macro no teste (2026). Quanto maior, melhor.")
    return fig


NOMES_FEATURES = {
    "taxa_celula": "Roubos/dia da célula no ano anterior",
    "taxa_lugar": "Roubos/dia do lugar no ano anterior",
    "participacao_faixa": "Peso da faixa no total do lugar",
    "fracao_veiculo": "Fração de roubos de veículo",
    "dist_se_km": "Distância à Praça da Sé",
    "dist_paulista_km": "Distância à Av. Paulista",
    "faixa_codigo": "Faixa horária",
    "fim_de_semana": "Fim de semana",
    "tipo_bairro": "É bairro da Paulista",
    "tipo_distrito": "É distrito da capital",
    "tipo_municipio": "É outro município",
}


def importancia(nomes: list[str], valores: list[float]):
    s = pd.Series(valores, index=[NOMES_FEATURES.get(n, n) for n in nomes]).sort_values()
    fig, ax = plt.subplots(figsize=(9, 4.6))
    ax.barh(s.index, s.values, color=e.PRIMARIA, height=0.62)
    for i, v in enumerate(s.values):
        ax.text(v + 0.005, i, f"{v:.0%}", va="center", fontsize=9.5, color=e.TEXTO)
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", labelcolor=e.TEXTO)
    ax.set_xlim(0, s.max() * 1.15)
    e.titulo(fig, "O histórico do lugar é o que mais pesa", "Importância de cada feature no RandomForest.")
    return fig


def grade_lugar_faixa(prev: pd.DataFrame, lugares: pd.DataFrame, top: int = 30):
    """Mapa de calor dos lugares de maior risco × faixas, com o nível escrito em cada célula (o que o app mostra)."""
    d = prev.merge(lugares[["codigo", "nome"]], left_on="bairro", right_on="codigo")
    ordem = d.groupby("nome").score.mean().nlargest(top).index
    s = d.pivot(index="nome", columns="faixa_horaria", values="score").loc[ordem, FAIXAS]
    n = d.pivot(index="nome", columns="faixa_horaria", values="nivel_risco").loc[ordem, FAIXAS]
    fig, ax = plt.subplots(figsize=(8.2, 0.34 * top + 1.6))
    for i, nome in enumerate(ordem):
        for j, faixa in enumerate(FAIXAS):
            nivel = n.loc[nome, faixa]
            ax.add_patch(Rectangle((j + 0.04, i + 0.06), 0.92, 0.88, color=e.COR_NIVEL[nivel], alpha=0.25 + 0.75 * s.loc[nome, faixa]))
            ax.text(j + 0.5, i + 0.5, e.NOME_NIVEL[nivel], ha="center", va="center", fontsize=8.5, color="white" if nivel == "alto" else e.TEXTO)
    ax.set_xlim(0, 4)
    ax.set_ylim(top, 0)
    ax.set_xticks(np.arange(4) + 0.5, [e.NOME_FAIXA[f].replace(" (", "\n(") for f in FAIXAS])
    ax.xaxis.tick_top()
    ax.set_yticks(np.arange(top) + 0.5, ordem, fontsize=9, color=e.TEXTO)
    for sp in ax.spines.values():
        sp.set_visible(False)
    e.titulo(fig, f"Os {top} lugares de maior risco, faixa a faixa", "Nível previsto que vai para o app (previsoes.json). Cor mais forte = score maior.")
    return fig


def previsao_mensal(regiao: pd.DataFrame, futuro: pd.DataFrame, erro_tipico: float):
    """`regiao`: mes, real, modelo, media_3m (roubos no mês, teste). `futuro`: mes, roubos (previsão)."""
    fig, ax = plt.subplots(figsize=(11, 4.2))
    x = [pd.Period(m).to_timestamp() for m in regiao.mes]
    xf = [pd.Period(m).to_timestamp() for m in futuro.mes]
    ax.plot(x, regiao.real, color=e.TEXTO, lw=2.2, marker="o", markersize=4)
    ax.plot(x, regiao.media_3m, color=e.TEXTO_SUAVE, lw=1.6, ls="--")
    ax.plot(x, regiao.modelo, color=e.PRIMARIA, lw=2.2, marker="o", markersize=4)
    ax.fill_between(xf, futuro.roubos - erro_tipico, futuro.roubos + erro_tipico, color=e.PRIMARIA_SUAVE, lw=0)
    ax.plot([x[-1]] + xf, [regiao.modelo.iloc[-1]] + list(futuro.roubos), color=e.PRIMARIA, lw=2.2, ls=":", marker="o", markersize=4)
    for serie, y, cor in (("Real", regiao.real.iloc[-1], e.TEXTO), ("Modelo", futuro.roubos.iloc[-1], e.PRIMARIA)):
        alvo = x[-1] if serie == "Real" else xf[-1]
        ax.annotate(serie, (alvo, y), xytext=(8, 0), textcoords="offset points", va="center", color=cor, fontsize=10)
    ax.annotate("Média de 3 meses", (x[-1], regiao.media_3m.iloc[-1]), xytext=(8, 0), textcoords="offset points",
                va="center", color=e.TEXTO_SUAVE, fontsize=9.5)
    ax.axvline(xf[0] - pd.Timedelta(days=15), color=e.LINHA, lw=1)
    ax.text(xf[0] - pd.Timedelta(days=10), ax.get_ylim()[1], "ainda não publicado", va="top", color=e.TEXTO_SUAVE, fontsize=9.5)
    ax.yaxis.grid(True)
    ax.spines["left"].set_visible(False)
    ax.yaxis.set_major_formatter(lambda v, _: _milhar(v))
    ax.set_ylabel("Roubos no mês")
    todos = x + xf
    ax.set_xticks(todos, [f"{MESES[t.month - 1]}/{str(t.year)[2:]}" for t in todos])
    e.titulo(fig, "O modelo prevê os meses que a SSP ainda não publicou",
             "Total da Região Metropolitana. Teste de 2026 previsto com 3 meses de atraso; a faixa é o erro médio do teste.")
    e.fonte(fig)
    return fig


def ganho_relatos(resultado: list[dict]):
    """`resultado`: lista de {adesao, ganho} (ganho = queda relativa do erro com os relatos)."""
    fig, ax = plt.subplots(figsize=(9, 3.4))
    rotulos = [f"{r['adesao']:.0%}".replace(".", ",") for r in resultado]
    valores = [r["ganho"] * 100 for r in resultado]
    ax.bar(rotulos, valores, color=e.PRIMARIA, width=0.55)
    for i, v in enumerate(valores):
        ax.text(i, v + 0.5, f"{v:.0f}%", ha="center", fontsize=10.5, color=e.TEXTO)
    ax.set_ylim(0, max(valores) * 1.25 + 1)
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.set_xlabel("Parte das vítimas que relata o roubo pelo app")
    e.titulo(fig, f"Com {resultado[-2]['adesao']:.0%} das vítimas relatando, o erro cai {resultado[-2]['ganho']:.0%}",
             "Queda do erro da previsão do mês quando os relatos do app entram na conta (simulação com os roubos reais de 2026).")
    return fig
