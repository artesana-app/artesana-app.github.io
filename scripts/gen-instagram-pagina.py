"""Monta a página de entrega das publicações a partir de marketing/instagram/legendas.md.

Saída: marketing/instagram/index.html (baixar imagem + copiar legenda) e legendas.txt (texto puro).
Uso:   python scripts/gen-instagram-pagina.py
"""
import html
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "marketing" / "instagram"


def ler_pecas():
    texto = (PASTA / "legendas.md").read_text(encoding="utf-8")
    pecas = []
    for bloco in texto.split("\n---\n"):
        m = re.search(r"^## (\d+)\. (.+?) — `(post-\d+\.jpg)`", bloco, re.M)
        if not m:
            continue
        legenda = re.search(r"\*\*Legenda\*\*\s*\n(.+?)\n\*\*Texto alternativo\*\*", bloco, re.S)
        alt = re.search(r"\*\*Texto alternativo\*\*\s*\n(.+)", bloco, re.S)
        pecas.append({
            "n": int(m.group(1)), "titulo": m.group(2).strip(), "arquivo": m.group(3),
            "legenda": legenda.group(1).strip(), "alt": alt.group(1).strip(),
        })
    return pecas


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
    .peca { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 32px; padding-block: 36px; border-bottom: 1px solid #ECE4DE; }
    .peca figure { margin: 0; }
    .peca figure img { border-radius: 4px; border: 1px solid #ECE4DE; }
    .peca h2 { font-family: 'Lexend Exa', sans-serif; font-weight: 400; font-size: 17px; letter-spacing: 0.04em; }
    .peca h3 { font-size: 13px; font-weight: 600; margin: 22px 0 8px; }
    .caixa { white-space: pre-wrap; font-family: var(--font); font-size: 14.5px; line-height: 1.55; margin: 0; padding: 16px; background: var(--cream); border: 1px solid #ECE4DE; border-radius: 4px; }
    .acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .botao { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 20px; border-radius: 4px; border: 1px solid var(--moss); background: var(--moss); color: var(--white); font: inherit; font-weight: 600; font-size: 14.5px; text-decoration: none; cursor: pointer; }
    .botao:hover { background: var(--moss-d); }
    .botao.claro { background: var(--white); color: var(--ink); border-color: var(--ink); }
    .botao.claro:hover { background: var(--cream); }
    .dica { font-size: 13px; color: var(--ink-2); margin-top: 10px; }
    .fim { padding-block: 28px 48px; font-size: 13px; color: var(--ink-2); }
    @media (max-width: 760px) { .peca { grid-template-columns: 1fr; gap: 20px; } .peca figure { max-width: 420px; } }
  </style>
</head>
<body>
  <header class="topo"><div class="wrap"><a class="wordmark" href="../../">artesaná<b>.</b></a><span>Instagram @artesana.app</span></div></header>
  <main class="wrap">
    <section class="intro">
      <h1>Primeiras três publicações</h1>
      <p>Baixe a imagem, copie a legenda e publique na ordem 1, 2, 3, em dias diferentes. Formato 1080 × 1350, que é o retrato 4:5 do Instagram.</p>
    </section>
__PECAS__
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

PECA = """    <article class="peca">
      <figure>
        <img src="./{arquivo}" alt="{alt}" width="1080" height="1350">
        <div class="acoes"><a class="botao" href="./{arquivo}" download="artesana-{arquivo}">Baixar imagem {n}</a></div>
        <p class="dica">No celular, também dá pra segurar o dedo na imagem e escolher salvar.</p>
      </figure>
      <div>
        <h2>{n}. {titulo}</h2>
        <h3>Legenda</h3>
        <pre class="caixa" id="legenda-{n}">{legenda}</pre>
        <div class="acoes"><button class="botao" type="button" data-copiar="legenda-{n}">Copiar legenda</button></div>
        <h3>Texto alternativo</h3>
        <pre class="caixa" id="alt-{n}">{alt}</pre>
        <div class="acoes"><button class="botao claro" type="button" data-copiar="alt-{n}">Copiar texto alternativo</button></div>
      </div>
    </article>
"""


def main() -> None:
    pecas = ler_pecas()
    assert len(pecas) == 3, f"esperava 3 peças em legendas.md, achei {len(pecas)}"
    blocos = "".join(PECA.format(n=p["n"], titulo=html.escape(p["titulo"]), arquivo=p["arquivo"],
                                 legenda=html.escape(p["legenda"]), alt=html.escape(p["alt"], quote=True)) for p in pecas)
    (PASTA / "index.html").write_text(PAGINA.replace("__PECAS__", blocos), encoding="utf-8", newline="\n")

    linhas = ["artesaná. — Instagram @artesana.app", "Publicar na ordem 1, 2, 3, em dias diferentes.", ""]
    for p in pecas:
        linhas += ["=" * 60, f"PUBLICAÇÃO {p['n']} — {p['titulo']} — arquivo {p['arquivo']}", "=" * 60, "",
                   "LEGENDA", "", p["legenda"], "", "TEXTO ALTERNATIVO", "", p["alt"], "", ""]
    (PASTA / "legendas.txt").write_text("\r\n".join("\r\n".join(l.split("\n")) for l in linhas), encoding="utf-8-sig", newline="")
    for p in pecas:
        print(p["n"], p["titulo"], "| legenda", len(p["legenda"]), "caracteres")
    print("gerados: index.html, legendas.txt")


if __name__ == "__main__":
    main()
