"""Tira as duas mãos da foto do bordado sem IA.
Fora do aro: a luz da foto (passa-baixa, com a mão tapada antes de borrar e refeita por difusão) mais a textura do
linho liso copiada de outra parte da foto. No aro e rente a ele: o lado oposto espelhado (o bastidor é simétrico).
Aro medido pelos pixels de madeira: x 23..973 em y=720, fundo y=1214.
Entrada: ia/bordado-com-maos.jpg (gerada por IA). Saída: ia/bordado.jpg, usada na peça atelie-3."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
S = RAIZ / "marketing" / "instagram" / "ia"
src = Image.open(RAIZ / "marketing/instagram/ia/bordado-com-maos.jpg").convert("RGB")
W, H = src.size
CX, CY = 498, 735
R_EXT, R_INT = 478, 445
yy, xx = np.mgrid[0:H, 0:W]
raio = np.hypot(xx - CX, yy - CY)

img = src.copy()
TEXTURA = src.crop((560, 0, 830, 200))  # linho liso, à direita do fecho
SIGMA = 18
tex = np.asarray(TEXTURA).astype(np.float32)
tex_detalhe = tex - np.asarray(TEXTURA.filter(ImageFilter.GaussianBlur(SIGMA))).astype(np.float32)


def pena_mascara(tam, pena, caixa):
    m = Image.new("L", tam, 0)
    ImageDraw.Draw(m).rectangle((pena, pena, tam[0] - pena, tam[1] - pena), fill=255)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(pena / 1.6))).astype(np.float32) / 255
    x0, y0, x1, y1 = caixa  # nas bordas da foto não precisa de pena
    if x1 >= W: m[:, -pena * 2:] = m[:, -pena * 2 - 1:-pena * 2]
    if y0 <= 0: m[:pena * 2, :] = m[pena * 2:pena * 2 + 1, :]
    if x0 <= 0: m[:, :pena * 2] = m[:, pena * 2:pena * 2 + 1]
    return m


def misturar(base, caixa, novo, alfa):
    x0, y0, x1, y1 = caixa
    reg = np.asarray(base.crop(caixa)).astype(np.float32)
    base.paste(Image.fromarray(np.clip(reg * (1 - alfa[..., None]) + novo * alfa[..., None], 0, 255).astype(np.uint8)), (x0, y0))


def luz_preenchida(caixa, buraco):
    """Luz (passa-baixa) da região com o buraco (onde estava a mão) refeito por difusão a partir do linho conhecido.
    A mão é tapada com a cor média do linho ANTES de borrar, senão a pele clara vaza pra volta."""
    x0, y0, x1, y1 = caixa
    bx0, by0, bx1, by1 = buraco
    reg = np.asarray(src.crop(caixa)).astype(np.float32)
    r = raio[y0:y1, x0:x1]
    conhecido = r > R_EXT + 12
    conhecido[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0] = False
    tapado = reg.copy()
    tapado[~conhecido] = reg[conhecido].mean(axis=0)
    luz = np.asarray(Image.fromarray(tapado.astype(np.uint8)).filter(ImageFilter.GaussianBlur(SIGMA))).astype(np.float32)
    esc = 8
    peq = np.asarray(Image.fromarray(luz.astype(np.uint8)).resize(((x1 - x0) // esc, (y1 - y0) // esc), Image.BOX)).astype(np.float32)
    fixo = np.asarray(Image.fromarray((conhecido * 255).astype(np.uint8)).resize(peq.shape[1::-1], Image.BOX)) > 250
    val = peq.copy()
    for _ in range(4000):
        med = (np.roll(val, 1, 0) + np.roll(val, -1, 0) + np.roll(val, 1, 1) + np.roll(val, -1, 1)) / 4
        val[~fixo] = med[~fixo]
    return np.asarray(Image.fromarray(np.clip(val, 0, 255).astype(np.uint8)).resize((x1 - x0, y1 - y0), Image.BICUBIC)).astype(np.float32)


def cobrir_linho(base, caixa, buraco, pena=22):
    """Cobre a caixa (só fora do aro) com a luz preenchida mais a textura do linho, em ladrilhos virados."""
    x0, y0, x1, y1 = caixa
    canvas = np.zeros((y1 - y0, x1 - x0, 3), np.float32)
    th, tw = tex_detalhe.shape[:2]
    k = 0
    for ty in range(0, y1 - y0, th - 30):
        for tx in range(0, x1 - x0, tw - 30):
            t = tex_detalhe
            if k % 2: t = t[:, ::-1]
            if (k // 2) % 2: t = t[::-1]
            h_ = min(th, y1 - y0 - ty); w_ = min(tw, x1 - x0 - tx)
            canvas[ty:ty + h_, tx:tx + w_] = t[:h_, :w_]
            k += 1
    novo = luz_preenchida(caixa, buraco) + canvas
    fora = (raio[y0:y1, x0:x1] > R_EXT).astype(np.float32)
    fora = np.asarray(Image.fromarray((fora * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    misturar(base, caixa, novo, pena_mascara((x1 - x0, y1 - y0), pena, caixa) * fora)


def espelhar(base, caixa, pena=12):
    """Cola na caixa o lado oposto da foto, espelhado no eixo vertical do aro."""
    x0, y0, x1, y1 = caixa
    sx0, sx1 = int(round(2 * CX - x1)), int(round(2 * CX - x0))
    fonte = np.asarray(base.crop((sx0, y0, sx1, y1)))[:, ::-1].astype(np.float32)
    # só onde o lado espelhado é madeira (e uns 12px em volta): o linho já foi refeito com a luz certa
    R, G, B = fonte[..., 0], fonte[..., 1], fonte[..., 2]
    madeira = ((R - B > 40) & (R - G > 8) & (R - G < 60) & (R > 90)).astype(np.uint8) * 255
    madeira = np.asarray(Image.fromarray(madeira).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    misturar(base, caixa, fonte, pena_mascara((x1 - x0, y1 - y0), pena, caixa) * madeira)


# mão esquerda: linho fora do aro; a linha e a agulha no aro (e rente a ele) vêm do lado direito, espelhado
cobrir_linho(img, (0, 0, 330, 340), buraco=(0, 0, 250, 300), pena=26)
cobrir_linho(img, (270, 185, 450, 245), buraco=(280, 212, 430, 245), pena=12)
espelhar(img, (200, 196, 450, 300), pena=14)
# mão direita: linho fora do aro; os dedos no aro vêm do lado esquerdo, já limpo
cobrir_linho(img, (760, 0, 1024, 470), buraco=(820, 0, 1010, 420), pena=30)
espelhar(img, (835, 338, 955, 432), pena=12)

img.save(RAIZ / "marketing/instagram/ia/bordado.jpg", quality=94)
print("ok: marketing/instagram/ia/bordado.jpg")
