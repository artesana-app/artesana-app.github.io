"""Gera as peças do Instagram a partir dos modelos HTML em marketing/instagram/modelos/.

Série ateliê (atelie-1 a atelie-6): foto inteira ou foto com papel embaixo, três fontes, texto a 120px das bordas.
Peças anteriores: foto na peça inteira, texto direto sobre a imagem, com a marca pequena junto dele.
Fotos da série ateliê: geradas por IA, em marketing/instagram/ia/ (ver scripts/gen-fotos-ia.py).
Fotos das peças anteriores: Pexels. Se faltarem em marketing/instagram/fotos/, são baixadas.

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

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bordado  # noqa: E402
import importlib.util as _iu
_spec = _iu.spec_from_file_location("rotulo_na_foto", Path(__file__).resolve().parent / "rotulo-na-foto.py")
rotulo_na_foto = _iu.module_from_spec(_spec); _spec.loader.exec_module(rotulo_na_foto)  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"
FOTOS = PASTA / "fotos"

# nome do arquivo (sem extensão) -> tamanho em pixels
FEED = (1080, 1350)
STORIES = (1080, 1920)
PECAS = {
    "dia1": FEED, "dia2-1": FEED, "dia2-2": FEED, "dia2-3": FEED, "dia2-4": FEED, "dia2-5": FEED, "dia2-6": FEED,
    "dia4": FEED, "dia5-1": FEED, "dia5-2": FEED, "dia5-3": FEED, "dia5-4": FEED, "dia5-5": FEED, "dia7": FEED,
    "atelie-1": FEED, "atelie-2": FEED, "atelie-3": FEED, "atelie-4": FEED, "atelie-5": FEED, "atelie-6": FEED,
    "post-1": FEED, "post-1b": FEED, "post-2": FEED, "post-2b": FEED, "post-3": FEED, "post-3b": FEED,
    "carrossel-1": FEED, "carrossel-2": FEED, "carrossel-3": FEED, "carrossel-4": FEED, "carrossel-5": FEED,
    "anvisa": FEED,
    "anuncio": FEED, "anuncio-stories": STORIES,
}

# id Pexels -> (onde é usada, autor, página)
CREDITOS = {
    4865722: ("dia2-4", "Anna Shvets", "https://www.pexels.com/photo/4865722/"),
    6348104: ("dia2-5", "Liza Summer", "https://www.pexels.com/photo/crop-faceless-woman-showing-small-gift-box-on-palms-6348104/"),
    19149300: ("dia5-4", "Ioana Motoc", "https://www.pexels.com/photo/woman-holding-a-christmas-present-wrapped-with-red-ribbon-19149300/"),
    37937447: ("atelie-1", "Harriet Fletcher", "https://www.pexels.com/photo/senior-woman-sewing-at-home-with-machine-37937447/"),
    7006154: ("atelie-2", "Vie Studio", "https://www.pexels.com/photo/person-holding-a-brown-glass-spray-bottle-7006154/"),
    5585288: ("atelie-6", "cottonbro studio", "https://www.pexels.com/photo/elderly-woman-talking-to-her-grand-daugther-5585288/"),
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

# textos que saem bordados no tecido em vez de impressos: peça -> [(seletor, cor da linha, opções)]
BORDADOS = {
    "atelie-3": [(".frase", "#3D2325", {}), (".recado", "#F1E6D6", {"engrossar": 2, "espaco": 1.7}), (".marca", "#3D2325", {"engrossar": 1, "espaco": 1.6}), (".marca b", "#F1E6D6", {"engrossar": 2, "espaco": 1.6})],
}

# etiquetas em branco que recebem o texto da marca: foto -> (ponto dentro da etiqueta, limiar de claro, linhas)
ROTULOS = {
    7006154: ((870, 1900), 200, [("sua marca.", "Poppins-400-full.ttf", 0.19, (44, 26, 30)), ("feito à mão · 60 ml", "Poppins-400-full.ttf", 0.075, (107, 90, 93))]),
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
    caixas = page.evaluate("""() => [...document.querySelectorAll('.frase, .recado, .aviso, .marca, .titulo, .sub, .nota, .num, .arraste, .arco text')].map(e => {
        const r = e.getBoundingClientRect();
        return { classe: e.className, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
    })""")
    assert caixas, f"{nome}: não achei texto pra conferir"
    folga = min(min(c["x0"], c["y0"], larg - c["x1"], alt - c["y1"]) for c in caixas)
    assert folga >= MARGEM - 1, f"{nome}: texto a {folga:.0f}px da borda, o mínimo é {MARGEM}px: {caixas}"
    print(f"  margem de segurança: texto mais próximo da borda a {folga:.0f}px")


def com_bordado(navegador, page, url, nome, larg, alt):
    """A peça sem os textos bordados, mais uma máscara de cada texto em escala maior, entregues ao bordado."""
    seletores = ", ".join(sel for sel, _c, _o in BORDADOS[nome] if not sel.endswith(" b"))
    page.evaluate("(sel) => document.querySelectorAll(sel).forEach(e => e.style.visibility = 'hidden')", seletores)
    base_img = Image.open(io.BytesIO(page.screenshot(clip={"x": 0, "y": 0, "width": larg, "height": alt}))).convert("RGB")
    grande = navegador.new_page(viewport={"width": larg, "height": alt}, device_scale_factor=bordado.ESCALA)
    grande.goto(url, wait_until="networkidle")
    grande.evaluate("document.fonts.ready")
    grande.wait_for_timeout(300)
    grande.evaluate("""() => {
        for (const e of [document.documentElement, document.body, document.querySelector('.peca')]) e.style.background = 'transparent';
        document.querySelectorAll('.janela, .papel, .veu, .marca').forEach(e => e.style.visibility = 'hidden');
    }""")
    camadas = []
    for sel, cor, opcoes in BORDADOS[nome]:
        grande.evaluate("""([todos, sel]) => {
            document.querySelectorAll(todos).forEach(e => { e.style.visibility = e.matches(sel) ? 'visible' : 'hidden'; e.style.color = '#000'; e.style.textShadow = 'none'; });
            if (sel.endsWith(' b')) {
                const pai = sel.slice(0, -2);
                document.querySelectorAll(pai).forEach(e => { e.style.visibility = 'visible'; e.style.color = 'transparent'; });
                document.querySelectorAll(sel).forEach(b => { b.style.visibility = 'visible'; b.style.color = '#000'; });
            } else if (todos.includes(sel + ' b')) {
                document.querySelectorAll(sel + ' b').forEach(b => { b.style.color = 'transparent'; });
            }
        }""", [seletores, sel])
        mascara = Image.open(io.BytesIO(grande.screenshot(omit_background=True))).getchannel("A")
        camadas.append((mascara, cor, opcoes))
    grande.close()
    img = bordado.bordar(base_img, camadas)
    print(f"  {nome}: {len(camadas)} textos bordados")
    return img


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
            if nome.startswith(("atelie", "dia")):
                conferir_margem(page, nome, larg, alt)
            if nome in BORDADOS:
                img = com_bordado(b, page, f"{base}/{nome}.html", nome, larg, alt)
            else:
                png = page.screenshot(clip={"x": 0, "y": 0, "width": larg, "height": alt})
                img = Image.open(io.BytesIO(png)).convert("RGB")
            img.save(PASTA / f"{nome}.jpg", quality=93, optimize=True)
            print(f"{nome}.jpg", img.size, (PASTA / f"{nome}.jpg").stat().st_size // 1024, "KB")
            page.close()
        b.close()
    srv.shutdown()


# o que aparece na grade do perfil, na ordem de publicar (capa dos reels e dos carrosséis)
FEED_ORDEM = ["atelie-1", "atelie-2", "atelie-3", "atelie-4", "atelie-5", "atelie-6",
              "dia1", "dia2-1", "dia3-capa", "dia4", "dia5-1", "dia6-capa", "dia7"]


def grade() -> None:
    """Prévia da grade do perfil: corte 3:4 no centro de cada peça, a mais nova em cima à esquerda."""
    ordem = [n for n in reversed(FEED_ORDEM) if (PASTA / f"{n}.jpg").exists()]
    lado_l, lado_a, vao = 405, 540, 6
    linhas = (len(ordem) + 2) // 3
    folha = Image.new("RGB", (3 * lado_l + 2 * vao, linhas * lado_a + (linhas - 1) * vao), "white")
    for n, peca in enumerate(ordem):
        im = Image.open(PASTA / f"{peca}.jpg").convert("RGB")
        corte_l = min(im.width, round(im.height * 3 / 4))
        corte_a = round(corte_l * 4 / 3)
        x0, y0 = (im.width - corte_l) // 2, (im.height - corte_a) // 2
        im = im.crop((x0, y0, x0 + corte_l, y0 + corte_a)).resize((lado_l, lado_a), Image.LANCZOS)
        folha.paste(im, ((n % 3) * (lado_l + vao), (n // 3) * (lado_a + vao)))
    folha.save(PASTA / "grade-perfil.jpg", quality=92, optimize=True)
    print("grade-perfil.jpg", folha.size, f"{len(ordem)} peças")


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    baixar_fotos()
    papel()
    for pid in TELAS:
        por_tela_do_app(pid)
    for pid, (ponto, limiar, linhas) in ROTULOS.items():
        if not (FOTOS / f"{pid}-rotulo.jpg").exists():
            info = rotulo_na_foto.rotular(FOTOS / f"{pid}.jpg", FOTOS / f"{pid}-rotulo.jpg", ponto, limiar, linhas)
            print(f"preparada {pid}-rotulo.jpg  etiqueta {info['cobertura']}% da foto")
    renderizar(filtro)
    if "atelie".startswith(filtro) or filtro.startswith("atelie"):
        grade()


if __name__ == "__main__":
    main()
