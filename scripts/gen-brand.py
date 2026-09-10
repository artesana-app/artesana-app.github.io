"""Gera os assets de marca do artesaná. a partir dos glifos Poppins extraídos do logo.

Entrada:  scripts/fonts/Poppins-Regular.ttf (glifos a r t e s n á) e Poppins-Bold.ttf (glifo .)
Saída:    assets/brand/wordmark.svg, wordmark-cream.svg, icon-192.png, icon-512.png, icon-maskable-512.png

Uso: python scripts/gen-brand.py
"""
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "scripts" / "fonts"
SAIDA = RAIZ / "assets" / "brand"

PEACH = "#FFB18B"
CREAM = "#FFF5EF"
TRACKING_EM = -0.04  # letras juntinhas


def glifo_por_char(font: TTFont, ch: str) -> str:
    cmap = font.getBestCmap()
    if ord(ch) in cmap:
        return cmap[ord(ch)]
    # subset do PDF mapeia o "á" num codepoint fora do ASCII
    candidatos = [g for cp, g in cmap.items() if cp > 127]
    if ch == "á" and candidatos:
        return candidatos[0]
    raise KeyError(f"glifo para {ch!r} não encontrado; cmap={cmap}")


def wordmark_svg(cor: str) -> str:
    reg = TTFont(FONTES / "Poppins-Regular.ttf")
    bold = TTFont(FONTES / "Poppins-Bold.ttf")
    upm = reg["head"].unitsPerEm
    tracking = TRACKING_EM * upm

    partes = [(reg, ch) for ch in "artesaná"] + [(bold, ".")]
    x = 0.0
    paths = []
    bounds = None
    for font, ch in partes:
        nome = glifo_por_char(font, ch)
        gs = font.getGlyphSet()
        pen = SVGPathPen(gs)
        gs[nome].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        limites = BoundsPen(gs)
        gs[nome].draw(TransformPen(limites, (1, 0, 0, -1, x, 0)))
        if limites.bounds:
            b = limites.bounds
            bounds = b if bounds is None else (min(bounds[0], b[0]), min(bounds[1], b[1]), max(bounds[2], b[2]), max(bounds[3], b[3]))
        d = pen.getCommands()
        if d:
            paths.append(d)
        x += font["hmtx"][nome][0] + tracking

    xmin, ymin, xmax, ymax = bounds
    pad = upm * 0.06
    vb = (xmin - pad, ymin - pad, (xmax - xmin) + 2 * pad, (ymax - ymin) + 2 * pad)
    d_total = " ".join(paths)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" '
        f'role="img" aria-label="artesaná.">\n'
        f'  <path fill="{cor}" d="{d_total}"/>\n</svg>\n'
    )


def icone(tamanho: int, margem_extra: float = 0.0) -> Image.Image:
    """Quadrado pêssego com "a." creme centralizado. margem_extra encolhe a arte (maskable)."""
    img = Image.new("RGB", (tamanho, tamanho), PEACH)
    draw = ImageDraw.Draw(img)
    escala = 0.72 * (1 - margem_extra)
    px = int(tamanho * escala)
    f_reg = ImageFont.truetype(str(FONTES / "Poppins-Regular.ttf"), px)
    f_bold = ImageFont.truetype(str(FONTES / "Poppins-Bold.ttf"), px)

    # mede cada parte (bbox relativo à origem de desenho)
    ba = draw.textbbox((0, 0), "a", font=f_reg)
    bp = draw.textbbox((0, 0), ".", font=f_bold)
    tracking = int(px * TRACKING_EM)
    largura = (ba[2] - ba[0]) + tracking + (bp[2] - bp[0])
    # alinha pela linha de base: usa a altura do "a" como referência vertical
    altura = ba[3] - ba[1]
    x0 = (tamanho - largura) // 2 - ba[0]
    y0 = (tamanho - altura) // 2 - ba[1]
    draw.text((x0, y0), "a", font=f_reg, fill=CREAM)
    # o ponto fica na mesma baseline: baseline = y0 + ascent
    xp = x0 + (ba[2] - ba[0]) + tracking - bp[0]
    asc_a = f_reg.getmetrics()[0]
    asc_p = f_bold.getmetrics()[0]
    yp = y0 + (asc_a - asc_p)
    draw.text((xp, yp), ".", font=f_bold, fill=CREAM)
    return img


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / "wordmark.svg").write_text(wordmark_svg(PEACH), encoding="utf-8")
    (SAIDA / "wordmark-cream.svg").write_text(wordmark_svg(CREAM), encoding="utf-8")
    icone(512).save(SAIDA / "icon-512.png")
    icone(512).resize((192, 192), Image.LANCZOS).save(SAIDA / "icon-192.png")
    icone(512, margem_extra=0.22).save(SAIDA / "icon-maskable-512.png")
    icone(512).resize((180, 180), Image.LANCZOS).save(SAIDA / "apple-touch-icon.png")
    for f in sorted(SAIDA.iterdir()):
        print(f"{f.name:28} {f.stat().st_size:>8} bytes")


if __name__ == "__main__":
    main()
