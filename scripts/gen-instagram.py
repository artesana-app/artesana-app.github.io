"""Gera as peças do Instagram a partir dos modelos HTML em marketing/instagram/modelos/.

Série ateliê (atelie-1 a atelie-6): foto inteira ou foto com papel embaixo, três fontes, texto a 120px das bordas.
Peças anteriores: foto na peça inteira, texto direto sobre a imagem, com a marca pequena junto dele.
Fotos: Pexels (licença livre para uso comercial). Se faltarem em marketing/instagram/fotos/, são baixadas.

Uso:
  python scripts/gen-instagram.py            # todas as peças
  python scripts/gen-instagram.py carrossel  # só as que começam com "carrossel"
"""
import functools
import http.server
import io
import socketserver
import sys
import threading
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"
FOTOS = PASTA / "fotos"

# nome do arquivo (sem extensão) -> tamanho em pixels
FEED = (1080, 1350)
STORIES = (1080, 1920)
PECAS = {
    "atelie-1": FEED, "atelie-2": FEED, "atelie-3": FEED, "atelie-4": FEED, "atelie-5": FEED, "atelie-6": FEED,
    "post-1": FEED, "post-1b": FEED, "post-2": FEED, "post-2b": FEED, "post-3": FEED, "post-3b": FEED,
    "carrossel-1": FEED, "carrossel-2": FEED, "carrossel-3": FEED, "carrossel-4": FEED, "carrossel-5": FEED,
    "anvisa": FEED,
    "anuncio": FEED, "anuncio-stories": STORIES,
}

# id Pexels -> (onde é usada, autor, página)
CREDITOS = {
    37455823: ("atelie-1", "lucas correa", "https://www.pexels.com/photo/senior-woman-sewing-at-home-in-manaus-37455823/"),
    6588483: ("atelie-2", "ROMAN ODINTSOV", "https://www.pexels.com/photo/closing-jar-of-jam-6588483/"),
    5585246: ("atelie-3", "cottonbro studio", "https://www.pexels.com/photo/person-knitting-a-gray-thread-5585246/"),
    7331674: ("atelie-4", "Wayne Fotografias", "https://www.pexels.com/photo/an-elderly-woman-using-a-smartphone-7331674/"),
    35627278: ("atelie-5", "Felipe souza", "https://www.pexels.com/photo/portrait-of-smiling-woman-with-polka-dot-sculpture-35627278/"),
    5585245: ("atelie-6", "cottonbro studio", "https://www.pexels.com/photo/elderly-woman-with-her-granddaughter-5585245/"),
    6023599: ("post-1", "Kampus Production", "https://www.pexels.com/photo/a-woman-wearing-an-apron-and-eyeglasses-6023599/"),
    5420572: ("post-1b, carrossel-4", "Polina", "https://www.pexels.com/photo/handmade-organic-soaps-5420572/"),
    5257217: ("post-2", "Anna Shvets", "https://www.pexels.com/photo/a-woman-using-a-smartphone-5257217/"),
    30991026: ("post-2b", "Jakub Zerdzicki", "https://www.pexels.com/photo/smartphone-mockup-with-cozy-fireplace-background-30991026/"),
    7246868: ("post-3", "olia danilevich", "https://www.pexels.com/photo/an-elderly-woman-making-a-cake-with-her-granddaughter-7246868/"),
    6957844: ("post-3b", "Mikhail Nilov", "https://www.pexels.com/photo/a-woman-and-a-young-girl-painting-easter-eggs-6957844/"),
    8087568: ("carrossel-1", "Yaroslav Shuraev", "https://www.pexels.com/photo/elderly-woman-smiling-while-holding-a-smartphone-8087568/"),
    8947553: ("carrossel-2", "https://kaboompics.com/", "https://www.pexels.com/photo/empty-container-with-a-blank-label-8947553/"),
    6786892: ("carrossel-3", "Artem Podrez", "https://www.pexels.com/photo/hands-holding-smartphone-6786892/"),
    5682670: ("carrossel-5", "Anna Shvets", "https://www.pexels.com/photo/a-woman-holding-a-bottle-dropper-5682670/"),
    8100788: ("anvisa", "Polina", "https://www.pexels.com/photo/photo-of-products-on-brown-surface-8100788/"),
    7330711: ("anuncio, anuncio-stories", "MART  PRODUCTION", "https://www.pexels.com/photo/woman-using-a-smartphone-by-the-window-7330711/"),
}

# celulares com tela em branco que recebem uma tela real do app:
# foto -> (tela do app, ponto dentro da tela na foto, limiar de claro)
TELAS = {
    30991026: ("tela-home.png", (1195, 1600), 185),
    6786892: ("tela-whatsapp.png", (607, 1400), 215),
}


def baixar_fotos() -> None:
    FOTOS.mkdir(parents=True, exist_ok=True)
    for pid in CREDITOS:
        destino = FOTOS / f"{pid}.jpg"
        if destino.exists():
            continue
        url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&h=2700"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        destino.write_bytes(urllib.request.urlopen(req, timeout=90).read())
        print("baixada", destino.name)


def papel() -> None:
    """Textura de papel usada no fundo creme e como grão sobre as fotos da série ateliê."""
    destino = PASTA / "modelos" / "papel.png"
    if destino.exists():
        return
    rng = np.random.default_rng(7)
    lado = 512
    fino = rng.normal(0, 1, (lado, lado))
    largo = np.asarray(Image.fromarray((rng.random((lado, lado)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255 - 0.5
    alfa = np.clip(10 + fino * 7 + largo * 60, 0, 40).astype(np.uint8)
    rgba = np.zeros((lado, lado, 4), np.uint8)
    rgba[..., :3] = (120, 92, 80)
    rgba[..., 3] = alfa
    Image.fromarray(rgba, "RGBA").save(destino, optimize=True)
    print("gerada", destino.name)


def coeficientes(quad, tamanho):
    w, h = tamanho
    origem = [(0, 0), (w, 0), (w, h), (0, h)]
    a, b = [], []
    for (x, y), (u, v) in zip(quad, origem):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    return np.linalg.solve(np.array(a, float), np.array(b, float))


def por_tela_do_app(pid: int) -> None:
    """A tela em branco do celular da foto passa a mostrar uma tela real do app."""
    arquivo, dentro, limiar = TELAS[pid]
    src = Image.open(FOTOS / f"{pid}.jpg").convert("RGB")
    larg, alt = src.size
    rgb = np.asarray(src).astype(np.float32)

    # tela = região clara conectada ao ponto informado (flood em 1/2 da escala)
    claro = Image.fromarray(((rgb.min(axis=2) > limiar) * 255).astype(np.uint8))
    peq = claro.resize((larg // 2, alt // 2), Image.BOX).point(lambda v: 255 if v > 200 else 0)
    assert peq.getpixel((dentro[0] // 2, dentro[1] // 2)) == 255, f"ponto {dentro} não está na tela clara da foto {pid}"
    ImageDraw.floodfill(peq, (dentro[0] // 2, dentro[1] // 2), 128)
    so_tela = peq.point(lambda v: 255 if v == 128 else 0)
    x0, y0, x1, y1 = so_tela.getbbox()
    quad = [(x0 * 2, y0 * 2), (x1 * 2, y0 * 2), (x1 * 2, y1 * 2), (x0 * 2, y1 * 2)]
    cobertura = np.asarray(so_tela).mean() / 255 * 100
    assert cobertura < 30, f"a região clara tomou {cobertura:.0f}% da foto {pid}: vazou pra fora da tela"

    tela = so_tela.resize((larg, alt), Image.BILINEAR).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.4))
    alfa = np.asarray(tela).astype(np.float32) / 255.0

    app = Image.open(RAIZ / "assets" / "site" / arquivo).convert("RGB")
    app = app.resize((quad[1][0] - quad[0][0], quad[3][1] - quad[0][1]), Image.LANCZOS)
    posto = app.transform((larg, alt), Image.PERSPECTIVE, coeficientes(quad, app.size), Image.BICUBIC)
    luz = np.clip(np.asarray(src.convert("L")).astype(np.float32) / 246.0, 0.84, 1.0)  # mantém a luz da cena
    posto = np.asarray(posto).astype(np.float32) * luz[..., None]
    rgb = rgb * (1 - alfa[..., None]) + posto * alfa[..., None]

    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(FOTOS / f"{pid}-app.jpg", quality=94)
    print(f"preparada {pid}-app.jpg  tela em {quad[0]} até {quad[2]}, {cobertura:.1f}% da foto")


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


MARGEM = 120  # nenhum texto da série ateliê chega mais perto que isso de uma borda


def conferir_margem(page, nome: str, larg: int, alt: int) -> None:
    caixas = page.evaluate("""() => [...document.querySelectorAll('.frase, .recado, .aviso, .marca')].map(e => {
        const r = e.getBoundingClientRect();
        return { classe: e.className, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
    })""")
    assert caixas, f"{nome}: não achei texto pra conferir"
    folga = min(min(c["x0"], c["y0"], larg - c["x1"], alt - c["y1"]) for c in caixas)
    assert folga >= MARGEM - 1, f"{nome}: texto a {folga:.0f}px da borda, o mínimo é {MARGEM}px: {caixas}"
    print(f"  margem de segurança: texto mais próximo da borda a {folga:.0f}px")


def renderizar(filtro: str) -> None:
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/marketing/instagram/modelos"
    with sync_playwright() as p:
        b = p.chromium.launch()
        for nome, (larg, alt) in PECAS.items():
            if filtro and not nome.startswith(filtro):
                continue
            page = b.new_page(viewport={"width": larg, "height": alt}, device_scale_factor=1)
            falhas = []
            page.on("requestfailed", lambda r: falhas.append(r.url))
            page.goto(f"{base}/{nome}.html", wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(400)
            assert not falhas, f"{nome}: arquivo não carregou: {falhas}"
            if nome.startswith("atelie"):
                conferir_margem(page, nome, larg, alt)
            png = page.screenshot(clip={"x": 0, "y": 0, "width": larg, "height": alt})
            img = Image.open(io.BytesIO(png)).convert("RGB")
            img.save(PASTA / f"{nome}.jpg", quality=93, optimize=True)
            print(f"{nome}.jpg", img.size, (PASTA / f"{nome}.jpg").stat().st_size // 1024, "KB")
            page.close()
        b.close()
    srv.shutdown()


def grade() -> None:
    """Prévia de como a série fica na grade do perfil: corte 3:4 no centro, a mais nova em cima à esquerda."""
    ordem = [6, 5, 4, 3, 2, 1]
    lado_l, lado_a, vao = 405, 540, 6
    folha = Image.new("RGB", (3 * lado_l + 2 * vao, 2 * lado_a + vao), "white")
    for n, peca in enumerate(ordem):
        im = Image.open(PASTA / f"atelie-{peca}.jpg").convert("RGB")
        corte = round(im.height * 3 / 4)
        x0 = (im.width - corte) // 2
        im = im.crop((x0, 0, x0 + corte, im.height)).resize((lado_l, lado_a), Image.LANCZOS)
        folha.paste(im, ((n % 3) * (lado_l + vao), (n // 3) * (lado_a + vao)))
    folha.save(PASTA / "grade-atelie.jpg", quality=92, optimize=True)
    print("grade-atelie.jpg", folha.size)


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    baixar_fotos()
    papel()
    for pid in TELAS:
        por_tela_do_app(pid)
    renderizar(filtro)
    if "atelie".startswith(filtro) or filtro.startswith("atelie"):
        grade()


if __name__ == "__main__":
    main()
