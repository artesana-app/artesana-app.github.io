# artesaná.

O app da empreendedora que faz, vende e fotografa. Artesanato, saboaria e beleza natural.

- **Site:** https://artesana-app.github.io/
- **App (PWA):** https://artesana-app.github.io/app/

Domínio: `artesana-mktdigital.com.br` redireciona para o site. Detalhes e limites em `docs/dominio.md`.

Endereço anterior, que continua no ar e recebe as mesmas atualizações: https://bebezinbtc-droid.github.io/artesana/

## O que tem na v1

- Landing de apresentação (`index.html`).
- App PWA em `app/`: HTML/CSS/JS puro, sem build, instalável no celular, funciona offline.
- Funcionando sem backend: link do WhatsApp com QR, checklist de identidade com upload, gerador de lista INCI (~150 ingredientes), rótulo redondo/retangular/tag exportado em PDF (folha A4, vetorial), tutoriais, onboarding progressivo, perfil, planos, configurações.
- Funções de IA e Meta Business aparecem como "em breve" (`app/js/data/roadmap.js`).

## Rodar local

```bash
python -m http.server 8080
# landing: http://localhost:8080/   app: http://localhost:8080/app/
```

## Testes

```bash
node --test tests/*.test.mjs      # lógica pura (whatsapp, inci, rótulo, progresso)
python scripts/smoke.py           # Playwright: abre todas as rotas, falha em erro de console
python scripts/smoke.py --base https://artesana-app.github.io
```

## Publicar

Commit + push na `main`. O `git push` envia para os dois repositórios: `artesana-app/artesana-app.github.io`, que é o endereço oficial, e `bebezinbtc-droid/artesana`, o anterior. GitHub Pages serve a raiz do repo. Ao mudar arquivos do app, suba a constante `CACHE` em `app/sw.js` pra forçar atualização nos celulares.

## Landing

Formato de vitrine de loja (`index.html` + `landing.css`). As miniaturas das ferramentas são telas reais do app, geradas por `python scripts/gen-site-shots.py` em `assets/site/`. Rode de novo quando o visual do app mudar.

## Instagram

Peças e legendas em `marketing/instagram/`. `python scripts/gen-instagram.py` gera as imagens e `python scripts/gen-instagram-pagina.py` gera a página de entrega.

## Marca

Tokens em `app/css/variables.css`. Logo, ícones e wordmark em `assets/brand/` (gerados por `scripts/gen-brand.py` a partir dos glifos Poppins do logo; as fontes ficam em `scripts/fonts/`, fora do git).

## Documentação

- `briefing.md` — visão do produto.
- `docs/superpowers/specs/` — specs (esqueleto 03/2026, site v1 09/2026).
- `docs/superpowers/plans/` — plano de implementação.
