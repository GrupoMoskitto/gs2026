import numpy as np

from risco.lugares import CAMINHO_LOCAIS, CENTRO_SE, carregar_lugares, distancia_km, lugar_mais_proximo


def test_129_lugares_com_tipos():
    df = carregar_lugares(CAMINHO_LOCAIS)
    assert len(df) == 129
    assert df.tipo.value_counts().to_dict() == {"distrito": 88, "municipio": 38, "bairro": 3}


def test_codigos_seguem_o_app():
    codigos = set(carregar_lugares(CAMINHO_LOCAIS).codigo)
    assert {"bela_vista", "cerqueira_cesar", "consolacao", "dis_355030802", "mun_3518800"} <= codigos
    assert "mun_3550308" not in codigos
    assert not any("-" in c for c in codigos)


def test_sem_distrito_bela_vista_duplicado():
    df = carregar_lugares(CAMINHO_LOCAIS)
    assert (df.nome == "Bela Vista").sum() == 1
    assert (df.nome == "Consolação").sum() == 1


def test_cod_ibge_do_municipio():
    df = carregar_lugares(CAMINHO_LOCAIS).set_index("codigo")
    assert df.loc["bela_vista", "cod_ibge"] == 3550308
    assert df.loc["dis_355030802", "cod_ibge"] == 3550308
    assert df.loc["mun_3518800", "cod_ibge"] == 3518800


def test_mais_proximo():
    df = carregar_lugares(CAMINHO_LOCAIS)
    capital = df[df.cod_ibge == 3550308]
    assert lugar_mais_proximo(np.array([-23.5615]), np.array([-46.6535]), capital)[0] == "bela_vista"


def test_distancia_se_paulista():
    assert 1.5 < distancia_km(*CENTRO_SE, -23.5613, -46.6563) < 3.5
