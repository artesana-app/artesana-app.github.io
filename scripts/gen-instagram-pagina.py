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
    .fim { padding-block: 28px 48px; font-size: 13px; color: var(--ink-2); }
  </style>
</head>
<body>
  <header class="topo"><div class="wrap"><a class="wordmark" href="../../">artesaná<b>.</b></a><span>Instagram @artesana.app</span></div></header>
  <main class="wrap">
    <section class="intro">
      <h1>Publicações novas</h1>
      <p>Baixe as imagens, copie o texto e publique. Todas seguem o padrão das que já estão no perfil: foto inteira, frase curta e a marca pequena.</p>
    </section>
__NOVAS__
    <h2 class="secao">Já publicadas</h2>
    <p>Ficam aqui com a alternativa de cada uma, caso você queira reaproveitar.</p>
__ANTIGAS__
    <p class="fim">Fotos do banco Pexels, com licença livre para uso comercial.</p>
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
        figuras += (f'        <figure>\n          <figcaption>{e(im["rotulo"])}</figcaption>\n'
                    f'          <img src="./{arq}" alt="{e(im["alt"], quote=True)}" loading="lazy">\n'
                    f'          <div class="acoes"><a class="botao" href="./{arq}" download="artesana-{arq}">Baixar</a></div>\n        </figure>\n')
    s = f'    <article class="peca" id="p{n}">\n      <h2>{n}. {e(p["titulo"])}</h2>\n'
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


def texto_puro(pubs):
    linhas = ["artesaná. — Instagram @artesana.app", ""]
    for p in pubs:
        estado = " (já publicada)" if p.get("publicada") else ""
        linhas += ["=" * 64, f"{p['id']}. {p['titulo']}{estado}", "Imagens: " + ", ".join(im["arquivo"] for im in p["imagens"])]
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
        estado = " (já publicada)" if p.get("publicada") else ""
        s += f"## {p['id']}. {p['titulo']}{estado}\n\n"
        if p.get("como"):
            s += p["como"] + "\n\n"
        s += "Imagens: " + ", ".join(f"`{im['arquivo']}`" for im in p["imagens"]) + "\n\n"
        if p.get("legenda"):
            s += "**Legenda**\n\n" + p["legenda"] + "\n\n"
        for t in p.get("textos", []):
            s += f"**{t['campo']}:** {t['valor']}\n\n"
        s += "**Texto alternativo**\n\n" + "\n".join(f"- `{im['arquivo']}`: {im['alt']}" for im in p["imagens"]) + "\n\n---\n\n"
    s += ("## Fotos\n\nBanco Pexels, licença livre para uso comercial, sem obrigação de crédito. As pessoas são modelos de banco de imagem: "
          "a licença não permite dar a entender que elas usam ou recomendam o produto, por isso nenhum texto das peças está em forma de depoimento. "
          "Nenhuma foto mostra marca de terceiros.\n\n| Peça | Autor | Página |\n|---|---|---|\n")
    for _, uso, autor, url in creditos():
        s += f"| {uso} | {autor} | {url} |\n"
    return s


def main() -> None:
    pubs = json.loads((PASTA / "publicacoes.json").read_text(encoding="utf-8"))
    novas = [p for p in pubs if not p.get("publicada")]
    antigas = [p for p in pubs if p.get("publicada")]
    pagina = PAGINA.replace("__NOVAS__", "".join(bloco(p) for p in novas)).replace("__ANTIGAS__", "".join(bloco(p) for p in antigas))
    (PASTA / "index.html").write_text(pagina, encoding="utf-8", newline="\n")
    (PASTA / "legendas.txt").write_text(texto_puro(pubs).replace("\n", "\r\n"), encoding="utf-8-sig", newline="")
    (PASTA / "legendas.md").write_text(markdown(pubs), encoding="utf-8", newline="\n")
    for p in pubs:
        print(p["id"], "publicada" if p.get("publicada") else "nova     ", len(p["imagens"]), "imagens |", p["titulo"])
    print("gerados: index.html, legendas.txt, legendas.md")


if __name__ == "__main__":
    main()
