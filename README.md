# artesaná.

O app da empreendedora que faz, vende e fotografa. Artesanato, saboaria e beleza natural.

- **Site:** https://artesana-mktdigital.com.br/
- **App (PWA):** https://artesana-mktdigital.com.br/app/

Domínio: `artesana-mktdigital.com.br` redireciona para o site. Detalhes e limites em `docs/dominio.md`.

Endereço anterior, que serve de espelho: https://bebezinbtc-droid.github.io/artesana/ (atualizado com `python scripts/espelho.py`, que publica a main sem o CNAME).

## O que tem na v2

- Landing de apresentação (`index.html`), com a mesma cara no computador e no celular.
- App PWA em `app/`: HTML/CSS/JS puro, sem build, instalável no celular, funciona offline. No computador ganha barra lateral e duas colunas (`app/css/layout.css`, a partir de 900px).
- Entrada por rede (Instagram, Facebook, os dois, nenhuma) e conversa guiada de perfil, uma pergunta por tela, com "fazer depois" e "ver tudo que preciso preencher" (`app/js/modules/conversa.js`).
- Falar em vez de digitar em todo campo de texto (`app/js/campos.js` + `app/js/ditado.js`); onde o navegador não tem reconhecimento de voz o microfone fica apagado e explica.
- Identidade (paleta, logo, frase, end card, fotos coringas: cada item com envio de arquivo ou "criar" no app), rótulos com galeria de modelos, mockup por produto e sugestão de tamanho pra caber mais na folha, campos da Anvisa, INCI, datas e papel; link do WhatsApp; social (legendas, calendário, roteiro de reel, análise de perfil e de público, agenda, métricas); fotos (editor com a marca por cima, estilos, locução, capa do vídeo); referências do Pinterest filtradas pelo perfil; guia pra criar a conta do Instagram; INPI; planos; botão beta sempre visível pra avaliar.
- Ajuda: chat com respostas prontas que aguenta erro de digitação (`app/js/lib/suporte.js`) e, com backend, chama uma atendente sem mostrar número nenhum.
- Backend opcional em `backend/` (Cloudflare Worker + D1): painel de admin em `/app/admin/` (acessos, até onde cada pessoa chegou, e-mail, cidade, faixa etária), atendimento pelo Telegram, pagamentos pelo Mercado Pago. Enquanto `SITE.backend` for null o app não manda nada pra fora. Passo a passo em `docs/backend.md`.
- Referências pro redesenho do app em `marketing/referencias-app/` (dez apps, três caminhos).

## Rodar local

```bash
python -m http.server 8080
# landing: http://localhost:8080/   app: http://localhost:8080/app/
```

## Testes

```bash
node --test                       # lógica pura (whatsapp, inci, rótulo, progresso, suporte, geradores, backend) + sintaxe ES de todo módulo
python scripts/smoke.py           # Playwright: abre todas as rotas no celular e no computador, falha em erro de console
python scripts/smoke.py --base https://artesana-mktdigital.com.br
```

## Publicar

Commit + push na `main`. O `git push` envia só para `artesana-app/artesana-app.github.io`, o repositório oficial. O anterior, `bebezinbtc-droid/artesana`, está no remoto `antigo` e só recebe a main sem o `CNAME`, por `python scripts/espelho.py`: com o CNAME, o endereço antigo passaria a redirecionar pro domínio (ver `docs/dominio.md`). GitHub Pages serve a raiz do repo. Ao mudar arquivos do app, suba a constante `CACHE` em `app/sw.js` pra forçar atualização nos celulares.

## Landing

Formato de vitrine de loja (`index.html` + `landing.css`). As miniaturas das ferramentas são telas reais do app, geradas por `python scripts/gen-site-shots.py` em `assets/site/`. Rode de novo quando o visual do app mudar.

## Instagram

Peças e legendas em `marketing/instagram/`. A linha atual é a série ateliê (`atelie-1.jpg` a `atelie-6.jpg`): três fontes, texto a pelo menos 120px das bordas, conferido pelo gerador. `python scripts/gen-instagram.py` gera as imagens e `python scripts/gen-instagram-pagina.py` gera a página de entrega.

## Marca

Tokens em `app/css/variables.css`. Logo, ícones e wordmark em `assets/brand/` (gerados por `scripts/gen-brand.py` a partir dos glifos Poppins do logo; as fontes ficam em `scripts/fonts/`, fora do git).

## Documentação

- `briefing.md` — visão do produto.
- `docs/superpowers/specs/` — specs (esqueleto 03/2026, site v1 09/2026).
- `docs/superpowers/plans/` — plano de implementação.
