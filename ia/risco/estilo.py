"""Identidade visual das figuras: a paleta do app (mobile/src/theme/index.ts, tema claro).

Risco usa as cores de status do app e sempre vem com o nome do nível em texto (nunca só cor).
As cores foram conferidas com o validador da skill de visualização (separação para daltonismo).
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402
from matplotlib.transforms import offset_copy  # noqa: E402

PASTA_FIGURAS = Path(__file__).resolve().parents[1] / "figuras"

FUNDO = "#F6F8FA"
SUPERFICIE = "#FFFFFF"
TEXTO = "#16212C"
TEXTO_SUAVE = "#586878"
LINHA = "#D5DEE6"
PRIMARIA = "#1F6FC8"
PRIMARIA_SUAVE = "#DCEEFD"

COR_NIVEL = {"baixo": "#2E8B6A", "medio": "#D99A00", "alto": "#C73A2E"}
NOME_NIVEL = {"baixo": "Baixo", "medio": "Médio", "alto": "Alto"}
NOME_FAIXA = {"madrugada": "Madrugada (0–6h)", "manha": "Manhã (6–12h)", "tarde": "Tarde (12–18h)", "noite": "Noite (18–24h)"}
# Séries que não são risco: azul do app e magenta (par validado; não usa as cores de status)
COR_SERIE = {"celular": PRIMARIA, "veiculo": "#E87BA4"}

# Rampa sequencial de um tom só (azul do app), do claro ao escuro
RAMPA = LinearSegmentedColormap.from_list("moskitto", ["#EEF6FE", "#9CC9F5", PRIMARIA, "#0B3E73"])

FONTE_SSP = "Fonte: SSP-SP, bases Celulares e Veículos Subtraídos (2024–2026), roubos na Região Metropolitana de SP."


def aplicar() -> None:
    plt.rcParams.update(
        {
            "font.family": ["Noto Sans", "DejaVu Sans"],
            "font.size": 10.5,
            "figure.facecolor": SUPERFICIE,
            "axes.facecolor": SUPERFICIE,
            "axes.edgecolor": LINHA,
            "axes.labelcolor": TEXTO_SUAVE,
            "axes.titlecolor": TEXTO,
            "axes.titlesize": 13,
            "axes.titleweight": "bold",
            "axes.titlelocation": "left",
            "axes.titlepad": 12,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": False,
            "grid.color": LINHA,
            "grid.linewidth": 0.6,
            "xtick.color": TEXTO_SUAVE,
            "ytick.color": TEXTO_SUAVE,
            "xtick.major.size": 0,
            "ytick.major.size": 0,
            "legend.frameon": False,
            "legend.labelcolor": TEXTO,
            "savefig.facecolor": SUPERFICIE,
            "savefig.bbox": "tight",
            "savefig.pad_inches": 0.25,
        }
    )


def titulo(fig, texto: str, subtitulo: str | None = None) -> None:
    """Título que diz a conclusão. É posicionado em `salvar`, acima de tudo o que a figura desenhou."""
    fig._moskitto_titulo = (texto, subtitulo)


def fonte(fig, texto: str = FONTE_SSP) -> None:
    fig._moskitto_fonte = texto


def _posicionar_textos(fig) -> None:
    """Coloca título, subtítulo e fonte alinhados à esquerda do conteúdo, sem encostar em eixos e rótulos."""
    fig.canvas.draw()
    r = fig.canvas.get_renderer()
    caixas = [ax.get_tightbbox(r) for ax in fig.axes if ax.get_visible()]
    x0 = min(c.x0 for c in caixas) / fig.bbox.width
    topo = max(c.y1 for c in caixas) / fig.bbox.height
    base = min(c.y0 for c in caixas) / fig.bbox.height

    def em(y, pontos):
        return offset_copy(fig.transFigure, fig=fig, x=0, y=pontos, units="points"), y

    if hasattr(fig, "_moskitto_titulo"):
        texto, sub = fig._moskitto_titulo
        acima = 12
        if sub:
            t, y = em(topo, acima)
            fig.text(x0, y, sub, transform=t, ha="left", va="bottom", fontsize=10.5, color=TEXTO_SUAVE)
            acima += 20
        t, y = em(topo, acima)
        fig.text(x0, y, texto, transform=t, ha="left", va="bottom", fontsize=15, fontweight="bold", color=TEXTO)
        del fig._moskitto_titulo
    if hasattr(fig, "_moskitto_fonte"):
        t, y = em(base, -10)
        fig.text(x0, y, fig._moskitto_fonte, transform=t, ha="left", va="top", fontsize=8.5, color=TEXTO_SUAVE)
        del fig._moskitto_fonte


def salvar(fig, nome: str, pasta: Path = PASTA_FIGURAS) -> Path:
    pasta.mkdir(parents=True, exist_ok=True)
    _posicionar_textos(fig)
    caminho = pasta / f"{nome}.png"
    fig.savefig(caminho, dpi=200)
    return caminho
