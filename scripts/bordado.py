"""Texto bordado: transforma uma máscara de texto em ponto cheio (satin) com linha, relevo e sombra no tecido.

A máscara vem do próprio modelo HTML (mesma fonte, mesmo lugar), renderizada em escala maior. Cada letra é
preenchida por pontos paralelos inclinados, um a um, com pequenas irregularidades de linha de verdade:
comprimento, posição e brilho variam ponto a ponto. Por cima, um brilho no flanco voltado pra luz e uma
sombra no flanco oposto dão o volume do fio; embaixo, uma sombra suave assenta o bordado no linho.

bordar(base, camadas) -> PIL.Image
  base:    imagem RGB da peça sem o texto
  camadas: lista de (mascara L na escala ESCALA, cor da linha "#rrggbb")
"""
import math
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ESCALA = 3           # a máscara chega nesta escala; o desenho é feito nela e reduzido no fim
ANGULO = -58         # inclinação dos pontos, em graus (negativo = sobe pra direita)
ESPACO = 2.1         # distância entre pontos, em px finais
LUZ = (-0.6, -0.8)   # de onde vem a luz (cima, esquerda)


def _cor(hexa):
    return tuple(int(hexa[i:i + 2], 16) for i in (1, 3, 5))


def _mistura(c, alvo, t):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c, alvo))


def _pontos(mascara: np.ndarray, espaco: float, angulo: float, rng: random.Random):
    """Segmentos (x0, y0, x1, y1) dos pontos que cobrem a máscara, em px da escala da máscara."""
    alt, larg = mascara.shape
    th = math.radians(angulo)
    u = (math.cos(th), math.sin(th))          # ao longo do ponto
    n = (-math.sin(th), math.cos(th))         # através dos pontos
    diag = math.hypot(larg, alt)
    cx, cy = larg / 2, alt / 2
    passo = 1.0
    ts = np.arange(-diag / 2, diag / 2, passo)
    saida = []
    k = -diag / 2
    while k < diag / 2:
        ox, oy = cx + k * n[0], cy + k * n[1]
        xs = np.rint(ox + ts * u[0]).astype(int)
        ys = np.rint(oy + ts * u[1]).astype(int)
        dentro = (xs >= 0) & (xs < larg) & (ys >= 0) & (ys < alt)
        cheio = np.zeros(len(ts), bool)
        cheio[dentro] = mascara[ys[dentro], xs[dentro]]
        # trechos contínuos, tolerando buracos de até 2 px (o serrilhado da máscara)
        idx = np.flatnonzero(cheio)
        if idx.size:
            cortes = np.flatnonzero(np.diff(idx) > 3)
            inicios = np.concatenate(([idx[0]], idx[cortes + 1]))
            fins = np.concatenate((idx[cortes], [idx[-1]]))
            for a, b in zip(inicios, fins):
                if b - a < 2:
                    continue
                sobra = rng.uniform(0.6, 1.6) * ESCALA * 0.5       # o fio vira um pouco além da borda
                j = rng.gauss(0, 0.28) * ESCALA * 0.5              # pequeno desvio lateral
                t0, t1 = ts[a] - sobra, ts[b] + sobra
                saida.append((ox + t0 * u[0] + j * n[0], oy + t0 * u[1] + j * n[1],
                              ox + t1 * u[0] + j * n[0], oy + t1 * u[1] + j * n[1]))
        k += espaco * ESCALA * rng.uniform(0.94, 1.06)
    return saida, u, n


def _camada_fios(tamanho, segmentos, n, cor, rng: random.Random, espaco: float):
    """Desenha os pontos como fios com volume: flanco escuro, corpo e brilho."""
    larg, alt = tamanho
    camada = Image.new("RGBA", (larg, alt), (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    w = max(2, int(round(espaco * ESCALA * 1.25)))
    luz = LUZ[0] * -n[0] + LUZ[1] * -n[1]      # quanto o flanco -n encara a luz
    claro = _mistura(cor, (255, 246, 236), 0.22 + 0.14 * max(luz, 0))
    escuro = _mistura(cor, (0, 0, 0), 0.34)
    for (x0, y0, x1, y1) in segmentos:
        var = rng.uniform(-0.05, 0.05)         # cada ponto com o seu brilho
        corpo = _mistura(cor, (255, 255, 255) if var > 0 else (0, 0, 0), abs(var))
        dx, dy = n[0] * w * 0.3, n[1] * w * 0.3
        d.line([(x0 + dx, y0 + dy), (x1 + dx, y1 + dy)], fill=escuro + (255,), width=w)
        d.line([(x0, y0), (x1, y1)], fill=corpo + (255,), width=max(1, int(w * 0.86)))
        d.line([(x0 - dx, y0 - dy), (x1 - dx, y1 - dy)], fill=claro + (255,), width=max(1, int(w * 0.28)))
    return camada


def _fibra(camada: Image.Image, rng: random.Random):
    """Textura fina de fibra ao longo do fio, sem mexer no alfa."""
    larg, alt = camada.size
    semente = np.random.default_rng(rng.randrange(1 << 30))
    ruido = semente.normal(1.0, 0.045, (alt, larg)).astype(np.float32)
    rgba = np.asarray(camada).astype(np.float32)
    rgba[..., :3] = np.clip(rgba[..., :3] * ruido[..., None], 0, 255)
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def bordar(base: Image.Image, camadas, semente: int = 7) -> Image.Image:
    """camadas: (mascara, cor) ou (mascara, cor, opções) com 'engrossar' (px na escala) e 'espaco' (px finais)."""
    rng = random.Random(semente)
    larg, alt = base.size
    tam = (larg * ESCALA, alt * ESCALA)
    saida = base.convert("RGBA")
    for item in camadas:
        mascara_img, hexa = item[0], item[1]
        opcoes = item[2] if len(item) > 2 else {}
        if mascara_img.size != tam:
            mascara_img = mascara_img.resize(tam, Image.LANCZOS)
        mascara_img = mascara_img.convert("L")
        if opcoes.get("engrossar"):
            mascara_img = mascara_img.filter(ImageFilter.MaxFilter(opcoes["engrossar"] * 2 + 1))
        espaco = opcoes.get("espaco", ESPACO)
        mascara = np.asarray(mascara_img) > 110
        if not mascara.any():
            continue
        cor = _cor(hexa)
        segmentos, u, n = _pontos(mascara, espaco, ANGULO, rng)
        fios = _fibra(_camada_fios(tam, segmentos, n, cor, rng, espaco), rng)

        # sombra do relevo no tecido: a silhueta do bordado, deslocada com a luz, borrada
        alfa = fios.getchannel("A").filter(ImageFilter.MaxFilter(3))
        sombra_alfa = alfa.filter(ImageFilter.GaussianBlur(2.2 * ESCALA))
        sombra = Image.new("RGBA", tam, (40, 22, 18, 0))
        sombra.putalpha(sombra_alfa.point(lambda v: int(v * 0.42)))
        desloc = (int(-LUZ[0] * 1.6 * ESCALA), int(-LUZ[1] * 1.6 * ESCALA))
        sombra = ImageChops.offset(sombra, *desloc)

        # o tecido afunda um pouco rente ao bordado: escurecimento estreito em volta
        borda = ImageChops.subtract(alfa.filter(ImageFilter.MaxFilter(7)), alfa).filter(ImageFilter.GaussianBlur(1.2 * ESCALA))
        vinco = Image.new("RGBA", tam, (60, 40, 30, 0))
        vinco.putalpha(borda.point(lambda v: int(v * 0.22)))

        for camada in (sombra, vinco, fios):
            camada = camada.resize((larg, alt), Image.LANCZOS)
            if camada is fios:
                camada = camada.filter(ImageFilter.GaussianBlur(0.35))
            saida = Image.alpha_composite(saida, camada)
    return saida.convert("RGB")
