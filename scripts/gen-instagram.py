"""Gera as publicações do Instagram (1080x1350, 4:5) a partir dos modelos HTML.

Foto ocupa a peça inteira; o texto vai direto sobre a imagem, com a marca pequena junto dele.
Fotos: Pexels (licença livre para uso comercial). Se faltarem em marketing/instagram/fotos/, são baixadas.

Saída em marketing/instagram/:
  post-1.jpg  post-2.jpg  post-3.jpg     peças principais
  post-1b.jpg post-2b.jpg post-3b.jpg    alternativas para a mesma chamada

Uso: python scripts/gen-instagram.py
"""
import functools
import http.server
import io
import socketserver
import threading
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"
FOTOS = PASTA / "fotos"
PECAS = ["1", "1b", "2", "2b", "3", "3b"]

# id Pexels -> (peça, autor, página)
CREDITOS = {
    6023599: ("1", "Kampus Production", "https://www.pexels.com/photo/a-woman-wearing-an-apron-and-eyeglasses-6023599/"),
    5420572: ("1b", "Polina", "https://www.pexels.com/photo/handmade-organic-soaps-5420572/"),
    5257217: ("2", "Anna Shvets", "https://www.pexels.com/photo/a-woman-using-a-smartphone-5257217/"),
    30991026: ("2b", "Jakub Zerdzicki", "https://www.pexels.com/photo/smartphone-mockup-with-cozy-fireplace-background-30991026/"),
    7246868: ("3", "olia danilevich", "https://www.pexels.com/photo/an-elderly-woman-making-a-cake-with-her-granddaughter-7246868/"),
    6957844: ("3b", "Mikhail Nilov", "https://www.pexels.com/photo/a-woman-and-a-young-girl-painting-easter-eggs-6957844/"),
}

# tela do celular na foto 30991026 (1801x2700): retângulo TL, TR, BR, BL e ponto dentro da tela
TELA = [(888, 958), (1502, 958), (1502, 2266), (888, 2266)]
DENTRO = (1195, 1600)


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


def preparar_foto_app() -> None:
    """Foto da peça 2b: a tela em branco do celular passa a mostrar a tela inicial real do app."""
    src = Image.open(FOTOS / "30991026.jpg").convert("RGB")
    larg, alt = src.size
    rgb = np.asarray(src).astype(np.float32)

    # tela = região clara conectada ao centro da tela (flood em 1/2 da escala, o fogo ao fundo fica de fora)
    claro = Image.fromarray(((rgb.min(axis=2) > 185) * 255).astype(np.uint8))
    peq = claro.resize((larg // 2, alt // 2), Image.BOX).point(lambda v: 255 if v > 200 else 0)
    ImageDraw.floodfill(peq, (DENTRO[0] // 2, DENTRO[1] // 2), 128)
    tela = peq.point(lambda v: 255 if v == 128 else 0).resize((larg, alt), Image.BILINEAR)
    tela = tela.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.4))
    alfa = np.asarray(tela).astype(np.float32) / 255.0

    app = Image.open(RAIZ / "assets" / "site" / "tela-home.png").convert("RGB")
    app = app.resize((TELA[1][0] - TELA[0][0], TELA[3][1] - TELA[0][1]), Image.LANCZOS)
    posto = app.transform((larg, alt), Image.PERSPECTIVE, coeficientes(TELA, app.size), Image.BICUBIC)
    luz = np.clip(np.asarray(src.convert("L")).astype(np.float32) / 246.0, 0.84, 1.0)  # mantém a luz da cena
    posto = np.asarray(posto).astype(np.float32) * luz[..., None]
    rgb = rgb * (1 - alfa[..., None]) + posto * alfa[..., None]

    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(FOTOS / "30991026-app.jpg", quality=94)
    print("preparada 30991026-app.jpg")


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def renderizar() -> None:
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/marketing/instagram/modelos"
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=1)
        for n in PECAS:
            page.goto(f"{base}/post-{n}.html", wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(400)
            png = page.screenshot(clip={"x": 0, "y": 0, "width": 1080, "height": 1350})
            img = Image.open(io.BytesIO(png)).convert("RGB")
            img.save(PASTA / f"post-{n}.jpg", quality=93, optimize=True)
            print(f"post-{n}.jpg", img.size, (PASTA / f"post-{n}.jpg").stat().st_size // 1024, "KB")
        b.close()
    srv.shutdown()


def main() -> None:
    baixar_fotos()
    preparar_foto_app()
    renderizar()


if __name__ == "__main__":
    main()
