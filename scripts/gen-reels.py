"""Gera os reels (1080 x 1920, MP4 sem áudio) a partir de um modelo HTML e de uma foto ou de um vídeo.

Foto: entra com um zoom lento (Ken Burns). Vídeo: um trecho de um clipe do Pexels, baixado na primeira vez
pra marketing/instagram/fotos/ (fora do repositório). Cada texto do modelo é uma camada `.camada` com
`data-t` (segundo em que aparece) e `data-dur` (duração do fade). As camadas são renderizadas uma vez pelo
navegador, com fundo transparente, e compostas quadro a quadro em Python; o vídeo sai pelo ffmpeg.
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
import urllib.request
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"
FOTOS = PASTA / "fotos"
LARG, ALT, FPS = 1080, 1920, 30
# área que o Instagram cobre com os próprios botões e legenda: texto fica fora dela
SEGURO = {"topo": 250, "base": 340, "lado": 120}

# vídeos do Pexels (licença livre para uso comercial): id -> (arquivo, autor, página)
VIDEOS = {
    6753499: ("https://videos.pexels.com/video-files/6753499/6753499-uhd_2160_3840_25fps.mp4", "Vlada Karpovich", "https://www.pexels.com/video/a-person-lighting-a-candle-6753499/"),
}

# nome do arquivo -> modelo HTML, fonte (foto ou vídeo), duração em segundos, zoom final (foto) ou início do trecho (vídeo)
REELS = {
    "dia3-reel": {"modelo": "reel-dia3.html", "video": 6753499, "inicio": 2.0, "dur": 12.0},
    "dia6-reel": {"modelo": "reel-dia6.html", "foto": "ia/presente_reel.jpg", "dur": 8.0, "zoom": 1.08},
}


def ffmpeg_exe() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg  # instalado com o Python do sistema

    return imageio_ffmpeg.get_ffmpeg_exe()


def baixar_video(pid: int) -> Path:
    FOTOS.mkdir(parents=True, exist_ok=True)
    destino = FOTOS / f"video-{pid}.mp4"
    if destino.exists():
        return destino
    url = VIDEOS[pid][0]
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0", "Referer": "https://www.pexels.com/"})
    with urllib.request.urlopen(req, timeout=300) as r:
        destino.write_bytes(r.read())
    print("baixado", destino.name, destino.stat().st_size // 1024, "KB")
    return destino


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


def compor(base: Image.Image, camadas, t: float) -> Image.Image:
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
    return base


def quadros_foto(foto: Image.Image, camadas, dur: float, zoom: float):
    total = int(dur * FPS)
    esc = max(LARG * zoom / foto.width, ALT * zoom / foto.height)
    grande = foto.resize((round(foto.width * esc), round(foto.height * esc)), Image.LANCZOS)
    gw, gh = grande.size
    for f in range(total):
        z = 1 + (zoom - 1) * suave(f / max(total - 1, 1))
        jw, jh = gw / z, gh / z
        x0, y0 = (gw - jw) / 2, (gh - jh) / 2
        base = grande.crop((round(x0), round(y0), round(x0 + jw), round(y0 + jh))).resize((LARG, ALT), Image.BILINEAR).convert("RGBA")
        yield compor(base, camadas, f / FPS).convert("RGB")


def quadros_video(arquivo: Path, camadas, inicio: float, dur: float):
    """Lê o trecho do clipe pelo ffmpeg, já em 1080x1920 e 30 fps, e compõe as camadas."""
    cmd = [ffmpeg_exe(), "-loglevel", "error", "-ss", f"{inicio:.2f}", "-t", f"{dur:.2f}", "-i", str(arquivo),
           "-vf", f"fps={FPS},scale={LARG}:{ALT}:force_original_aspect_ratio=increase,crop={LARG}:{ALT}",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=LARG * ALT * 3 * 4)
    tam = LARG * ALT * 3
    f = 0
    while True:
        bruto = proc.stdout.read(tam)
        if len(bruto) < tam:
            break
        base = Image.frombytes("RGB", (LARG, ALT), bruto).convert("RGBA")
        yield compor(base, camadas, f / FPS).convert("RGB")
        f += 1
    proc.stdout.close()
    proc.wait()


def renderizar(nome: str, spec: dict, navegador, base_url: str) -> None:
    camadas = capturar_camadas(navegador, f"{base_url}/{spec['modelo']}")
    if "video" in spec:
        fonte = baixar_video(spec["video"])
        quadros = quadros_video(fonte, camadas, spec["inicio"], spec["dur"])
    else:
        quadros = quadros_foto(Image.open(PASTA / spec["foto"]).convert("RGB"), camadas, spec["dur"], spec["zoom"])
    destino = PASTA / f"{nome}.mp4"
    cmd = [ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{LARG}x{ALT}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(destino)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    ultimo = None
    n = 0
    for q in quadros:
        proc.stdin.write(q.tobytes())
        ultimo = q
        n += 1
    proc.stdin.close()
    assert proc.wait() == 0 and ultimo is not None, "ffmpeg falhou"
    ultimo.save(PASTA / f"{nome.replace('-reel', '')}-capa.jpg", quality=92, optimize=True)
    print(f"{destino.name}  {n / FPS:.1f}s  {destino.stat().st_size // 1024} KB  + capa")


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/marketing/instagram/modelos"
    with sync_playwright() as p:
        b = p.chromium.launch()
        for nome, spec in REELS.items():
            if filtro and not nome.startswith(filtro):
                continue
            renderizar(nome, spec, b, base)
        b.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
