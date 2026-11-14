"""Monta xlsx mínimos para os testes, no mesmo formato das bases da SSP-SP (3 abas, a de dados por último)."""

import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

_TIPOS = """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
</Types>"""


def _coluna(i: int) -> str:
    nome = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        nome = chr(65 + r) + nome
    return nome


def _folha(linhas: list[list], compartilhadas: list[str]) -> str:
    corpo = []
    for n, linha in enumerate(linhas, start=1):
        celulas = []
        for i, v in enumerate(linha):
            ref = f"{_coluna(i)}{n}"
            if v is None:
                continue
            if isinstance(v, (int, float)):
                celulas.append(f'<c r="{ref}"><v>{v}</v></c>')
            else:
                compartilhadas.append(str(v))
                celulas.append(f'<c r="{ref}" t="s"><v>{len(compartilhadas) - 1}</v></c>')
        corpo.append(f'<row r="{n}">{"".join(celulas)}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(corpo)}</sheetData></worksheet>'
    )


def criar(
    caminho: Path, cabecalho: list[str], linhas: list[list], aba: str = "CELULAR_2026", dicionario: str = "DICIONARIO DE DADOS",
    outras_abas: list[tuple[str, list[str], list[list]]] = (),
) -> Path:
    compartilhadas: list[str] = []
    folhas = [
        _folha([["Metodologia de teste"]], compartilhadas),
        _folha([["Campos", "Descrição"]], compartilhadas),
        _folha([cabecalho, *linhas], compartilhadas),
        *(_folha([cab, *lin], compartilhadas) for _, cab, lin in outras_abas),
    ]
    nomes = ["METODOLOGIA", dicionario, aba, *(nome for nome, _, _ in outras_abas)]
    # ids fora de ordem de propósito, como nos arquivos reais (rId3 aponta para sheet3)
    workbook = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        + "".join(f'<sheet name="{escape(n)}" sheetId="{i + 1}" r:id="rId{i + 1}"/>' for i, n in enumerate(nomes))
        + "</sheets></workbook>"
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId9" Type="sharedStrings" Target="sharedStrings.xml"/>'
        + "".join(
            f'<Relationship Id="rId{i + 1}" Type="worksheet" Target="worksheets/sheet{i + 1}.xml"/>' for i in range(len(nomes))
        )
        + "</Relationships>"
    )
    strings = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + "".join(f"<si><t>{escape(s)}</t></si>" for s in compartilhadas)
        + "</sst>"
    )
    with zipfile.ZipFile(caminho, "w") as z:
        z.writestr("[Content_Types].xml", _TIPOS)
        z.writestr("xl/workbook.xml", workbook)
        z.writestr("xl/_rels/workbook.xml.rels", rels)
        z.writestr("xl/sharedStrings.xml", strings)
        for i, f in enumerate(folhas):
            z.writestr(f"xl/worksheets/sheet{i + 1}.xml", f)
    return caminho
