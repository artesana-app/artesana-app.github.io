# artesaná. Site v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar em GitHub Pages a landing do artesaná. e o PWA com esqueleto completo + WhatsApp/QR, checklist de identidade, gerador INCI e rótulo A4 → PDF funcionando sem backend.

**Architecture:** Site estático servido da raiz do repo. Landing em `/index.html`; app em `/app/` como shell único (`index.html` com uma `<section data-route>` por tela) + router por hash + módulos ES que montam cada tela sob demanda. Lógica pura em `app/js/lib/` sem DOM (testada com `node --test`); estado em localStorage via `store.js`.

**Tech Stack:** HTML/CSS/JS puro (ES modules), Poppins via Google Fonts, qrcode-generator 1.4.4 vendorizado, Python 3 (fontTools + Pillow) só pra gerar assets, Node 24 `node --test`, Playwright (Python) pra smoke, `gh` CLI pra deploy.

**Spec:** `docs/superpowers/specs/2026-09-10-artesana-site-v1-design.md` (e, por referência, `2026-03-21-artesana-pwa-esqueleto-design.md`).

## Global Constraints

- Caminhos sempre relativos (`./`), site vive em `/artesana/`.
- Tokens exatos: `--peach #FFB18B`, `--peach-d #DE9060`, `--peach-l #FFD9C4`, `--cream #FFF5EF`, `--moss #4A6348`, `--moss-d #344838`, `--gold #CC9828`, `--ink #2C1A1E`.
- Fonte única Poppins 400/500/600/700. Wordmark: `artesaná` 400 + `.` 700, `letter-spacing:-0.04em`.
- Texto creme só sobre moss/moss-d/peach-d. Sobre `--peach` texto `--ink`.
- Toda chave de localStorage começa com `artesana_`.
- Mobile-first 375px, largura máx. do app 480px, alvos de toque ≥ 44px.
- Sem dependência externa além de Google Fonts e `vendor/qrcode.min.js`.
- Commits pequenos, mensagem em PT, rodapé `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Git: `git -C C:/Users/ramom/Downloads/bibi ...` com `-c user.name=bebezinbtc-droid -c user.email=asic.reparos@gmail.com`.

---

## File map

| Arquivo | Responsabilidade |
|---|---|
| `scripts/gen-brand.py` | gera `assets/brand/wordmark.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` a partir de `scripts/fonts/Poppins-*.ttf` (subset, gitignored) |
| `assets/brand/*` | wordmark, ícones, lockups png |
| `app/index.html` | shell: head (metas PWA, fontes), `<main>` com 17 sections, tab bar, `<template>`s, `<script type=module src=js/app.js>` |
| `app/css/variables.css` | tokens |
| `app/css/global.css` | reset, tipografia, `.wordmark`, layout `.screen`, `.header` |
| `app/css/components.css` | `.tabbar`, `.card`, `.btn`, `.list` (iOS), `.badge`, `.progress`, `.toast`, `.modal`, `.chip`, inputs |
| `app/css/modules.css` | grid da home, carrossel de estilos, preview de rótulo, checklist |
| `app/css/print.css` | `@media print`: esconde tudo menos `#folha-a4`, `@page A4 margin 0` |
| `app/js/store.js` | `get(k, def)`, `set(k, v)`, `remove(k)`, `limparTudo()` |
| `app/js/router.js` | `iniciar(rotas)`, `ir(hash)`, `voltar()`, proteção de rota, ativa section, marca tab |
| `app/js/ui.js` | `toast(msg)`, `copiar(texto)`, `modal({titulo, html, botoes})`, `lista(itens)`, `h(tag, attrs, children)` |
| `app/js/onboarding.js` | `primeiroAcesso()`, `pedirDadosMarca()`, `pedirInstagram()`, `pedirTipoProduto()` |
| `app/js/lib/progresso.js` | `calcularProgresso({user, onboarding, instagram})` → `{feitas, total:5, etapas[]}` |
| `app/js/lib/whatsapp.js` | `validar({ddd, numero})`, `montarLink({ddd, numero, mensagem})`, `numeroFormatado` |
| `app/js/lib/inci.js` | `gerarInci(itens)`, `sugerirAlergenos(itens, tabela)` |
| `app/js/lib/rotulo.js` | `gradeA4({largura, altura, margem, espaco})`, `corTexto(hexFundo)` |
| `app/js/data/ingredientes.js` | `export const INGREDIENTES = [{pt, inci, funcao, alergenos?}]` |
| `app/js/data/datas.js` | `export const DATAS = [{nome, mes, dia?, gancho}]` |
| `app/js/data/roadmap.js` | `export const ROADMAP = { id: {titulo, emoji, descricao, modulo} }` |
| `app/js/data/tutoriais.js` | `FOTO_CELULAR[6]`, `PAGINA_FB_MOBILE[7]`, `PAGINA_FB_DESKTOP[7]` |
| `app/js/modules/*.js` | cada um exporta `montar(section, params)`; login, home, social, rotulos, fotos, identidade, feedback, inpi, mais, perfil, planos, config, whatsapp, meta, tutorial, detalhe |
| `app/js/app.js` | importa módulos, chama `router.iniciar`, registra SW |
| `app/manifest.json`, `app/sw.js` | PWA |
| `index.html`, `landing.css` | landing |
| `tests/*.test.mjs` | node --test |
| `scripts/smoke.py` | Playwright smoke |
| `README.md` | como rodar local, testar, publicar |

Rotas → module: `login, home, social, rotulos, fotos, mais, identidade, feedback, inpi, perfil, planos, config, whatsapp, meta, tutorial-meta→tutorial, detalhe/:id→detalhe`.

---

### Task 1: Assets de marca

**Files:** Create `scripts/gen-brand.py`, `scripts/fonts/Poppins-Regular.ttf`, `scripts/fonts/Poppins-Bold.ttf` (copiados do scratchpad, gitignored), `assets/brand/{wordmark.svg, wordmark-cream.svg, icon-192.png, icon-512.png, icon-maskable-512.png, logo-cream-on-peach.png, logo-peach-on-cream.png}`.

**Produces:** os arquivos acima, referenciados por `app/manifest.json`, `app/index.html`, `index.html`.

- [ ] **Step 1:** copiar TTF subset e lockups do scratchpad para `scripts/fonts/` e `assets/brand/`.
- [ ] **Step 2:** escrever `scripts/gen-brand.py`:
  - fontTools `TTFont` + `SVGPathPen` para cada glifo de `artesaná` (Regular) e `.` (Bold); avança pelo `hmtx` com tracking `-0.04em`; `á` é o glifo mapeado ao codepoint não-ASCII do subset (usar `cmap` inverso: o único codepoint > 127). Emite `<svg viewBox>` com `<path fill="#FFB18B">` (wordmark.svg) e `#FFF5EF` (wordmark-cream.svg).
  - PIL: quadrado 512 `#FFB18B`, `a` Regular + `.` Bold em `#FFF5EF`, centrado; salva 512 e 192; maskable = mesma arte com 20% de margem extra.
- [ ] **Step 3:** rodar `python scripts/gen-brand.py`; verificar com `python -c "from PIL import Image; print(Image.open('assets/brand/icon-512.png').size)"` → `(512, 512)` e abrir o SVG no navegador.
- [ ] **Step 4:** commit `feat(brand): wordmark svg e ícones pwa gerados do logo`.

---

### Task 2: Shell do app, CSS, store, router, ui, login + home mínimos

**Files:** Create `app/index.html`, `app/css/{variables,global,components,modules,print}.css`, `app/js/{store,router,ui,app}.js`, `app/js/modules/{login,home}.js`.

**Produces:**
- `store.get(chave, padrao)` / `store.set(chave, valor)` / `store.remove(chave)` / `store.limparTudo()` (apaga só chaves `artesana_*`).
- `router.iniciar({ rotas: {nome: montar}, protegidas: true })`, `router.ir('#home')`, `router.voltar()`. Ao mudar hash: parse `#rota/param`; se não logado (`store.get('artesana_user',{}).logado !== true`) e rota ≠ login → `#login`; esconde todas `section[data-route]`, mostra a da rota, chama `montar(section, param)`; marca `.tabbar a[data-tab=...]` ativo (sub-telas do Mais marcam `mais`).
- `ui.h(tag, attrs, ...children)`, `ui.toast(msg)`, `ui.copiar(texto)` (navigator.clipboard com fallback execCommand + toast), `ui.modal({titulo, corpo, botoes:[{texto, classe, onClick}]})`, `ui.lista([{emoji, titulo, sub, badge, onClick, href}])` → `<ul class=list>`.
- `app/index.html` contém: `<div class="app">`, `<main>` com sections `data-route` para todas as 17 rotas (vazias, o módulo monta), `<nav class="tabbar">` com 5 links, `<div id="toast">`, `<div id="modal">`, `<section id="folha-a4" class="print-only">`.

- [ ] **Step 1:** CSS conforme File map. `.screen{max-width:480px;margin:0 auto;padding-bottom:72px}`, `.tabbar{position:fixed;bottom:0;background:var(--moss)}`, `.header{background:var(--moss-d);color:var(--cream)}`, `.header.peach{background:var(--peach);color:var(--ink)}`.
- [ ] **Step 2:** `store.js`, `router.js`, `ui.js` como nas interfaces acima (try/catch em JSON.parse).
- [ ] **Step 3:** `modules/login.js`: 3 botões (Facebook azul #1877F2, Instagram gradiente, E-mail branco) → e-mail abre campos; qualquer um salva `artesana_user = {nome:'', marca:'', logado:true, loginTipo}` e `router.ir('#home')`. Aviso beta.
- [ ] **Step 4:** `modules/home.js` mínimo: header com saudação por hora ("Bom dia/Boa tarde/Boa noite"), nome da marca ou "sua marca", avatar inicial; grid 2×3 dos módulos com links. (Progresso, dica, WhatsApp e plano entram nas tasks 3/4.)
- [ ] **Step 5:** `app.js`: importa tudo, `router.iniciar(...)`, registra `./sw.js` se existir (`if ('serviceWorker' in navigator)` dentro de try).
- [ ] **Step 6:** testar: `python -m http.server 8080` na raiz, abrir `http://localhost:8080/app/`, login → home, tab bar navega, F5 mantém logado.
- [ ] **Step 7:** commit `feat(app): shell, router, store, ui, login e home`.

---

### Task 3: Progresso + onboarding + perfil + dashboard completo

**Files:** Create `app/js/lib/progresso.js`, `tests/progresso.test.mjs`, `app/js/onboarding.js`, `app/js/modules/perfil.js`; Modify `app/js/modules/home.js`.

**Produces:** `calcularProgresso({user, onboarding, instagram})` → `{feitas, total:5, etapas:[{id, nome, ok}]}`; `onboarding.dica(progresso)` → string.

- [ ] **Step 1:** teste:
```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { calcularProgresso } from '../app/js/lib/progresso.js';
test('vazio = 0 de 5', () => {
  const p = calcularProgresso({});
  assert.equal(p.feitas, 0); assert.equal(p.total, 5); assert.equal(p.etapas.length, 5);
});
test('nome+marca conta 1; nicho 2; historia 3; personalidade+publico 4; instagram 5', () => {
  const p = calcularProgresso({
    user:{nome:'Bibi', marca:'Flor'}, onboarding:{nicho:'sabonetes', historia:'x', personalidade:'delicada', publicoAlvo:'mulheres'},
    instagram:{arroba:'@flor', perfisReferencia:['@a']} });
  assert.equal(p.feitas, 5);
});
test('personalidade sem publico nao conta', () => {
  assert.equal(calcularProgresso({onboarding:{personalidade:'rustica'}}).etapas[3].ok, false);
});
```
- [ ] **Step 2:** `node --test tests/` → falha (módulo inexistente).
- [ ] **Step 3:** implementar `progresso.js` (etapas: `nome-marca`, `nicho`, `historia`, `personalidade-publico`, `instagram`). Rodar teste → passa.
- [ ] **Step 4:** `onboarding.js`: `primeiroAcesso()` abre modal "Como você se chama? / Já tem uma marca?" quando `user.nome` vazio; `pedirDadosMarca()` modal em 3 passos (nicho select, história textarea + público, personalidade chips) salva em `artesana_onboarding`; `pedirInstagram()` (@ + 3 perfis); `pedirTipoProduto()` (tipo + ingredientes texto livre) salva `onboarding.tipoProduto`. Cada um só dispara se o dado estiver vazio e marca `artesana_onboarding.vistos[modulo]=true` pra não repetir. `dica(p)` retorna a primeira etapa faltante como frase.
- [ ] **Step 5:** `perfil.js`: lista iOS editável (nome, marca, nicho, história, personalidade, público, @, WhatsApp→`#whatsapp`), barra de progresso + lista das 5 etapas com ✓/○. Cada campo salva no store ao `change` e re-renderiza.
- [ ] **Step 6:** `home.js`: adiciona barra de progresso no header, card de dica (borda `--gold`), card plano atual (borda gold + "Evoluir" → `#planos`), chama `onboarding.primeiroAcesso()`.
- [ ] **Step 7:** commit `feat(app): onboarding progressivo, perfil e dashboard`.

---

### Task 4: WhatsApp + QR

**Files:** Create `app/js/lib/whatsapp.js`, `tests/whatsapp.test.mjs`, `app/vendor/qrcode.min.js`, `app/js/modules/whatsapp.js`; Modify `home.js` (card WhatsApp).

**Produces:** `validar({ddd, numero})` → `{ok:true}` ou `{ok:false, erro}`; `montarLink({ddd, numero, mensagem})` → string; `numeroFormatado({ddd, numero})` → `"(21) 99999-9999"`. `modules/whatsapp.js` exporta também `gerarQrDataUrl(texto, px=512)` (usa `window.qrcode`).

- [ ] **Step 1:** teste:
```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { validar, montarLink, numeroFormatado } from '../app/js/lib/whatsapp.js';
test('link sem mensagem', () => assert.equal(montarLink({ddd:'21', numero:'999163148'}), 'https://wa.me/5521999163148'));
test('link com mensagem encoda', () => assert.equal(montarLink({ddd:'21', numero:'999163148', mensagem:'Olá! Quero um pedido'}), 'https://wa.me/5521999163148?text=Ol%C3%A1!%20Quero%20um%20pedido'));
test('aceita mascara e espaços', () => assert.equal(montarLink({ddd:'(21)', numero:'99916-3148'}), 'https://wa.me/5521999163148'));
test('ddd invalido', () => assert.equal(validar({ddd:'1', numero:'999163148'}).ok, false));
test('numero curto', () => assert.match(validar({ddd:'21', numero:'1234'}).erro, /número/i));
test('formatado', () => assert.equal(numeroFormatado({ddd:'21', numero:'999163148'}), '(21) 99916-3148'));
```
- [ ] **Step 2:** rodar → falha. **Step 3:** implementar (strip não-dígitos; ddd 2 dígitos; número 8 ou 9). Rodar → passa.
- [ ] **Step 4:** copiar `qrcode.min.js` do scratchpad para `app/vendor/`; incluir `<script src="./vendor/qrcode.min.js">` no shell antes do module.
- [ ] **Step 5:** `modules/whatsapp.js`: form (+55 fixo, DDD, número, mensagem, 3 chips de sugestão), botões Copiar/Testar/Baixar QR (canvas 512, `qrcode(0,'M')`, `toDataURL`, `<a download="qr-whatsapp.png">`), preview do QR, salva `artesana_whatsapp = {ddd, numero, mensagem, link}` ao gerar.
- [ ] **Step 6:** `home.js`: card moss "Seu link do WhatsApp" com link + Copiar, ou botão "Criar link" se vazio.
- [ ] **Step 7:** commit `feat(app): gerador de link whatsapp com qr code`.

---

### Task 5: INCI

**Files:** Create `app/js/data/ingredientes.js`, `app/js/lib/inci.js`, `tests/inci.test.mjs`, `app/js/modules/rotulos.js` (parte INCI; a parte de rótulo vem na Task 6).

**Produces:** `gerarInci(itens:[{inci}])` → `"A, B, C"` (dedupe, trim, sem vazios); `sugerirAlergenos(itens)` → array único de INCI de alergênicos dos itens que têm `alergenos`.

- [ ] **Step 1:** teste:
```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { gerarInci, sugerirAlergenos } from '../app/js/lib/inci.js';
import { INGREDIENTES } from '../app/js/data/ingredientes.js';
test('gera na ordem dada, sem duplicar', () => assert.equal(gerarInci([{inci:'Sodium Olivate'},{inci:'Aqua'},{inci:'Aqua'},{inci:' '}]), 'Sodium Olivate, Aqua'));
test('tabela tem >= 90 itens com pt e inci unicos', () => {
  assert.ok(INGREDIENTES.length >= 90);
  assert.equal(new Set(INGREDIENTES.map(i => i.pt.toLowerCase())).size, INGREDIENTES.length);
});
test('alergenos da lavanda incluem linalool', () => {
  const lav = INGREDIENTES.find(i => /lavanda/i.test(i.pt));
  assert.ok(sugerirAlergenos([lav]).includes('Linalool'));
});
```
- [ ] **Step 2:** rodar → falha. **Step 3:** escrever tabela (~100: óleos vegetais, manteigas, ceras, álcalis, glicerina, água, açúcares, méis, leites, argilas, óxidos/micas, óleos essenciais com alergênicos, extratos, conservantes, emulsionantes, ácidos, fragrância genérica) e `inci.js`. Rodar → passa.
- [ ] **Step 4:** `rotulos.js` seção INCI: input de busca com `<datalist>`/lista filtrada, lista de selecionados com ↑ ↓ ✕, campo "outro (INCI)", toggle "incluir alergênicos", saída em `<textarea readonly>`, Copiar, "Usar no rótulo" (salva `artesana_rotulos.inci`, vai pra aba Criar). Pede `onboarding.pedirTipoProduto()` na 1ª visita.
- [ ] **Step 5:** commit `feat(app): gerador inci com tabela de ingredientes`.

---

### Task 6: Rótulo A4 → PDF

**Files:** Create `app/js/lib/rotulo.js`, `tests/rotulo.test.mjs`, `app/js/data/datas.js`; Modify `app/js/modules/rotulos.js`, `app/css/print.css`, `app/css/modules.css`.

**Produces:** `gradeA4({largura, altura, margem=8, espaco=3})` → `{colunas, linhas, total, posicoes:[{x,y}]}` em mm (A4 = 210×297); `corTexto(hex)` → `'#2C1A1E'` ou `'#FFF5EF'` por luminância.

- [ ] **Step 1:** teste:
```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { gradeA4, corTexto } from '../app/js/lib/rotulo.js';
test('redondo 50mm cabe 3x5', () => { const g = gradeA4({largura:50, altura:50}); assert.equal(g.colunas, 3); assert.equal(g.linhas, 5); assert.equal(g.total, 15); assert.equal(g.posicoes.length, 15); });
test('retangular 70x40 cabe 2x6', () => { const g = gradeA4({largura:70, altura:40}); assert.equal(g.colunas, 2); assert.equal(g.linhas, 6); });
test('maior que a folha = 0', () => assert.equal(gradeA4({largura:300, altura:50}).total, 0));
test('primeira posicao = margem', () => assert.deepEqual(gradeA4({largura:50, altura:50}).posicoes[0], {x:8, y:8}));
test('cor do texto', () => { assert.equal(corTexto('#FFF5EF'), '#2C1A1E'); assert.equal(corTexto('#4A6348'), '#FFF5EF'); });
```
- [ ] **Step 2:** rodar → falha. **Step 3:** implementar (`colunas = floor((210-2m+e)/(l+e))`). Rodar → passa.
- [ ] **Step 4:** `datas.js` (12 datas BR com gancho). `rotulos.js` aba Criar: tipo (redondo/retangular/tag) + presets + campos mm, textos (marca prefill de `user.marca`, produto, frase, peso), toggles INCI e QR (usa `artesana_whatsapp.link`), chips de cor de fundo, chip de data comemorativa (prefixa a frase), preview em escala (1mm = 3px), texto "cabem N por folha A4", botão "Exportar PDF (imprimir)". Salva `artesana_rotulos.ultimoRotulo`.
- [ ] **Step 5:** exportar: monta `#folha-a4` com `posicoes` em `position:absolute; left:Xmm; top:Ymm; width/height mm`, redondo com `border-radius:50%`, tag com furo (círculo branco 4mm no topo); QR via `gerarQrDataUrl`; `print.css` esconde `.app` e mostra `#folha-a4` com `@page{size:A4;margin:0}`; chama `window.print()` após `requestAnimationFrame`. Modal antes: "Na janela de impressão escolha Salvar como PDF".
- [ ] **Step 6:** testar no Chrome: preview de impressão mostra a grade; salvar PDF e abrir.
- [ ] **Step 7:** commit `feat(app): editor de rótulo com exportação a4 para pdf`.

---

### Task 7: Identidade visual (checklist + upload)

**Files:** Create `app/js/modules/identidade.js`; Modify `modules.css`.

- [ ] **Step 1:** ao abrir: `onboarding.pedirDadosMarca()` se faltar. Banner peach pedindo história se ainda vazio.
- [ ] **Step 2:** checklist 6 itens de `artesana_identidade.itens`; item `nome` = `!!user.marca`; toggle salva; Logo/Paleta/Fotos têm `<input type=file accept=".pdf,.png,.jpg,.jpeg,.svg,.psd,.cdr,.ai">` → salva `{nome, tipo, tamanho, data, item}` em `arquivos[]`; se ext ∈ psd/cdr/ai → modal orientando exportar PNG/PDF (Photoshop: Exportar como; Corel: Publicar em PDF; Canva: Baixar → PNG fundo transparente). Barra "X de 6 prontos".
- [ ] **Step 3:** grupo "Criar com IA": Logo, Frase de impacto, End card → `#detalhe/logo-ia` etc. Grupo "Fotos coringas" → detalhe. End card mostra o link WhatsApp se existir.
- [ ] **Step 4:** commit `feat(app): checklist de identidade com upload`.

---

### Task 8: Telas restantes

**Files:** Create `app/js/data/{roadmap,tutoriais}.js`, `app/js/modules/{social,fotos,feedback,inpi,mais,planos,config,meta,tutorial,detalhe}.js`.

- [ ] **Step 1:** `roadmap.js`: ids `calendario, legendas, reels, analise-instagram, perfis-referencia, analise-publico, agendar, metricas, editar-foto, estilos, editar-video, locucao, logo-ia, frase-ia, endcard, fotos-coringas, feedback, inpi` com `{titulo, emoji, descricao (2-3 frases do briefing), modulo}`.
- [ ] **Step 2:** `detalhe.js`: header com ← (`router.voltar`), emoji grande, título, descrição, selo "Em breve". Se id desconhecido → "Funcionalidade não encontrada".
- [ ] **Step 3:** `social.js`: `onboarding.pedirInstagram()` na 1ª visita; badge de status Meta; grupos Criar/Analisar/Agendar como lista iOS → detalhe; `agendar` mostra toast "Conecte o Meta Business" se não conectado; `metricas` badge PRO → `#planos`.
- [ ] **Step 4:** `fotos.js`: grupos Fotos (editar → detalhe; estilos = carrossel horizontal de 6 chips coloridos que salva `artesana_fotos.estilo`), Vídeos (editar, locução com 3 opções → detalhe), presets da marca (4 chips), Aprender → tutorial foto (6 passos de `tutoriais.js`, renderizado inline em accordion).
- [ ] **Step 5:** `feedback.js` e `inpi.js`: placeholders com título, descrição, emoji, "Em breve".
- [ ] **Step 6:** `mais.js`: header avatar+marca+plano; grupos Ferramentas / Contato (link WhatsApp + copiar) / Sua Conta (Perfil com badge "X/5", Meta Business com status, Planos badge "Evoluir", Configurações) / card tutorial FB / "Sair da conta" (`user.logado=false` → `#login`).
- [ ] **Step 7:** `planos.js`: 3 cards com preços da spec, o atual marcado, botão "Em breve" nos pagos, nota "valores de layout". `config.js`: toggle notificações (store), idioma fixo, sobre (versão `v1.0.0`), "Limpar dados" (confirm → `store.limparTudo()` → `#login`).
- [ ] **Step 8:** `meta.js`: fluxo "Tem página no Facebook?" Sim → salva conectado + badge; Não → "Criar automaticamente" (loading 2s → sucesso, salva) ou "Tutorial" → `#tutorial-meta`. `tutorial.js`: abas Mobile/Desktop, 7 passos cada de `tutoriais.js`, botão final "Já criei, conectar agora".
- [ ] **Step 9:** commit `feat(app): conteúdo social, fotos, mais, planos, config, meta e tutoriais`.

---

### Task 9: PWA (manifest + service worker)

**Files:** Create `app/manifest.json`, `app/sw.js`; Modify `app/index.html` (metas), `app/js/app.js`.

- [ ] **Step 1:** manifest conforme spec §7, ícones `../assets/brand/icon-*.png` com `purpose any` e `maskable`.
- [ ] **Step 2:** `sw.js`: `CACHE='artesana-v1'`, `PRECACHE=[...]` lista explícita de todos css/js/vendor/ícones + `./`; install → `addAll`; activate → apaga outros caches + `clients.claim`; fetch: navegação → network-first com fallback cache `./`; `fonts.g*` → stale-while-revalidate no cache `artesana-fonts`; resto do escopo → cache-first.
- [ ] **Step 3:** metas iOS + `theme-color` no shell; registro em `app.js`.
- [ ] **Step 4:** testar: Chrome DevTools → Application → manifest ok, SW ativo; marcar offline e recarregar → app abre.
- [ ] **Step 5:** commit `feat(pwa): manifest e service worker com precache`.

---

### Task 10: Landing

**Files:** Create `index.html`, `landing.css`.

- [ ] **Step 1:** seções da spec §6 na ordem; wordmark em CSS (`.wordmark` compartilhado, copiar regra); links `./app/`; meta OG (title, description, image = lockup png); favicon = icon-192.
- [ ] **Step 2:** responsivo: 1 coluna até 720px, grid 3 acima. Fundo `--cream`, hero `--peach` com texto `--ink` e wordmark `--cream`.
- [ ] **Step 3:** abrir em 375 e 1280, conferir contraste e links.
- [ ] **Step 4:** commit `feat(landing): página de apresentação`.

---

### Task 11: Smoke test + README

**Files:** Create `scripts/smoke.py`, `README.md`.

- [ ] **Step 1:** `smoke.py`: sobe `http.server` em thread na raiz, Playwright chromium 375×812, coleta `console.error`/`pageerror`; abre `/` e checa `h1`; abre `/app/#login`, injeta `localStorage.artesana_user={"logado":true,"nome":"T","marca":"M","loginTipo":"email"}`, visita cada rota (`home social rotulos fotos mais identidade feedback inpi perfil planos config whatsapp meta tutorial-meta detalhe/logo-ia`) e falha se a section ativa estiver vazia ou houver erro. Sai com código ≠ 0 em falha.
- [ ] **Step 2:** rodar `python scripts/smoke.py` → OK. `node --test tests/` → OK.
- [ ] **Step 3:** README: o que é, como rodar local, testes, publicar, onde trocar marca.
- [ ] **Step 4:** commit `test: smoke playwright e readme`.

---

### Task 12: Deploy GitHub Pages

- [ ] **Step 1:** `gh repo create artesana --public --source=. --remote=origin --push --description "artesaná. — app da empreendedora artesã"`.
- [ ] **Step 2:** `gh api -X POST repos/bebezinbtc-droid/artesana/pages -f build_type=legacy -f source[branch]=main -f source[path]=/`.
- [ ] **Step 3:** aguardar `gh api repos/bebezinbtc-droid/artesana/pages --jq .status` = `built`; `curl -sI https://bebezinbtc-droid.github.io/artesana/ | head -1` → 200; idem `/artesana/app/`.
- [ ] **Step 4:** rodar smoke apontando pra URL pública (parâmetro `--base`).
- [ ] **Step 5:** anotar URL no README e commitar.

---

## Self-review

- Spec §2 → Task 1 + 2 (tokens/wordmark). §3 → File map. §4 → Task 2/8. §5.1 → 4. §5.2 → 7. §5.3 → 5. §5.4 → 6. §5.5 → 8 (fotos/tutorial). §5.6 → 6. §6 → 10. §7 → 9. §8 → Task 2 store + usos. §9 → 3/4/5/6/11. §10 → 12. §11 fora.
- Nomes consistentes: `montar(section, param)`, `store.get/set`, `router.ir/voltar`, `ui.h/toast/copiar/modal/lista`, `gerarQrDataUrl`, `calcularProgresso`, `gradeA4`, `gerarInci`.
