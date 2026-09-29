"""Gera as peças do Instagram a partir dos modelos HTML em marketing/instagram/modelos/.

Foto ocupa a peça inteira; o texto vai direto sobre a imagem, com a marca pequena junto dele.
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
    "post-1": FEED, "post-1b": FEED, "post-2": FEED, "post-2b": FEED, "post-3": FEED, "post-3b": FEED,
    "carrossel-1": FEED, "carrossel-2": FEED, "carrossel-3": FEED, "carrossel-4": FEED, "carrossel-5": FEED,
    "anvisa": FEED,
    "anuncio": FEED, "anuncio-stories": STORIES,
}

# id Pexels -> (onde é usada, autor, página)
CREDITOS = {
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
            png = page.screenshot(clip={"x": 0, "y": 0, "width": larg, "height": alt})
            img = Image.open(io.BytesIO(png)).convert("RGB")
            img.save(PASTA / f"{nome}.jpg", quality=93, optimize=True)
            print(f"{nome}.jpg", img.size, (PASTA / f"{nome}.jpg").stat().st_size // 1024, "KB")
            page.close()
        b.close()
    srv.shutdown()


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    baixar_fotos()
    for pid in TELAS:
        por_tela_do_app(pid)
    renderizar(filtro)


if __name__ == "__main__":
    main()
