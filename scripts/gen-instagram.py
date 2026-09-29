"""Gera as publicações do Instagram (1080x1350, 4:5) a partir dos modelos HTML.

Fotos: Pexels (licença livre para uso comercial). Se faltarem em marketing/instagram/fotos/, são baixadas.
Saída: marketing/instagram/post-1.jpg, post-2.jpg, post-3.jpg

Uso: python scripts/gen-instagram.py [--bio "artesana.app"]
"""
import argparse
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

# id Pexels -> (autor, página)
CREDITOS = {
    11749490: ("Matheus Bertelli", "https://www.pexels.com/photo/smiling-woman-in-blouse-holding-a-smartphone-11749490/"),
    6612222: ("Tima Miroshnichenko", "https://www.pexels.com/photo/woman-in-gray-long-sleeve-shirt-standing-while-holding-smartphone-6612222/"),
    7309930: ("RDNE Stock project", "https://www.pexels.com/photo/woman-taking-pictures-using-a-smartphone-7309930/"),
}

# cantos da tela do celular na foto 6612222 (1800x2700): TL, TR, BR, BL
TELA = [(370, 1309), (554, 1310), (556, 1707), (371, 1707)]
PESSEGO_H, SAT_GANHO, VAL_GANHO = 14, 1.45, 1.27  # matiz do pêssego da marca na escala 0-255


def baixar_fotos() -> None:
    FOTOS.mkdir(parents=True, exist_ok=True)
    for pid in CREDITOS:
        destino = FOTOS / f"{pid}.jpg"
        if destino.exists():
            continue
        url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&h=2700"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        destino.write_bytes(urllib.request.urlopen(req, timeout=60).read())
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
    """Foto do post 2: fundo rosa vira pêssego da marca e a tela do celular mostra o app."""
    src = Image.open(FOTOS / "6612222.jpg").convert("RGB")
    larg, alt = src.size
    rgb = np.asarray(src).astype(np.float32)

    # 1) fundo = pixels rosados conectados à borda (flood em 1/4 da escala)
    hsv = np.asarray(src.convert("HSV")).astype(np.float32)
    hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    crit = ((hh >= 228) | (hh <= 8)) & (ss > 30) & (ss < 160) & (vv > 110)
    peq = Image.fromarray((crit * 255).astype(np.uint8)).resize((larg // 4, alt // 4), Image.BOX)
    peq = peq.point(lambda v: 255 if v > 200 else 0)
    for semente in [(2, 2), (larg // 4 - 3, 2), (2, alt // 8), (larg // 4 - 3, alt // 8), (larg // 8, 2)]:
        if peq.getpixel(semente) == 255:
            ImageDraw.floodfill(peq, semente, 128)
    fundo = peq.point(lambda v: 255 if v == 128 else 0).resize((larg, alt), Image.BILINEAR)
    fundo = fundo.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.2))
    alfa = (np.asarray(fundo).astype(np.float32) / 255.0) * ((hh >= 222) | (hh <= 12))  # não invade pele/cabelo
    alfa = np.asarray(Image.fromarray((alfa * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255.0

    novo = hsv.copy()
    novo[..., 0] = PESSEGO_H
    novo[..., 1] = np.clip(ss * SAT_GANHO, 0, 255)
    novo[..., 2] = np.clip(vv * VAL_GANHO, 0, 255)
    pessego = np.asarray(Image.fromarray(novo.astype(np.uint8), "HSV").convert("RGB")).astype(np.float32)
    rgb = rgb * (1 - alfa[..., None]) + pessego * alfa[..., None]

    # 2) tela do celular: região branca conectada ao centro da tela
    x0, y0, x1, y1 = 300, 1230, 700, 1800
    branco = Image.fromarray(((np.asarray(src).min(axis=2) > 212) * 255).astype(np.uint8)).crop((x0, y0, x1, y1))
    ImageDraw.floodfill(branco, (460 - x0, 1500 - y0), 128)
    tela = Image.new("L", (larg, alt), 0)
    tela.paste(branco.point(lambda v: 255 if v == 128 else 0), (x0, y0))
    tela = tela.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    a_tela = np.asarray(tela).astype(np.float32) / 255.0

    app = Image.open(RAIZ / "assets" / "site" / "tela-home.png").convert("RGB")
    lw = int(np.hypot(TELA[1][0] - TELA[0][0], TELA[1][1] - TELA[0][1])) * 2
    lh = int(np.hypot(TELA[3][0] - TELA[0][0], TELA[3][1] - TELA[0][1])) * 2
    app = app.resize((lw, lh), Image.LANCZOS)
    posto = app.transform((larg, alt), Image.PERSPECTIVE, coeficientes(TELA, app.size), Image.BICUBIC)
    luz = np.clip(np.asarray(src.convert("L")).astype(np.float32) / 246.0, 0.82, 1.0)  # mantém a iluminação da cena
    posto = np.asarray(posto).astype(np.float32) * luz[..., None]
    rgb = rgb * (1 - a_tela[..., None]) + posto * a_tela[..., None]

    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(FOTOS / "6612222-app.jpg", quality=94)
    print("preparada 6612222-app.jpg")


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def renderizar(bio: str) -> None:
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/marketing/instagram/modelos"
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=1)
        for n in (1, 2, 3):
            page.goto(f"{base}/post-{n}.html", wait_until="networkidle")
            page.evaluate("(t) => document.querySelectorAll('.bio').forEach(e => e.textContent = t)", bio)
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(400)
            png = page.screenshot(clip={"x": 0, "y": 0, "width": 1080, "height": 1350})
            img = Image.open(io.BytesIO(png)).convert("RGB")
            img.save(PASTA / f"post-{n}.jpg", quality=93, optimize=True)
            print(f"post-{n}.jpg", img.size, (PASTA / f"post-{n}.jpg").stat().st_size // 1024, "KB")
        b.close()
    srv.shutdown()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bio", default="link na bio", help="texto à direita da assinatura (ex: artesana.app)")
    args = ap.parse_args()
    baixar_fotos()
    preparar_foto_app()
    renderizar(args.bio)


if __name__ == "__main__":
    main()
