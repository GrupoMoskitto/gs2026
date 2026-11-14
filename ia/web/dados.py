"""Junta os resultados de ia/data/ num só dicionário, que o site mostra.

Só lê arquivos já gerados (agregados, previsões e métricas). Não treina nada e não precisa das planilhas da SSP.
"""

import json
from pathlib import Path

import pandas as pd

PASTA_DADOS = Path(__file__).resolve().parents[1] / "data"
FAIXAS = ["madrugada", "manha", "tarde", "noite"]


def _json(pasta: Path, nome: str):
    return json.loads((pasta / nome).read_text(encoding="utf-8"))


def _json_opcional(pasta: Path, nome: str):
    return _json(pasta, nome) if (pasta / nome).exists() else None


HISTORICO_MESES = 12  # meses publicados que o site mostra antes da previsão


def _agora(mensal: dict | None) -> tuple[dict | None, dict]:
    """Previsão dos meses ainda não publicados: resumo para o site e, por célula, histórico curto e previsão."""
    if not mensal:
        return None, {}
    por_celula = {}
    for c in mensal["celulas"]:
        por_celula[(c["bairro"], c["faixa_horaria"])] = {
            "hist": c["historico"][-HISTORICO_MESES:],
            "prev": c["previsto"], "min": c["min"], "max": c["max"],
        }
    teste = mensal["teste"]
    regiao_futuro = [round(sum(c["previsto"][i] for c in mensal["celulas"])) for i in range(len(mensal["previstos"]))]
    resumo = {
        "meses": mensal["meses"][-HISTORICO_MESES:],
        "previstos": mensal["previstos"],
        "atraso": mensal["atraso_meses"],
        "erro_celula": {k: round(v, 4) for k, v in teste["erro"].items()},
        "erro_regiao": teste["erro_regiao"],
        "teste_regiao": [{k: (r[k] if k == "mes" else round(r[k])) for k in ("mes", "real", "modelo", "media_3m", "ultimo_publicado")}
                         for r in teste["regiao"]],
        "futuro_regiao": regiao_futuro,
        "relatos": [{"adesao": r["adesao"], "peso_dias": r["peso_dias"], "ganho": round(r["ganho"], 3)} for r in mensal["relatos"]],
    }
    return resumo, por_celula


def _perfil(perfil: dict | None) -> dict | None:
    if not perfil:
        return None
    chaves = ("total_bos", "cobertura", "levados", "levados_com_celular", "bos_com_celular", "conduta", "local", "conduta_por_faixa", "por_mes")
    return {"periodo": perfil["periodo"], "arquivos": perfil["arquivos"], **{k: perfil[k] for k in chaves}}


def montar(pasta: Path = PASTA_DADOS) -> dict:
    resumo = _json(pasta, "extracao_resumo.json")
    metricas = _json(pasta, "metricas.json")
    previsoes = _json(pasta, "previsoes.json")
    lugares = pd.read_csv(pasta / "lugares.csv")
    agregado = pd.read_csv(pasta / "roubos_agregados.csv", parse_dates=["data"])
    por_hora = pd.read_csv(pasta / "roubos_por_hora.csv")
    agora, mes_por_celula = _agora(_json_opcional(pasta, "previsao_mensal.json"))

    # roubos por dia de cada lugar e faixa nos 12 meses usados na previsão final
    inicio, fim = (pd.Timestamp(d) for d in metricas["janelas"]["final_x"])
    dias = (fim - inicio).days + 1
    recente = agregado[(agregado.data >= inicio) & (agregado.data <= fim)]
    soma_recente = recente.groupby(["bairro", "faixa_horaria"])[["roubos", "roubos_celular", "roubos_veiculo"]].sum() / dias
    taxa = soma_recente.roubos.to_dict()
    taxa_cel = soma_recente.roubos_celular.to_dict()
    taxa_vei = soma_recente.roubos_veiculo.to_dict()
    total_lugar = agregado.groupby("bairro").roubos.sum().to_dict()

    prev = {(p["bairro"], p["faixa_horaria"]): p for p in previsoes}
    lista = []
    for l in lugares.itertuples():
        lista.append(
            {
                "codigo": l.codigo,
                "nome": l.nome,
                "tipo": l.tipo,
                "lat": float(l.latitude),
                "lng": float(l.longitude),
                "roubos": int(total_lugar.get(l.codigo, 0)),
                "mes": {f: mes_por_celula[(l.codigo, f)] for f in FAIXAS} if mes_por_celula else None,
                "faixas": {
                    f: {
                        "nivel": prev[(l.codigo, f)]["nivel_risco"],
                        "score": prev[(l.codigo, f)]["score"],
                        "taxa": round(float(taxa.get((l.codigo, f), 0.0)), 3),
                        # um BO com celular e veículo conta nos dois tipos
                        "taxa_celular": round(float(taxa_cel.get((l.codigo, f), 0.0)), 3),
                        "taxa_veiculo": round(float(taxa_vei.get((l.codigo, f), 0.0)), 3),
                    }
                    for f in FAIXAS
                },
            }
        )

    grade = (
        por_hora.pivot_table(index="dia_semana", columns="hora", values="roubos", aggfunc="sum")
        .reindex(index=range(7), columns=range(24), fill_value=0)
        .astype(int)
    )
    hora_total = grade.sum(axis=0)

    mensal = (
        agregado.assign(mes=agregado.data.dt.strftime("%Y-%m"))
        .groupby("mes")[["roubos_celular", "roubos_veiculo"]]
        .sum()
        .reset_index()
    )

    perfil = _perfil(_json_opcional(pasta, "perfil_roubos.json"))
    outros = {m["mes"]: m["outros_objetos"] for m in perfil["por_mes"]} if perfil else {}

    teste = metricas["teste"]
    return {
        "numeros": {
            "roubos": int(resumo["roubos_contados"]),
            "linhas_lidas": int(resumo["linhas_lidas"]),
            "lugares": len(lugares),
            "periodo": resumo["periodo"],
            "pico_hora": int(hora_total.idxmax()),
            "parte_noite": round(float(hora_total.iloc[18:].sum() / hora_total.sum()), 3),
            "acuracia": round(teste["modelo"]["acuracia"], 3),
            "f1": round(teste["modelo"]["f1_macro"], 3),
        },
        "funil": [
            {"etapa": "Linhas lidas nas 6 bases", "valor": int(resumo["linhas_lidas"])},
            {"etapa": "BOs de roubo, sem repetição", "valor": int(resumo["bos_roubo"])},
            {"etapa": "Na Região Metropolitana", "valor": int(resumo["bos_roubo"] - resumo["fora_da_rmsp"])},
            {"etapa": "No período, com hora e local", "valor": int(resumo["roubos_contados"])},
        ],
        "lugares": lista,
        "agora": agora,
        "perfil": perfil,
        "horas": grade.values.tolist(),
        "mensal": [
            {"mes": r.mes, "celular": int(r.roubos_celular), "veiculo": int(r.roubos_veiculo),
             **({"outros": int(outros.get(r.mes, 0))} if outros else {})}
            for r in mensal.itertuples()
        ],
        "modelo": {
            "comparacao": [
                {"nome": "RandomForest (nosso)", "chave": "modelo", **_m(teste["modelo"])},
                {"nome": "Repetir o nível do ano anterior", "chave": "nivel_anterior", **_m(teste["nivel_anterior"])},
                {"nome": "Sempre a classe mais comum", "chave": "classe_mais_comum", **_m(teste["classe_mais_comum"])},
            ],
            "matriz": teste["modelo"]["matriz"],
            "limites": {k: round(v, 3) for k, v in metricas["limites_taxa"].items()},
            "janelas": metricas["janelas"],
        },
    }


def _m(m: dict) -> dict:
    return {"acuracia": round(m["acuracia"], 3), "f1": round(m["f1_macro"], 3)}
