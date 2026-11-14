"""Os 129 lugares do app: 3 bairros da Av. Paulista, 88 distritos da capital e 38 municípios da região metropolitana.

Segue a mesma regra de `mobile/src/config/locais.ts`, para os códigos do modelo baterem com os do app.
"""

from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
CAMINHO_LOCAIS = RAIZ / "mobile" / "src" / "data" / "locais.json"

CODIGO_CAPITAL = 3550308
CENTRO_SE = (-23.5503, -46.6340)  # marco zero, Praça da Sé

# Copiados de mobile/src/config/regiao.ts.
BAIRROS_PAULISTA = {
    "bela_vista": ("Bela Vista", -23.5615, -46.6535),
    "cerqueira_cesar": ("Cerqueira César", -23.565, -46.664),
    "consolacao": ("Consolação", -23.5545, -46.66),
}
ESTACOES_PAULISTA = {
    "Consolação": (-23.5581, -46.6606),
    "Trianon-Masp": (-23.5613, -46.6563),
    "Brigadeiro": (-23.5675, -46.6501),
}

COLUNAS = ["codigo", "nome", "tipo", "latitude", "longitude", "cod_ibge"]


def carregar_lugares(caminho_locais: Path = CAMINHO_LOCAIS) -> pd.DataFrame:
    dados = pd.read_json(caminho_locais)
    nomes_paulista = {nome for nome, _, _ in BAIRROS_PAULISTA.values()}

    linhas = [
        {"codigo": c, "nome": n, "tipo": "bairro", "latitude": la, "longitude": lo, "cod_ibge": CODIGO_CAPITAL}
        for c, (n, la, lo) in BAIRROS_PAULISTA.items()
    ]
    for item in dados.itertuples():
        if item.tipo == "distrito" and item.nome not in nomes_paulista:
            cod_ibge = CODIGO_CAPITAL
        elif item.tipo == "municipio" and item.id != f"mun-{CODIGO_CAPITAL}":
            cod_ibge = int(item.id.split("-")[1])
        else:
            continue
        linhas.append(
            {
                "codigo": item.id.replace("-", "_"),
                "nome": item.nome,
                "tipo": item.tipo,
                "latitude": item.latitude,
                "longitude": item.longitude,
                "cod_ibge": cod_ibge,
            }
        )
    return pd.DataFrame(linhas, columns=COLUNAS)


def distancia_km(lat1, lng1, lat2, lng2):
    """Distância em km pela fórmula de haversine. Aceita números ou arrays."""
    lat1, lng1, lat2, lng2 = map(np.radians, (lat1, lng1, lat2, lng2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lng2 - lng1) / 2) ** 2
    return 6371.0 * 2 * np.arcsin(np.sqrt(a))


def lugar_mais_proximo(lat: np.ndarray, lng: np.ndarray, lugares_capital: pd.DataFrame) -> np.ndarray:
    """Código do centro de lugar mais próximo de cada ponto. Aproximação: não temos o contorno dos distritos."""
    lat = np.asarray(lat, dtype=float)[:, None]
    lng = np.asarray(lng, dtype=float)[:, None]
    d = distancia_km(lat, lng, lugares_capital.latitude.to_numpy()[None, :], lugares_capital.longitude.to_numpy()[None, :])
    return lugares_capital.codigo.to_numpy()[d.argmin(axis=1)]


def distancia_paulista_km(lat, lng):
    """Distância até a estação mais próxima das três da Av. Paulista."""
    return np.min([distancia_km(lat, lng, la, lo) for la, lo in ESTACOES_PAULISTA.values()], axis=0)
