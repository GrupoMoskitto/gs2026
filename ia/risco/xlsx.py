"""Leitura em fluxo das planilhas da SSP-SP (100 MB de xlsx, ~560 MB de XML por base).

Um xlsx é um ZIP com XML dentro. Aqui o XML é lido aos pedaços com o expat da biblioteca padrão, guardando só as
colunas pedidas, então a memória fica pequena e não precisa de openpyxl.
"""

import re
import unicodedata
import zipfile
from collections.abc import Iterator
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.parsers import expat

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ABAS_DE_DOCUMENTACAO = ("METODOLOGIA", "DICIONARIO")  # 2024 escreve "DICIONÁRIO", com acento
_LETRAS = re.compile(r"[A-Z]+")


def _indice_coluna(ref: str) -> int:
    n = 0
    for ch in _LETRAS.match(ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def _abas_de_dados(z: zipfile.ZipFile) -> list[str]:
    """Todas as abas que não são documentação (a base de objetos vem dividida em uma aba por trimestre)."""
    workbook = z.read("xl/workbook.xml").decode("utf-8")
    rels = z.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    alvos = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
    abas = []
    for nome, rid in re.findall(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', workbook):
        sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().upper()
        if not sem_acento.startswith(ABAS_DE_DOCUMENTACAO):
            abas.append("xl/" + alvos[rid].lstrip("/").removeprefix("xl/"))
    if not abas:
        raise ValueError("planilha sem aba de dados")
    return abas


def _strings_compartilhadas(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    saida = []
    for _, el in ET.iterparse(z.open("xl/sharedStrings.xml")):
        if el.tag == NS + "si":
            saida.append("".join(t.text or "" for t in el.iter(NS + "t")))
            el.clear()
    return saida


def ler_linhas(caminho: Path, colunas: list[str], apelidos: dict[str, list[str]] | None = None) -> Iterator[dict[str, str]]:
    """Devolve cada linha das abas de dados como {coluna: texto}, só com as colunas pedidas. Célula vazia vira "".

    `apelidos` dá outros nomes aceitos para uma coluna (ex.: "COD IBGE" se chama "CD_IBGE" em 2024 e 2025).
    Cada aba tem o próprio cabeçalho.
    """
    with zipfile.ZipFile(caminho) as z:
        strings = _strings_compartilhadas(z)
        for folha in _abas_de_dados(z):
            yield from _ler_aba(z, folha, strings, caminho.name, colunas, apelidos or {})


def _ler_aba(z: zipfile.ZipFile, folha: str, strings: list[str], arquivo: str, colunas: list[str],
             apelidos: dict[str, list[str]]) -> Iterator[dict[str, str]]:
    prontas: list[list[str]] = []
    estado = {"linha": None, "col": -1, "tipo": None, "texto": [], "lendo": False}
    indices: dict[int, int] = {}  # índice da coluna no xlsx -> posição em `colunas`
    cabecalho: dict[int, str] = {}
    primeira = [True]

    def inicio(tag, attrs):
        if tag == "row":
            estado["linha"] = {}
        elif tag == "c":
            estado["col"] = _indice_coluna(attrs["r"])
            estado["tipo"] = attrs.get("t")
            estado["texto"] = []
        elif tag in ("v", "t") and (primeira[0] or estado["col"] in indices):
            estado["lendo"] = True

    def texto(dados):
        if estado["lendo"]:
            estado["texto"].append(dados)

    def fim(tag):
        if tag in ("v", "t"):
            estado["lendo"] = False
        elif tag == "c":
            col = estado["col"]
            if primeira[0] or col in indices:
                valor = "".join(estado["texto"])
                if estado["tipo"] == "s" and valor:
                    valor = strings[int(valor)]
                estado["linha"][col] = valor
        elif tag == "row":
            linha = estado["linha"]
            if primeira[0]:
                cabecalho.update(linha)
                posicao = {nome: i for i, nome in cabecalho.items()}
                for c in colunas:
                    for alt in apelidos.get(c, []):
                        if c not in posicao and alt in posicao:
                            posicao[c] = posicao[alt]
                faltando = [c for c in colunas if c not in posicao]
                if faltando:
                    raise KeyError(f"colunas ausentes em {arquivo}: {', '.join(faltando)}")
                indices.update({posicao[c]: k for k, c in enumerate(colunas)})
                primeira[0] = False
            else:
                valores = [""] * len(colunas)
                for col, v in linha.items():
                    valores[indices[col]] = v
                prontas.append(valores)

    p = expat.ParserCreate()
    p.buffer_text = True
    p.StartElementHandler = inicio
    p.CharacterDataHandler = texto
    p.EndElementHandler = fim

    with z.open(folha) as f:
        while bloco := f.read(1 << 20):
            p.Parse(bloco, False)
            for valores in prontas:
                yield dict(zip(colunas, valores))
            prontas.clear()
        p.Parse(b"", True)
        for valores in prontas:
            yield dict(zip(colunas, valores))
