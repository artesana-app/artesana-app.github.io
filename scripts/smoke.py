"""Smoke test: abre a landing e todas as rotas do app num Chromium 375x812 e falha em erro de console.

Uso:
  python scripts/smoke.py                      # sobe http.server local na raiz do repo
  python scripts/smoke.py --base https://artesana-mktdigital.com.br
"""
import argparse
import functools
import http.server
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
ROTAS = [
    "home", "social", "rotulos", "fotos", "mais", "identidade", "feedback", "inpi",
    "perfil", "planos", "config", "whatsapp", "meta", "tutorial-meta", "detalhe/logo-ia",
]


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):  # silencia o log de requisições
        pass


def servir_local():
    handler = functools.partial(_Quieto, directory=str(RAIZ))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=None, help="URL base (sem barra final). Sem isso, sobe servidor local.")
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()

    srv = None
    base = args.base.rstrip("/") if args.base else None
    if not base:
        srv, base = servir_local()

    erros: list[str] = []
    falhas: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        ctx = browser.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        page.on("console", lambda m: erros.append(f"console.{m.type}: {m.text}") if m.type == "error" and "ERR_FAILED" not in m.text else None)
        page.on("pageerror", lambda e: erros.append(f"pageerror: {e}"))

        # landing
        page.goto(f"{base}/", wait_until="networkidle")
        if not page.locator("h1").count():
            falhas.append("landing sem <h1>")

        # página dos links curtos de WhatsApp (não deixa sair navegando pro wa.me)
        ctx.route("**/wa.me/**", lambda r: r.abort())
        page.goto(f"{base}/w/?flor-de-sal-11900000000-m1", wait_until="domcontentloaded")
        page.wait_for_timeout(300)
        if "Flor de Sal" not in (page.locator("#titulo").inner_text() or ""):
            falhas.append("/w/ não identificou a marca do link curto")
        if not (page.locator("#abrir").get_attribute("href") or "").startswith("https://wa.me/5511900000000"):
            falhas.append("/w/ não montou o destino do WhatsApp")

        # app: login
        page.goto(f"{base}/app/#login", wait_until="networkidle")
        if not page.locator("section[data-route=login].active").count():
            falhas.append("tela de login não ativou")
        page.evaluate("localStorage.setItem('artesana_user', JSON.stringify({logado:true,nome:'Teste',marca:'Marca Teste',loginTipo:'email'}))")

        for rota in ROTAS:
            page.goto(f"{base}/app/#{rota}")
            page.wait_for_timeout(250)
            nome = rota.split("/")[0]
            sec = page.locator(f"section[data-route='{nome}'].active")
            if not sec.count():
                falhas.append(f"#{rota}: section não ativou")
                continue
            if len((sec.inner_text() or "").strip()) < 3:
                falhas.append(f"#{rota}: section vazia")

        browser.close()
    if srv:
        srv.shutdown()

    for e in erros:
        print("ERRO", e)
    for f in falhas:
        print("FALHA", f)
    ok = not erros and not falhas
    print("SMOKE", "OK" if ok else "FALHOU", f"({len(ROTAS)} rotas + landing em {base})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
