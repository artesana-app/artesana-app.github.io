# artesaná.

O app da empreendedora que faz, vende e fotografa. Artesanato, saboaria e beleza natural.

- **Site:** https://bebezinbtc-droid.github.io/artesana/
- **App (PWA):** https://bebezinbtc-droid.github.io/artesana/app/

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
python scripts/smoke.py --base https://bebezinbtc-droid.github.io/artesana
```

## Publicar

Commit + push na `main`. GitHub Pages serve a raiz do repo. Ao mudar arquivos do app, suba a constante `CACHE` em `app/sw.js` pra forçar atualização nos celulares.

## Marca

Tokens em `app/css/variables.css`. Logo, ícones e wordmark em `assets/brand/` (gerados por `scripts/gen-brand.py` a partir dos glifos Poppins do logo; as fontes ficam em `scripts/fonts/`, fora do git).

## Documentação

- `briefing.md` — visão do produto.
- `docs/superpowers/specs/` — specs (esqueleto 03/2026, site v1 09/2026).
- `docs/superpowers/plans/` — plano de implementação.
