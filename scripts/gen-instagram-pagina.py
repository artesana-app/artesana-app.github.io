"""Monta a página de entrega das publicações a partir de marketing/instagram/publicacoes.json.

Saída em marketing/instagram/:
  index.html    página pra baixar as imagens e copiar os textos
  legendas.txt  os mesmos textos em texto puro, abre no Bloco de Notas
  legendas.md   os mesmos textos pra ler no repositório

Uso: python scripts/gen-instagram-pagina.py
"""
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"
sys.path.insert(0, str(RAIZ / "scripts"))


def versao(arq):
    """Sufixo de versão pro navegador não mostrar uma imagem antiga guardada: muda quando o arquivo muda."""
    import hashlib
    return hashlib.sha256((PASTA / arq).read_bytes()).hexdigest()[:8]


def creditos():
    """Lê a tabela de créditos do gerador de imagens, sem executar o gerador."""
    fonte = (RAIZ / "scripts" / "gen-instagram.py").read_text(encoding="utf-8")
    return re.findall(r'^\s+(\d+): \("([^"]+)", "([^"]*)", "([^"]+)"\),', fonte, re.M)


PAGINA = """<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>artesaná. publicações do Instagram</title>
  <link rel="icon" href="../../assets/brand/icon-192.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lexend+Exa:wght@400&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../app/css/variables.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: var(--font); font-size: 15px; line-height: 1.55; color: var(--ink); background: var(--white); }
    img { display: block; max-width: 100%; height: auto; }
    h1, h2, h3, p { margin: 0; }
    :focus-visible { outline: 2px solid var(--moss); outline-offset: 3px; }
    .wrap { width: min(100% - 40px, 1080px); margin-inline: auto; }
    .topo { border-bottom: 1px solid #ECE4DE; padding-block: 18px; }
    .topo .wrap { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .wordmark { font-size: 30px; letter-spacing: -0.04em; line-height: 1; color: var(--peach-d); text-decoration: none; }
    .wordmark b { font-weight: 700; }
    .topo span { font-family: 'Lexend Exa', sans-serif; font-size: 12.5px; letter-spacing: 0.02em; }
    .intro { padding-block: 36px 8px; }
    .intro h1 { font-size: clamp(26px, 4vw, 38px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; }
    .intro p { margin-top: 10px; max-width: 62ch; color: var(--ink-2); }
    .peca { padding-block: 36px; border-bottom: 1px solid #ECE4DE; }
    .peca h2 { font-family: 'Lexend Exa', sans-serif; font-weight: 400; font-size: 17px; letter-spacing: 0.04em; }
    .peca .como { margin: 6px 0 18px; color: var(--ink-2); font-size: 14px; }
    .peca h3 { font-size: 13px; font-weight: 600; margin: 22px 0 8px; }
    .imagens { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 18px; align-items: start; }
    .imagens figure { margin: 0; }
    .imagens figcaption { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .imagens img { border-radius: 4px; border: 1px solid #ECE4DE; }
    .caixa { white-space: pre-wrap; font-family: var(--font); font-size: 14.5px; line-height: 1.55; margin: 0; padding: 16px; max-width: 780px; background: var(--cream); border: 1px solid #ECE4DE; border-radius: 4px; }
    .acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .botao { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border-radius: 4px; border: 1px solid var(--moss); background: var(--moss); color: var(--white); font: inherit; font-weight: 600; font-size: 14px; text-decoration: none; cursor: pointer; }
    .botao:hover { background: var(--moss-d); }
    .botao.claro { background: var(--white); color: var(--ink); border-color: var(--ink); }
    .botao.claro:hover { background: var(--cream); }
    .imagens .botao { width: 100%; padding: 0 8px; }
    .campos { display: grid; gap: 14px; max-width: 780px; }
    .campos .caixa { padding: 12px 14px; }
    .campos b { display: block; font-size: 13px; margin-bottom: 6px; }
    details { margin-top: 12px; max-width: 780px; }
    summary { cursor: pointer; font-size: 13px; font-weight: 600; min-height: 40px; display: flex; align-items: center; }
    details .caixa { margin-bottom: 10px; font-size: 13.5px; }
    .secao { font-size: clamp(20px, 3vw, 26px); font-weight: 600; letter-spacing: -0.02em; margin-top: 48px; }
    .secao + p { color: var(--ink-2); margin-top: 6px; }
    .grade { margin: 24px 0 0; max-width: 420px; }
    .grade img { border: 1px solid #ECE4DE; border-radius: 4px; }
    .grade figcaption { margin-top: 8px; font-size: 13px; color: var(--ink-2); }
    .antigas { max-width: none; margin-top: 40px; }
    .antigas > summary { font-size: 17px; }
    .antigas > p { color: var(--ink-2); font-size: 14px; }
    .calendario { width: 100%; max-width: 780px; border-collapse: collapse; font-size: 14px; margin: 14px 0 6px; }
    .calendario th, .calendario td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ECE4DE; vertical-align: top; }
    .calendario th { font-family: 'Lexend Exa', sans-serif; font-weight: 400; font-size: 12px; letter-spacing: 0.04em; }
    .imagens video { width: 100%; border-radius: 4px; border: 1px solid #ECE4DE; background: #000; }
    .fim { padding-block: 28px 48px; font-size: 13px; color: var(--ink-2); }
  </style>
</head>
<body>
  <header class="topo"><div class="wrap"><a class="wordmark" href="../../">artesaná<b>.</b></a><span>Instagram @artesana.app</span></div></header>
  <main class="wrap">
    <section class="intro">
      <h1>Publicações prontas</h1>
      <p>Baixe as imagens e os vídeos, copie a legenda e publique. Todas as imagens são geradas por IA: ao publicar, ative o rótulo de IA do Instagram. O guia do estilo, com as ideias de foto pra você fazer em casa, está em <a href="./estilo.html">estilo.html</a>.</p>
      <figure class="grade">
        <img src="./grade-perfil.jpg?v=__GRADE__" alt="Prévia das publicações na grade do perfil, a mais nova em cima à esquerda.">
        <figcaption>Prévia da grade do perfil com tudo publicado</figcaption>
      </figure>
    </section>
__SERIES__
__BIO__
    <details class="antigas">
      <summary>Peças anteriores</summary>
      <p>Saíram da linha do perfil. Ficam guardadas aqui, caso você queira consultar.</p>
__ANTIGAS__
    </details>
    <p class="fim">As imagens da série ateliê foram geradas por inteligência artificial. As pessoas que aparecem nelas não existem. As peças anteriores usam fotos do banco Pexels, com licença livre para uso comercial.</p>
  </main>
  <script>
    document.querySelectorAll('[data-copiar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var texto = document.getElementById(botao.dataset.copiar).textContent;
        var original = botao.textContent;
        var feito = function () { botao.textContent = 'Copiado'; setTimeout(function () { botao.textContent = original; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(feito, function () { reserva(texto); feito(); });
        } else { reserva(texto); feito(); }
      });
    });
    function reserva(texto) {
      var ta = document.createElement('textarea');
      ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
  </script>
</body>
</html>
"""


def bloco(p):
    n = p["id"]
    e = html.escape
    figuras = ""
    for im in p["imagens"]:
        arq = im["arquivo"]
        assert (PASTA / arq).exists(), f"falta a imagem {arq}"
        if im.get("video"):
            capa = arq.replace("-reel.mp4", "-capa.jpg")
            midia = f'          <video src="./{arq}" poster="./{capa}" controls muted playsinline preload="metadata" aria-label="{e(im["alt"], quote=True)}"></video>\n'
        else:
            midia = f'          <img src="./{arq}" alt="{e(im["alt"], quote=True)}" loading="lazy">\n'
        figuras += (f'        <figure>\n          <figcaption>{e(im["rotulo"])}</figcaption>\n' + midia
                    + f'          <div class="acoes"><a class="botao" href="./{arq}" download="artesana-{arq}">Baixar</a></div>\n        </figure>\n')
    cabeca = e(p.get("rotulo") or str(n))
    s = f'    <article class="peca" id="p{n}">\n      <h2>{cabeca}: {e(p["titulo"])}</h2>\n'
    if p.get("como"):
        s += f'      <p class="como">{e(p["como"])}</p>\n'
    s += f'      <div class="imagens">\n{figuras}      </div>\n'
    if p.get("legenda"):
        s += (f'      <h3>Legenda</h3>\n      <pre class="caixa" id="legenda-{n}">{e(p["legenda"])}</pre>\n'
              f'      <div class="acoes"><button class="botao" type="button" data-copiar="legenda-{n}">Copiar legenda</button></div>\n')
    if p.get("textos"):
        s += '      <h3>Textos do anúncio</h3>\n      <div class="campos">\n'
        for i, t in enumerate(p["textos"]):
            s += (f'        <div><b>{e(t["campo"])}</b><pre class="caixa" id="txt-{n}-{i}">{e(t["valor"])}</pre>\n'
                  f'          <div class="acoes"><button class="botao claro" type="button" data-copiar="txt-{n}-{i}">Copiar</button></div></div>\n')
        s += '      </div>\n'
    s += '      <details>\n        <summary>Texto alternativo das imagens</summary>\n'
    for i, im in enumerate(p["imagens"]):
        s += (f'        <pre class="caixa" id="alt-{n}-{i}">{e(im["alt"])}</pre>\n')
    s += '      </details>\n    </article>\n'
    return s


SERIES = {
    "fimdeano": ("Fim de ano: sete dias, de 1 a 7 de outubro",
                 "Natal, Ano Novo e festas, misturando post único, carrossel e reel. Uma por dia, na ordem da tabela. Os reels saem sem áudio: escolha a música na biblioteca do Instagram na hora de publicar."),
    "atelie": ("Série ateliê: seis peças prontas", "Imagem realista de quem faz à mão, frase curta e recado escrito à mão. Se ainda não publicou, vá na ordem, da 1 à 6."),
}


def calendario(pubs):
    linhas = "".join(f'<tr><td>{html.escape(p["rotulo"].split(" · ")[0])}</td><td>{html.escape(p["rotulo"].split(" · ")[1])}</td>'
                     f'<td>{html.escape(p["rotulo"].split(" · ")[2])}</td><td><a href="#p{p["id"]}">{html.escape(p["titulo"])}</a></td></tr>' for p in pubs)
    return f'    <table class="calendario"><thead><tr><th>Dia</th><th>Data</th><th>Formato</th><th>Tema</th></tr></thead><tbody>{linhas}</tbody></table>\n'


def secoes(pubs):
    s = ""
    for chave, (titulo, intro) in SERIES.items():
        lista = [p for p in pubs if p.get("serie") == chave]
        if not lista:
            continue
        s += f'    <h2 class="secao" id="{chave}">{html.escape(titulo)}</h2>\n    <p>{html.escape(intro)}</p>\n'
        if chave == "fimdeano":
            s += calendario(lista)
        s += "".join(bloco(p) for p in lista)
    return s


def md_para_html(md):
    """Conversor mínimo pro estilo.md: títulos, listas, parágrafos e código entre crases."""
    saida, lista = [], False
    for linha in md.splitlines():
        t = html.escape(linha.rstrip())
        t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
        if t.startswith("- "):
            if not lista:
                saida.append("<ul>"); lista = True
            saida.append(f"<li>{t[2:]}</li>")
            continue
        if lista:
            saida.append("</ul>"); lista = False
        if t.startswith("# "):
            saida.append(f"<h1>{t[2:]}</h1>")
        elif t.startswith("## "):
            saida.append(f"<h2>{t[3:]}</h2>")
        elif t:
            saida.append(f"<p>{t}</p>")
    if lista:
        saida.append("</ul>")
    return "\n".join(saida)


ESTILO_PAGINA = """<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Estilo das publicações</title>
  <link rel="icon" href="../../assets/brand/icon-192.png">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../app/css/variables.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: var(--font); font-size: 15px; line-height: 1.6; color: var(--ink); background: var(--white); }
    .wrap { width: min(100% - 40px, 760px); margin-inline: auto; padding: 28px 0 60px; }
    .wordmark { font-size: 26px; letter-spacing: -0.04em; color: var(--peach-d); text-decoration: none; }
    .wordmark b { font-weight: 700; }
    h1 { font-size: clamp(26px, 4vw, 36px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; margin: 22px 0 10px; }
    h2 { font-size: 19px; font-weight: 600; margin: 30px 0 8px; }
    p { margin: 0 0 10px; } ul { padding-left: 20px; margin: 0 0 12px; } li { margin-bottom: 6px; }
    code { font-family: Consolas, monospace; font-size: 13px; background: var(--cream); padding: 1px 5px; border-radius: 3px; }
    a { color: var(--moss); }
  </style>
</head>
<body><div class="wrap"><a class="wordmark" href="./">artesaná<b>.</b></a>
__CORPO__
<p><a href="./">Voltar às publicações</a></p>
</div></body>
</html>
"""


def contar(texto):
    """Conta como o Instagram: emoji vale dois."""
    return len(texto.encode("utf-16-le")) // 2


def bloco_bio(bio):
    e = html.escape
    s = ('    <article class="peca" id="bio">\n      <h2>Bio do perfil</h2>\n'
         '      <p class="como">Em Editar perfil, cole cada texto no campo de mesmo nome. A bio aceita até 150 caracteres.</p>\n'
         '      <div class="campos">\n')
    campos = [("Nome", bio["nome"]), ("Categoria", bio["categoria"]), ("Link", bio["link"])]
    campos += [(f"Bio, opção {i + 1}: {o['titulo'].lower()} ({contar(o['texto'])} caracteres)", o["texto"]) for i, o in enumerate(bio["opcoes"])]
    for i, (campo, valor) in enumerate(campos):
        s += (f'        <div><b>{e(campo)}</b><pre class="caixa" id="bio-{i}">{e(valor)}</pre>\n'
              f'          <div class="acoes"><button class="botao claro" type="button" data-copiar="bio-{i}">Copiar</button></div></div>\n')
    return s + '      </div>\n    </article>\n'


def bio_em_texto(bio):
    linhas = ["=" * 64, "BIO DO PERFIL", "=" * 64, "", "NOME", bio["nome"], "", "CATEGORIA", bio["categoria"], "", "LINK", bio["link"], ""]
    for i, o in enumerate(bio["opcoes"]):
        linhas += [f"BIO, OPÇÃO {i + 1}: {o['titulo'].upper()} ({contar(o['texto'])} caracteres)", o["texto"], ""]
    return "\n".join(linhas) + "\n\n"


def texto_puro(pubs):
    linhas = ["artesaná. Instagram @artesana.app", "Fim de ano: uma publicação por dia, de 1 a 7 de outubro (d1 a d7). Série ateliê: peças 1 a 6.", ""]
    for p in pubs:
        estado = " (peça anterior)" if p.get("arquivada") else ""
        linhas += ["=" * 64, f"{p.get('rotulo') or p['id']}: {p['titulo']}{estado}", "Imagens: " + ", ".join(im["arquivo"] for im in p["imagens"])]
        if p.get("como"):
            linhas.append(p["como"])
        linhas += ["=" * 64, ""]
        if p.get("legenda"):
            linhas += ["LEGENDA", "", p["legenda"], ""]
        for t in p.get("textos", []):
            linhas += [t["campo"].upper(), t["valor"], ""]
        linhas += ["TEXTO ALTERNATIVO"]
        for im in p["imagens"]:
            linhas += [f"{im['arquivo']}: {im['alt']}"]
        linhas += ["", ""]
    return "\n".join(linhas)


def markdown(pubs):
    s = "# Instagram @artesana.app\n\nGerado de `publicacoes.json` por `python scripts/gen-instagram-pagina.py`. Edite o JSON, não este arquivo.\n\n"
    for p in pubs:
        estado = " (peça anterior)" if p.get("arquivada") else ""
        s += f"## {p['id']}. {p['titulo']}{estado}\n\n"
        if p.get("como"):
            s += p["como"] + "\n\n"
        s += "Imagens: " + ", ".join(f"`{im['arquivo']}`" for im in p["imagens"]) + "\n\n"
        if p.get("legenda"):
            s += "**Legenda**\n\n" + p["legenda"] + "\n\n"
        for t in p.get("textos", []):
            s += f"**{t['campo']}:** {t['valor']}\n\n"
        s += "**Texto alternativo**\n\n" + "\n".join(f"- `{im['arquivo']}`: {im['alt']}" for im in p["imagens"]) + "\n\n---\n\n"
    s += ("## Imagens da série ateliê\n\nGeradas por inteligência artificial, com o modelo RealVisXL V5.0 (licença OpenRAIL++). As pessoas que aparecem nelas não existem. O texto que gerou cada imagem e a semente usada estão em `ia/cenas.json`, e `scripts/gen-fotos-ia.py` gera de novo. Ao publicar, ative o rótulo de IA do Instagram.\n\n## Fotos das peças anteriores\n\nBanco Pexels, licença livre para uso comercial, sem obrigação de crédito. As pessoas são modelos de banco de imagem: "
          "a licença não permite dar a entender que elas usam ou recomendam o produto, por isso nenhum texto das peças está em forma de depoimento. "
          "Nenhuma foto mostra marca de terceiros.\n\n| Peça | Autor | Página |\n|---|---|---|\n")
    for _, uso, autor, url in creditos():
        s += f"| {uso} | {autor} | {url} |\n"
    return s


def main() -> None:
    pubs = json.loads((PASTA / "publicacoes.json").read_text(encoding="utf-8"))
    novas = [p for p in pubs if not p.get("arquivada")]
    antigas = [p for p in pubs if p.get("arquivada")]
    bio = json.loads((PASTA / "bio.json").read_text(encoding="utf-8"))
    for o in bio["opcoes"]:
        assert contar(o["texto"]) <= 150, f"bio {o['titulo']} com {contar(o['texto'])} caracteres"
    pagina = PAGINA.replace("__GRADE__", versao("grade-perfil.jpg")).replace("__BIO__", bloco_bio(bio)).replace("__SERIES__", secoes(novas)).replace("__ANTIGAS__", "".join(bloco(p) for p in antigas))
    (PASTA / "index.html").write_text(pagina, encoding="utf-8", newline="\n")
    estilo = md_para_html((PASTA / "estilo.md").read_text(encoding="utf-8"))
    (PASTA / "estilo.html").write_text(ESTILO_PAGINA.replace("__CORPO__", estilo), encoding="utf-8", newline="\n")
    (PASTA / "legendas.txt").write_text((bio_em_texto(bio) + texto_puro(pubs)).replace("\n", "\r\n"), encoding="utf-8-sig", newline="")
    (PASTA / "legendas.md").write_text(markdown(pubs), encoding="utf-8", newline="\n")
    for p in pubs:
        print(p["id"], "anterior" if p.get("arquivada") else p.get("serie", "série"), len(p["imagens"]), "imagens |", p["titulo"])
    print("gerados: index.html, estilo.html, legendas.txt, legendas.md")


if __name__ == "__main__":
    main()
