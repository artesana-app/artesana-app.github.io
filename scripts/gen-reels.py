"""Gera os reels (1080 x 1920, MP4 sem áudio) a partir de um modelo HTML e de uma foto.

A foto entra com um zoom lento (Ken Burns). Cada texto do modelo é uma camada `.camada` com `data-t`
(segundo em que aparece) e `data-dur` (duração do fade, opcional). As camadas são renderizadas uma vez
pelo navegador, com fundo transparente, e compostas quadro a quadro em Python; o vídeo sai pelo ffmpeg.
A capa (último quadro, com tudo visível) sai em JPG pra escolher no Instagram.

Sem áudio de propósito: a música entra na hora de publicar, pela biblioteca do próprio Instagram.

Uso:
  python scripts/gen-reels.py            # todos
  python scripts/gen-reels.py dia3       # só os que começam com "dia3"
"""
import functools
import http.server
import io
import shutil
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"
LARG, ALT, FPS = 1080, 1920, 30
# área que o Instagram cobre com os próprios botões e legenda: texto fica fora dela
SEGURO = {"topo": 250, "base": 340, "lado": 120}

# nome do arquivo -> (modelo HTML, foto, duração em segundos, zoom final)
REELS = {
    "dia3-reel": ("reel-dia3.html", "ia/fosforo_reel.jpg", 12.0, 1.10),
    "dia6-reel": ("reel-dia6.html", "ia/presente_reel.jpg", 11.0, 1.08),
}


def ffmpeg_exe() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg  # instalado com o Python do sistema

    return imageio_ffmpeg.get_ffmpeg_exe()


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def capturar_camadas(navegador, url: str):
    """Cada .camada vira (t0, fade, imagem RGBA 1080x1920), já conferida contra a área segura."""
    page = navegador.new_page(viewport={"width": LARG, "height": ALT}, device_scale_factor=1)
    falhas = []
    page.on("requestfailed", lambda r: falhas.append(r.url))
    page.goto(url, wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(400)
    assert not falhas, f"arquivo não carregou: {falhas}"
    page.evaluate("() => { for (const e of [document.documentElement, document.body]) e.style.background = 'transparent'; }")
    n = page.locator(".camada").count()
    assert n, "modelo sem .camada"
    camadas = []
    for i in range(n):
        info = page.evaluate("""(i) => {
            const todas = [...document.querySelectorAll('.camada')];
            todas.forEach((e, j) => e.style.visibility = j === i ? 'visible' : 'hidden');
            const e = todas[i];
            const caixas = [e, ...e.querySelectorAll('*')].filter(x => x.childNodes.length && [...x.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()))
              .map(x => { const r = x.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
            return { t: Number(e.dataset.t || 0), dur: Number(e.dataset.dur || 0.8), caixas };
        }""", i)
        for x0, y0, x1, y1 in info["caixas"]:
            assert x0 >= SEGURO["lado"] - 1 and x1 <= LARG - SEGURO["lado"] + 1, f"camada {i}: texto fora da margem lateral ({x0:.0f}..{x1:.0f})"
            assert y0 >= SEGURO["topo"] - 1 and y1 <= ALT - SEGURO["base"] + 1, f"camada {i}: texto na área dos botões do Instagram ({y0:.0f}..{y1:.0f})"
        png = page.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": LARG, "height": ALT})
        camadas.append((info["t"], info["dur"], Image.open(io.BytesIO(png)).convert("RGBA")))
    page.close()
    return camadas


def suave(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def quadros(foto: Image.Image, camadas, dur: float, zoom: float):
    """Gera os quadros RGB do reel, um a um."""
    total = int(dur * FPS)
    # a foto cobre a tela com folga pro zoom
    esc = max(LARG * zoom / foto.width, ALT * zoom / foto.height)
    grande = foto.resize((round(foto.width * esc), round(foto.height * esc)), Image.LANCZOS)
    gw, gh = grande.size
    for f in range(total):
        t = f / FPS
        z = 1 + (zoom - 1) * suave(f / max(total - 1, 1))
        # janela visível encolhe com o zoom, sempre centrada
        jw, jh = gw / z, gh / z
        x0, y0 = (gw - jw) / 2, (gh - jh) / 2
        base = grande.crop((round(x0), round(y0), round(x0 + jw), round(y0 + jh))).resize((LARG, ALT), Image.BILINEAR).convert("RGBA")
        for t0, fade, camada in camadas:
            a = suave((t - t0) / fade) if fade else float(t >= t0)
            if a <= 0:
                continue
            if a >= 1:
                base.alpha_composite(camada)
            else:
                lay = camada.copy()
                lay.putalpha(camada.getchannel("A").point(lambda v, a=a: int(v * a)))
                base.alpha_composite(lay, (0, round(14 * (1 - a))))
        yield base.convert("RGB")


def renderizar(nome: str, modelo: str, foto: str, dur: float, zoom: float, navegador, base_url: str) -> None:
    camadas = capturar_camadas(navegador, f"{base_url}/{modelo}")
    img = Image.open(PASTA / foto).convert("RGB")
    destino = PASTA / f"{nome}.mp4"
    cmd = [ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{LARG}x{ALT}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(destino)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    ultimo = None
    for q in quadros(img, camadas, dur, zoom):
        proc.stdin.write(q.tobytes())
        ultimo = q
    proc.stdin.close()
    assert proc.wait() == 0, "ffmpeg falhou"
    ultimo.save(PASTA / f"{nome.replace('-reel', '')}-capa.jpg", quality=92, optimize=True)
    print(f"{destino.name}  {dur:.0f}s  {destino.stat().st_size // 1024} KB  + capa")


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/marketing/instagram/modelos"
    with sync_playwright() as p:
        b = p.chromium.launch()
        for nome, (modelo, foto, dur, zoom) in REELS.items():
            if filtro and not nome.startswith(filtro):
                continue
            renderizar(nome, modelo, foto, dur, zoom, b, base)
        b.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
