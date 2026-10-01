"""Destaques do Instagram: capa (ícone no centro, pro círculo do perfil) e stories 1080x1920 de cada destaque.

Saída em marketing/instagram/destaques/: <destaque>-capa.jpg, <destaque>-N.jpg, telas/*.png (prints do app) e index.html.
Uso: python scripts/gen-destaques.py [nome-do-destaque]
Área segura dos stories (botões e barra do Instagram): 250px no topo, 340px embaixo, 120px nos lados. Texto nunca fora dela.
"""
import functools
import http.server
import io
import socketserver
import sys
import threading
import importlib.util
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram" / "destaques"
TELAS = PASTA / "telas"
LARG, ALT = 1080, 1920
SEGURO = {"topo": 250, "base": 340, "lado": 120}
APP = "https://artesana-mktdigital.com.br/app"

# ---------------------------------------------------------------- conteúdo
DESTAQUES = {
    "como-funciona": {
        "nome": "como funciona", "icone": "celular",
        "stories": [
            {"tipo": "tela", "rota": "home", "titulo": "Abre no celular,\nsem instalar nada.", "texto": "artesana-mktdigital.com.br/app\nFunciona offline depois do primeiro acesso.", "recado": "é grátis até 15/10/26"},
            {"tipo": "tela", "rota": "conversa/nome", "titulo": "1. Conta a sua história.", "texto": "Uma pergunta por tela. Pode falar em vez de digitar: todo campo tem microfone."},
            {"tipo": "tela", "rota": "rotulos", "titulo": "2. Monta o rótulo.", "texto": "Redondo, retangular ou tag. Sai em PDF pronto pra gráfica, com a lista INCI e os campos da Anvisa."},
            {"tipo": "tela", "rota": "whatsapp", "titulo": "3. Cria o link do WhatsApp.", "texto": "Link curto pra bio e QR code pro rótulo. A cliente toca e já cai na sua conversa."},
            {"tipo": "tela", "rota": "social", "titulo": "4. Legendas, calendário e fotos.", "texto": "Texto na voz da sua marca, o mês planejado com as datas que vendem e foto com a marca por cima."},
            {"tipo": "tela", "rota": "suporte", "titulo": "Travou? Tem ajuda.", "texto": "A tela Ajuda responde na hora. Se não souber, uma pessoa da equipe responde ali mesmo.", "recado": "sem número de telefone, sem fila"},
        ],
    },
    "pra-quem-e": {
        "nome": "pra quem é", "icone": "coracao",
        "stories": [
            {"tipo": "foto", "foto": "ia/costura.jpg", "titulo": "Pra quem faz à mão\ne vende sozinha.", "texto": "Produz, embala, fotografa, responde cliente. O app cuida da parte da marca."},
            {"tipo": "foto", "foto": "ia/kit.jpg", "titulo": "Sabonete, vela, cerâmica,\nbordado, crochê, doces.", "texto": "Cosmético natural também: o rótulo já sai com a lista INCI."},
            {"tipo": "foto", "foto": "ia/conversa.jpg", "titulo": "Pra quem vende\npelo WhatsApp.", "texto": "Link curto, QR no rótulo e mensagem pronta. Sem precisar de loja virtual."},
            {"tipo": "foto", "foto": "ia/domingo.jpg", "titulo": "Pra quem não tem\ntempo pro Instagram.", "texto": "Legendas e calendário do mês prontos. O domingo fica livre."},
            {"tipo": "foto", "foto": "ia/janela.jpg", "titulo": "Pra quem está\ncomeçando agora.", "texto": "Ainda sem Instagram? O app te leva passo a passo pra criar a conta."},
        ],
    },
    "planos": {
        "nome": "planos", "icone": "broto",
        "stories": [
            {"tipo": "texto", "titulo": "Grátis até\n15/10/26.", "texto": "Na versão beta tudo está liberado, pra todo mundo. Depois, cada conta escolhe o seu plano; quem não escolher fica no Semente, grátis.", "recado": "entra, testa, conta pra gente"},
            {"tipo": "plano", "emoji": "🌱", "nome": "Semente", "preco": "Grátis", "sub": "só o básico, pra começar", "itens": ["Link do WhatsApp com QR", "Lista INCI", "3 rótulos em PDF por mês"]},
            {"tipo": "plano", "emoji": "🌸", "nome": "Florescer", "preco": "R$ 52,90", "sub": "por mês", "itens": ["Tudo do Semente", "15 rótulos por mês, com os campos da Anvisa", "Logo, frase e end card", "Legendas e calendário do mês", "Editor de foto com a marca", "Análise do perfil e do público"]},
            {"tipo": "plano", "emoji": "🌳", "nome": "Prosperar", "preco": "12x de R$ 26", "sub": "R$ 312 por ano, ou R$ 279 à vista no PIX", "itens": ["Tudo do Florescer", "Rótulos sem limite", "Referências do Pinterest ligadas à conta", "Agenda e métricas", "Locução e roteiro de reels", "Atendimento com prioridade"], "destaque": "melhor valor: dá R$ 26 por mês"},
        ],
    },
    "duvidas": {
        "nome": "dúvidas", "icone": "pergunta",
        "stories": [
            {"tipo": "texto", "titulo": "Preciso ter CNPJ?", "texto": "Pra usar o app, não. No rótulo com os campos da Anvisa dá pra usar o CPF: ele sai como produto artesanal. Com CNPJ (o MEI serve) entram AFE e processo."},
            {"tipo": "texto", "titulo": "Onde ficam\nmeus dados?", "texto": "No seu aparelho. Só sai dele o que você manda pra equipe: o perfil, uma avaliação ou um pedido de ajuda."},
            {"tipo": "texto", "titulo": "Funciona\nsem internet?", "texto": "Sim, depois do primeiro acesso. E no computador também, com tudo que tem no celular."},
            {"tipo": "texto", "titulo": "O rótulo vale\npra Anvisa?", "texto": "O app organiza o rótulo com os campos que a norma pede. A regularização do produto e da empresa continua sendo um passo seu."},
            {"tipo": "texto", "titulo": "Como falo\ncom vocês?", "texto": "Pela tela Ajuda, dentro do app. A resposta aparece lá mesmo, na conversa.", "recado": "ou manda DM aqui"},
        ],
    },
}

ICONES = {
    "celular": '<rect x="62" y="22" width="76" height="156" rx="16"/><path d="M90 160h20"/><path d="M78 70h44M78 92h44M78 114h28"/>',
    "coracao": '<path d="M100 168 C 44 124, 22 86, 48 56 C 68 36, 94 44, 100 66 C 106 44, 132 36, 152 56 C 178 86, 156 124, 100 168 Z"/>',
    "broto": '<path d="M100 178 V 96"/><path d="M100 118 C 100 80, 72 60, 40 62 C 42 96, 66 118, 100 118 Z"/><path d="M100 98 C 100 62, 128 42, 160 44 C 158 78, 134 98, 100 98 Z"/>',
    "pergunta": '<path d="M70 72 C 70 44, 130 40, 130 74 C 130 96, 100 100, 100 124"/><circle cx="100" cy="156" r="6" fill="#4A6348" stroke="none"/>',
}

CABECA = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,9..144,300..700,0..100,0..1&family=Homemade+Apple&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #FFF5EF; }
body { font-family: 'Poppins', sans-serif; color: #2C1A1E; -webkit-font-smoothing: antialiased; }
.peca { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #FFF5EF; }
.foto { position: absolute; inset: 0; }
.foto img { width: 1080px; height: 1920px; object-fit: cover; display: block; filter: saturate(0.9) contrast(0.98) brightness(1.02) sepia(0.06); }
.veu { position: absolute; left: 0; right: 0; bottom: 0; height: 1100px; background: linear-gradient(180deg, rgba(44,26,30,0) 0%, rgba(44,26,30,0.55) 45%, rgba(44,26,30,0.78) 100%); }
.texto { position: absolute; left: 120px; right: 120px; }
.titulo { margin: 0; font-family: 'Fraunces', serif; font-weight: 400; font-variation-settings: 'SOFT' 100; font-size: 74px; line-height: 1.06; letter-spacing: -0.02em; white-space: pre-line; }
.corpo { margin: 26px 0 0; font-size: 34px; line-height: 1.4; font-weight: 400; white-space: pre-line; }
.recado { margin: 22px 0 0; font-family: 'Homemade Apple', cursive; font-size: 40px; line-height: 1.3; color: #4A6348; }
.claro .titulo, .claro .corpo { color: #FFF5EF; text-shadow: 0 2px 20px rgba(44,26,30,0.5); }
.claro .recado { color: #FFD9C4; text-shadow: 0 2px 16px rgba(44,26,30,0.6); }
.base { bottom: 400px; }
.alto { top: 300px; }
.fone { position: absolute; left: 230px; top: 760px; width: 620px; border: 14px solid #2C1A1E; border-radius: 64px; background: #fff; overflow: hidden; box-shadow: 0 40px 70px -30px rgba(44,26,30,0.55); }
.fone img { width: 100%; display: block; }
.selo { position: absolute; left: 120px; top: 262px; font-size: 26px; font-weight: 500; letter-spacing: 0.02em; color: #7A4A2A; }
.cartao { position: absolute; left: 120px; right: 120px; top: 470px; background: #fff; border-radius: 48px; padding: 70px 70px 64px; box-shadow: 0 30px 60px -30px rgba(44,26,30,0.35); }
.cartao .nome { margin: 0; font-family: 'Fraunces', serif; font-weight: 500; font-size: 64px; letter-spacing: -0.02em; }
.cartao .preco { margin: 18px 0 0; font-family: 'Fraunces', serif; font-weight: 400; font-size: 84px; line-height: 1; letter-spacing: -0.03em; }
.cartao .sub { margin: 10px 0 0; font-size: 30px; color: #6B5A5E; }
.cartao ul { margin: 44px 0 0; padding: 0; list-style: none; }
.cartao li { font-size: 34px; line-height: 1.35; padding: 10px 0 10px 54px; position: relative; }
.cartao li::before { content: ''; position: absolute; left: 6px; top: 24px; width: 22px; height: 12px; border-left: 5px solid #4A6348; border-bottom: 5px solid #4A6348; transform: rotate(-45deg); }
.etiqueta { display: inline-block; margin-top: 34px; background: #FFB18B; color: #2C1A1E; font-weight: 600; font-size: 28px; padding: 12px 26px; border-radius: 999px; }
.faixa { position: absolute; left: 0; right: 0; top: 0; height: 560px; background: #FFB18B; }
.faixa-baixo { position: absolute; left: 0; right: 0; bottom: 0; height: 320px; background: #FFB18B; }
.capa-circulo { position: absolute; left: 190px; top: 610px; width: 700px; height: 700px; border-radius: 50%; border: 8px solid #4A6348; background: #FFF5EF; display: grid; place-items: center; }
.capa-circulo svg { width: 360px; height: 360px; fill: none; stroke: #4A6348; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }
.capa-nome { position: absolute; left: 0; right: 0; top: 1370px; text-align: center; font-family: 'Fraunces', serif; font-size: 56px; letter-spacing: -0.02em; color: #2C1A1E; }
</style></head><body>"""


def pagina_story(s: dict, nome: str) -> str:
    recado = f'<p class="recado">{s["recado"]}</p>' if s.get("recado") else ""
    if s["tipo"] == "foto":
        return (f'{CABECA}<div class="peca claro"><div class="foto"><img src="../{s["foto"]}"></div><div class="veu"></div>'
                f'<div class="texto base"><p class="titulo">{s["titulo"]}</p><p class="corpo">{s["texto"]}</p>{recado}</div></div></body></html>')
    if s["tipo"] == "tela":
        return (f'{CABECA}<div class="peca"><div class="faixa"></div><div class="selo">{nome}</div>'
                f'<div class="texto" style="top:330px"><p class="titulo" style="font-size:66px">{s["titulo"]}</p><p class="corpo" style="font-size:31px">{s["texto"]}</p>{recado}</div>'
                f'<div class="fone"><img src="./telas/{s["rota"].replace("/", "_")}.png"></div></div></body></html>')
    if s["tipo"] == "plano":
        itens = "".join(f"<li>{i}</li>" for i in s["itens"])
        etiqueta = f'<span class="etiqueta">{s["destaque"]}</span>' if s.get("destaque") else ""
        return (f'{CABECA}<div class="peca"><div class="faixa-baixo"></div><div class="selo">{nome}</div>'
                f'<div class="cartao"><p class="nome">{s["emoji"]} {s["nome"]}</p><p class="preco">{s["preco"]}</p><p class="sub">{s["sub"]}</p><ul>{itens}</ul>{etiqueta}</div></div></body></html>')
    return (f'{CABECA}<div class="peca"><div class="faixa-baixo"></div><div class="selo">{nome}</div>'
            f'<div class="texto" style="top:560px"><p class="titulo" style="font-size:92px">{s["titulo"]}</p><p class="corpo" style="font-size:38px;margin-top:40px">{s["texto"]}</p>{recado}</div></div></body></html>')


def pagina_capa(d: dict) -> str:
    return (f'{CABECA}<div class="peca"><div class="capa-circulo"><svg viewBox="0 0 200 200">{ICONES[d["icone"]]}</svg></div>'
            f'<div class="capa-nome">{d["nome"]}</div></div></body></html>')


# ---------------------------------------------------------------- prints do app
def prints_do_app(navegador, base: str, rotas) -> None:
    spec = importlib.util.spec_from_file_location("shots", RAIZ / "scripts" / "gen-site-shots.py")
    shots = importlib.util.module_from_spec(spec); spec.loader.exec_module(shots)
    ctx = navegador.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=3, is_mobile=True, has_touch=True, service_workers="block")
    page = ctx.new_page()
    page.goto(f"{base}/app/#login", wait_until="networkidle")
    page.evaluate(shots.SEMENTE)
    page.evaluate("localStorage.setItem('artesana_user', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('artesana_user')), {redes: {instagram: true, facebook: false}})))")
    for rota in rotas:
        destino = TELAS / f"{rota.replace('/', '_')}.png"
        page.goto(f"{base}/app/#{rota}")
        page.wait_for_timeout(700)
        page.add_style_tag(content=".fab-beta{display:none!important}")
        if rota.startswith("conversa"):
            page.fill("section[data-route=conversa] input", "Maria")
        page.wait_for_timeout(200)
        Image.open(io.BytesIO(page.screenshot())).convert("RGB").save(destino, optimize=True)
        print(f"  tela {destino.name}")
    ctx.close()


class _Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def conferir_area_segura(page, nome: str) -> None:
    caixas = page.evaluate("""() => [...document.querySelectorAll('.titulo, .corpo, .recado, .selo, .cartao, .capa-circulo')].map(e => {
        const r = e.getBoundingClientRect(); return [e.className, r.left, r.top, r.right, r.bottom]; })""")
    for classe, x0, y0, x1, y1 in caixas:
        assert x0 >= SEGURO["lado"] - 1 and x1 <= LARG - SEGURO["lado"] + 1, f"{nome}: {classe} fora da margem lateral ({x0:.0f}..{x1:.0f})"
        assert y0 >= SEGURO["topo"] - 1 and y1 <= ALT - SEGURO["base"] + 1, f"{nome}: {classe} na área dos botões ({y0:.0f}..{y1:.0f})"


def renderizar(filtro: str) -> list[tuple[str, list[str]]]:
    PASTA.mkdir(parents=True, exist_ok=True)
    TELAS.mkdir(exist_ok=True)
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(_Quieto, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    saida = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        rotas = sorted({s["rota"] for d in DESTAQUES.values() for s in d["stories"] if s["tipo"] == "tela"})
        prints_do_app(b, base, rotas)
        page = b.new_page(viewport={"width": LARG, "height": ALT}, device_scale_factor=1)
        for chave, d in DESTAQUES.items():
            if filtro and not chave.startswith(filtro):
                continue
            arquivos = []
            paginas = [(f"{chave}-capa", pagina_capa(d))] + [(f"{chave}-{i + 1}", pagina_story(s, d["nome"])) for i, s in enumerate(d["stories"])]
            for nome, html in paginas:
                (PASTA / f"{nome}.html").write_text(html, encoding="utf-8", newline="\n")
                falhas = []
                page.on("requestfailed", lambda r: falhas.append(r.url))
                page.goto(f"{base}/marketing/instagram/destaques/{nome}.html", wait_until="networkidle")
                page.evaluate("document.fonts.ready")
                page.wait_for_timeout(400)
                assert not falhas, f"{nome}: não carregou {falhas}"
                conferir_area_segura(page, nome)
                png = page.screenshot(clip={"x": 0, "y": 0, "width": LARG, "height": ALT})
                Image.open(io.BytesIO(png)).convert("RGB").save(PASTA / f"{nome}.jpg", quality=92, optimize=True)
                (PASTA / f"{nome}.html").unlink()
                arquivos.append(f"{nome}.jpg")
                print(f"{nome}.jpg")
            saida.append((chave, arquivos))
        b.close()
    srv.shutdown()
    return saida


PAGINA = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>artesaná. destaques do Instagram</title>
<style>
body { margin: 0; font-family: Poppins, system-ui, sans-serif; background: #FFF5EF; color: #2C1A1E; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }
h1 { font-family: Georgia, serif; font-weight: 500; font-size: 30px; margin: 0 0 6px; }
h2 { font-family: Georgia, serif; font-weight: 500; font-size: 22px; margin: 34px 0 10px; }
p { line-height: 1.5; }
.fila { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; }
.fila figure { margin: 0; flex: 0 0 auto; width: 180px; text-align: center; font-size: 12px; }
.fila img { width: 180px; border-radius: 12px; box-shadow: 0 2px 10px rgba(44,26,30,.12); display: block; }
.fila .capa img { border-radius: 50%; width: 150px; margin: 0 auto 8px; object-fit: cover; aspect-ratio: 1; object-position: center; }
a { color: #4A6348; }
ol { line-height: 1.6; }
</style></head><body><div class="wrap">
<h1>Destaques do perfil</h1>
<p>Cada destaque tem uma capa (fica redonda no perfil) e os stories na ordem. Toque na imagem pra abrir em tamanho cheio e salvar.</p>
<ol>
<li>Publique os stories do destaque, um atrás do outro, na ordem.</li>
<li>No perfil, toque em <b>Novo</b> (destaques), escolha esses stories e dê o nome indicado.</li>
<li>Em <b>Editar capa</b>, escolha a imagem de capa do destaque (ela já vem centralizada).</li>
</ol>
__CORPO__
<p><a href="../">Voltar pros posts</a></p>
</div></body></html>"""


def pagina_indice(saida) -> None:
    import hashlib
    blocos = []
    for chave, arquivos in saida:
        d = DESTAQUES[chave]
        v = lambda a: hashlib.sha1((PASTA / a).read_bytes()).hexdigest()[:8]
        figs = [f'<figure class="capa"><a href="./{arquivos[0]}?v={v(arquivos[0])}"><img src="./{arquivos[0]}?v={v(arquivos[0])}" alt=""></a><figcaption>capa</figcaption></figure>']
        figs += [f'<figure><a href="./{a}?v={v(a)}"><img src="./{a}?v={v(a)}" alt=""></a><figcaption>story {i + 1}</figcaption></figure>' for i, a in enumerate(arquivos[1:])]
        blocos.append(f'<h2>Destaque "{d["nome"]}"</h2><div class="fila">{"".join(figs)}</div>')
    (PASTA / "index.html").write_text(PAGINA.replace("__CORPO__", "\n".join(blocos)), encoding="utf-8", newline="\n")
    print("index.html")


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    saida = renderizar(filtro)
    if not filtro:
        pagina_indice(saida)


if __name__ == "__main__":
    main()
