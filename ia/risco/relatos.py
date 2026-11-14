"""Relatos simulados no formato do contrato (AGENTS.md, seção 4), para a API carregar.

Os relatos são inventados (descrição, status e origem não existem nos BOs), mas o lugar, o dia da semana e a faixa
horária são sorteados na proporção dos roubos reais da SSP-SP. Assim o mapa do app parece com a realidade.
"""

import uuid
from datetime import date

import numpy as np
import pandas as pd

from risco.lugares import ESTACOES_PAULISTA

COLUNAS_RELATO = ["id", "tipo", "descricao", "latitude", "longitude", "bairro", "ocorrido_em", "status", "origem"]
CAIXA = (-24.1, -23.15, -47.1, -45.75)
INICIO_FAIXA = {"madrugada": 0, "manha": 6, "tarde": 12, "noite": 18}

# Tipos que não existem nas bases da SSP (celular e veículo vêm da proporção real de cada lugar e faixa).
PARTE_OUTROS = 0.2
OUTROS = {"bolsa_mochila": 0.4, "comercio": 0.25, "bicicleta": 0.2, "outro": 0.15}
STATUS = {"aprovado": 0.75, "pendente": 0.18, "rejeitado": 0.07}
ORIGEM = {"mobile": 0.8, "desktop": 0.1, "iot": 0.1}
PARTE_SEM_DESCRICAO = 0.3

# Frases genéricas: nunca nomes, documentos ou placas.
DESCRICOES = {
    "celular": [
        "Levaram meu celular no ponto de ônibus",
        "Celular arrancado da mão na calçada",
        "Dois em uma moto levaram o celular",
        "Roubo de celular na saída do metrô",
        "Pegaram o celular enquanto eu esperava o semáforo",
        "Abordagem na esquina, levaram o celular",
    ],
    "veiculo": [
        "Carro levado na rua lateral",
        "Abordagem no semáforo, levaram o carro",
        "Moto roubada em frente ao comércio",
        "Levaram o carro na saída da garagem",
    ],
    "bolsa_mochila": [
        "Mochila puxada na plataforma",
        "Levaram a bolsa no ponto de ônibus",
        "Bolsa arrancada na calçada",
    ],
    "bicicleta": ["Bicicleta levada na ciclofaixa", "Bike roubada no bicicletário", "Levaram a bicicleta no parque"],
    "comercio": ["Assalto em loja perto da avenida", "Roubo no caixa da padaria", "Assalto a farmácia no fim da tarde"],
    "outro": ["Levaram a carteira na saída do bar", "Relógio roubado na rua", "Roubo de fone na praça"],
}


def _escolha(rng: np.random.Generator, pesos: dict[str, float], n: int) -> np.ndarray:
    chaves = list(pesos)
    p = np.array([pesos[k] for k in chaves], dtype=float)
    return np.array(chaves)[rng.choice(len(chaves), size=n, p=p / p.sum())]


def gerar_relatos(
    agregado: pd.DataFrame,
    lugares: pd.DataFrame,
    n: int = 10_000,
    semente: int = 42,
    inicio: date = date(2026, 5, 1),
    fim: date = date(2026, 10, 31),
    bairros: list[str] | None = None,
) -> pd.DataFrame:
    rng = np.random.default_rng(semente)
    ag = agregado if bairros is None else agregado[agregado.bairro.isin(bairros)]
    ag = ag.assign(dia_semana=pd.to_datetime(ag.data).dt.day_of_week)
    celulas = ag.groupby(["bairro", "faixa_horaria", "dia_semana"], as_index=False)[
        ["roubos", "roubos_celular", "roubos_veiculo"]
    ].sum()
    celulas = celulas[celulas.roubos > 0].reset_index(drop=True)

    sorteio = rng.choice(len(celulas), size=n, p=(celulas.roubos / celulas.roubos.sum()).to_numpy())
    c = celulas.iloc[sorteio].reset_index(drop=True)

    # dia: um dia do período com o mesmo dia da semana
    dias = pd.date_range(inicio, fim)
    por_semana = {d: dias[dias.day_of_week == d] for d in range(7)}
    data = [por_semana[d][rng.integers(len(por_semana[d]))].date() for d in c.dia_semana]
    hora = c.faixa_horaria.map(INICIO_FAIXA).to_numpy() + rng.integers(0, 6, n)
    minuto = rng.integers(0, 60, n)
    ocorrido = [f"{d.isoformat()}T{h:02d}:{m:02d}:00-03:00" for d, h, m in zip(data, hora, minuto)]

    # tipo: celular ou veículo na proporção real da célula; uma parte vira os tipos que a SSP não cobre
    p_celular = (c.roubos_celular / (c.roubos_celular + c.roubos_veiculo).replace(0, 1)).to_numpy()
    tipo = np.where(rng.random(n) < p_celular, "celular", "veiculo").astype(object)
    outros = rng.random(n) < PARTE_OUTROS
    tipo[outros] = _escolha(rng, OUTROS, int(outros.sum()))

    descricao = [DESCRICOES[t][rng.integers(len(DESCRICOES[t]))] for t in tipo]
    descricao = [None if v else d for d, v in zip(descricao, rng.random(n) < PARTE_SEM_DESCRICAO)]

    # local: centro do lugar + deslocamento (maior nos municípios); na Paulista, parte perto das estações
    centro = lugares.set_index("codigo").loc[c.bairro]
    espalhar = np.where(centro.tipo.to_numpy() == "municipio", 0.03, 0.008)
    lat = centro.latitude.to_numpy() + rng.uniform(-1, 1, n) * espalhar
    lng = centro.longitude.to_numpy() + rng.uniform(-1, 1, n) * espalhar
    estacoes = np.array(list(ESTACOES_PAULISTA.values()))
    perto = (centro.tipo.to_numpy() == "bairro") & (rng.random(n) < 0.6)
    qual = rng.integers(len(estacoes), size=n)
    lat = np.where(perto, estacoes[qual, 0] + rng.uniform(-0.002, 0.002, n), lat)
    lng = np.where(perto, estacoes[qual, 1] + rng.uniform(-0.002, 0.002, n), lng)
    lat = np.clip(lat, CAIXA[0], CAIXA[1]).round(3)
    lng = np.clip(lng, CAIXA[2], CAIXA[3]).round(3)

    ids = [str(uuid.UUID(bytes=rng.bytes(16), version=4)) for _ in range(n)]

    df = pd.DataFrame(
        {
            "id": ids,
            "tipo": tipo.astype(str),
            "descricao": descricao,
            "latitude": lat,
            "longitude": lng,
            "bairro": c.bairro.to_numpy(),
            "ocorrido_em": ocorrido,
            "status": _escolha(rng, STATUS, n),
            "origem": _escolha(rng, ORIGEM, n),
        },
        columns=COLUNAS_RELATO,
    )
    return df.sort_values("ocorrido_em", ascending=False, ignore_index=True)


