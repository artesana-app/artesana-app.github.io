"""Põe o texto de um rótulo numa etiqueta em branco de uma foto, respeitando a perspectiva e a luz da cena.

A etiqueta é a região clara ligada ao ponto informado (mesma ideia da tela do celular em gen-instagram.py).
O texto é desenhado com as fontes da marca sobre branco e misturado por multiplicação: fica só a tinta,
e as dobras, sombras e o brilho do papel continuam os da foto.

rotular(origem, destino, ponto, limiar, linhas) -> None
  linhas: [(texto, fonte, tamanho relativo à largura da etiqueta, cor)]
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "scripts" / "fonts"


def _fonte(nome, px):
    try:
        return ImageFont.truetype(str(FONTES / nome), px)
    except OSError:
        return ImageFont.truetype("arial.ttf", px)


def _coeficientes(quad, tamanho):
    w, h = tamanho
    origem = [(0, 0), (w, 0), (w, h), (0, h)]
    a, b = [], []
    for (x, y), (u, v) in zip(quad, origem):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    return np.linalg.solve(np.array(a, float), np.array(b, float))


def _quad_da_regiao(mascara: np.ndarray):
    """Os quatro cantos da etiqueta: os pontos da região mais próximos de cada canto da caixa."""
    ys, xs = np.nonzero(mascara)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    cantos = []
    for cx, cy in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)):
        d = (xs - cx) ** 2 + (ys - cy) ** 2
        k = d.argmin()
        cantos.append((int(xs[k]), int(ys[k])))
    return cantos


def rotular(origem: Path, destino: Path, ponto, limiar, linhas, encolher=0.08) -> dict:
    src = Image.open(origem).convert("RGB")
    larg, alt = src.size
    rgb = np.asarray(src).astype(np.float32)
    claro = Image.fromarray(((rgb.min(axis=2) > limiar) * 255).astype(np.uint8))
    peq = claro.resize((larg // 2, alt // 2), Image.BOX).point(lambda v: 255 if v > 200 else 0)
    px, py = ponto[0] // 2, ponto[1] // 2
    assert peq.getpixel((px, py)) == 255, f"o ponto {ponto} não está na etiqueta clara"
    ImageDraw.floodfill(peq, (px, py), 128)
    so = peq.point(lambda v: 255 if v == 128 else 0)
    cobertura = np.asarray(so).mean() / 255 * 100
    assert cobertura < 25, f"a região clara tomou {cobertura:.0f}% da foto: vazou pra fora da etiqueta"
    mascara = np.asarray(so.resize((larg, alt), Image.BILINEAR)) > 127
    quad = _quad_da_regiao(mascara)

    # encolhe o quadrilátero um pouco pra dentro: o texto não encosta na borda da etiqueta
    cx = sum(p[0] for p in quad) / 4; cy = sum(p[1] for p in quad) / 4
    quad = [(cx + (x - cx) * (1 - encolher), cy + (y - cy) * (1 - encolher)) for x, y in quad]
    lw = int(max(np.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]), np.hypot(quad[2][0] - quad[3][0], quad[2][1] - quad[3][1])))
    lh = int(max(np.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]), np.hypot(quad[2][0] - quad[1][0], quad[2][1] - quad[1][1])))
    esc = 3
    etiqueta = Image.new("RGB", (lw * esc, lh * esc), "white")
    d = ImageDraw.Draw(etiqueta)
    # linhas centradas, empilhadas a partir de 30% da altura
    y = lh * esc * 0.30
    for texto, fonte, rel, cor in linhas:
        f = _fonte(fonte, int(lw * esc * rel))
        caixa = d.textbbox((0, 0), texto, font=f)
        tw, th = caixa[2] - caixa[0], caixa[3] - caixa[1]
        d.text(((lw * esc - tw) / 2 - caixa[0], y - caixa[1]), texto, font=f, fill=cor)
        y += th * 1.35
    etiqueta = etiqueta.resize((lw, lh), Image.LANCZOS)

    posto = etiqueta.transform((larg, alt), Image.PERSPECTIVE, _coeficientes(quad, etiqueta.size), Image.BICUBIC, fillcolor="white")
    tinta = np.asarray(posto).astype(np.float32) / 255.0  # 1 onde é branco, menor onde tem texto
    alfa = np.asarray(Image.fromarray((mascara * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255.0
    # multiplicação só dentro da etiqueta: a foto escurece onde há tinta, mantendo dobras e luz
    saida = rgb * (1 - alfa[..., None]) + rgb * tinta * alfa[..., None]
    Image.fromarray(np.clip(saida, 0, 255).astype(np.uint8)).save(destino, quality=94)
    return {"quad": [(int(x), int(y)) for x, y in quad], "cobertura": round(cobertura, 1)}
