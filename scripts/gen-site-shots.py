"""Gera as imagens da landing a partir de telas reais do app (dados de exemplo).

Saída: assets/site/tela-home.png, rotulo.png, inci.png, whatsapp.png, identidade.png
Uso:   python scripts/gen-site-shots.py
"""
import functools
import http.server
import io
import socketserver
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "assets" / "site"
LADO = 375  # viewport do app

SEMENTE = """() => {
  const s = (k, v) => localStorage.setItem('artesana_' + k, JSON.stringify(v));
  s('user', {logado: true, nome: 'Bibiana', marca: 'Flor de Sal', loginTipo: 'instagram'});
  s('onboarding', {nicho: 'sabonetes', historia: 'Comecei fazendo sabonetes pra família.', personalidade: 'delicada',
    publicoAlvo: 'mulheres que valorizam o natural', tipoProduto: 'Sabonete de lavanda',
    vistos: {identidade: true, social: true, rotulos: true}});
  s('instagram', {arroba: '@flordesal', perfisReferencia: []});
  s('whatsapp', {ddd: '11', numero: '900000000', mensagem: 'Olá! Quero fazer um pedido',
    link: 'https://wa.me/5511900000000?text=Ol%C3%A1!%20Quero%20fazer%20um%20pedido'});
  s('identidade', {itens: {paleta: true, logo: true, frase: false, endcard: false, fotos: false},
    arquivos: [{item: 'logo', nome: 'logo-flor-de-sal.png'}, {item: 'paleta', nome: 'paleta.pdf'}]});
  s('rotulos', {inciAlergenos: true,
    inci: [{pt: 'Óleo de oliva', inci: 'Olea Europaea Fruit Oil'}, {pt: 'Óleo de coco', inci: 'Cocos Nucifera Oil'},
           {pt: 'Manteiga de karité', inci: 'Butyrospermum Parkii Butter'},
           {pt: 'Óleo essencial de lavanda', inci: 'Lavandula Angustifolia Oil', alergenos: ['Linalool', 'Limonene']}],
    ultimoRotulo: {preset: 'red50', tipo: 'redondo', largura: 50, altura: 50, marca: 'Flor de Sal',
      produto: 'Sabonete de lavanda', frase: 'feito à mão com amor', peso: '90 g', fundo: '#FFF5EF',
      usarInci: false, usarQr: true}});
}"""


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def salvar(png: bytes, nome: str, largura: int) -> None:
    img = Image.open(io.BytesIO(png)).convert("RGB")
    alt = round(img.height * largura / img.width)
    img = img.resize((largura, alt), Image.LANCZOS)
    img.save(SAIDA / nome, optimize=True)
    print(f"{nome:20} {img.size} {(SAIDA / nome).stat().st_size // 1024} KB")


def quadrado(page, seletor: str, nome: str, lado: int, centrar: bool = False, folga: int = 12) -> None:
    """Recorta um quadrado de `lado` px CSS. centrar=True centraliza no elemento; senão alinha pelo topo dele."""
    box = page.locator(f"section[data-route].active {seletor}").first.bounding_box()
    y_pagina = box["y"] + page.evaluate("scrollY")
    if centrar:
        x = box["x"] + box["width"] / 2 - lado / 2
        y = y_pagina + box["height"] / 2 - lado / 2
    else:
        x = (LADO - lado) / 2
        y = y_pagina - folga
    x = min(max(0, x), LADO - lado)
    png = page.screenshot(full_page=True, clip={"x": x, "y": max(0, y), "width": lado, "height": lado})
    salvar(png, nome, 600)


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/app/"

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": LADO, "height": 812}, device_scale_factor=3, is_mobile=True,
                            has_touch=True, service_workers="block")
        page = ctx.new_page()
        page.goto(base + "#login", wait_until="networkidle")
        page.evaluate(SEMENTE)

        page.goto(base + "#home")
        page.wait_for_timeout(500)
        salvar(page.screenshot(), "tela-home.png", 540)

        page.add_style_tag(content=".tabbar{display:none!important}")
        for rota, seletor, nome, lado, centrar in [
            ("#rotulos", ".rot", "rotulo.png", 210, True),
            ("#rotulos/inci", ".sel-list", "inci.png", 300, False),
            ("#whatsapp", ".wa-result img", "whatsapp.png", 212, True),
            ("#identidade", ".list", "identidade.png", 340, False),
        ]:
            page.goto(base + rota)
            page.wait_for_timeout(500)
            quadrado(page, seletor, nome, lado, centrar)
        b.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
