# artesaná. — Spec: Site v1 (landing + PWA no GitHub Pages)

**Data:** 2026-09-10
**Substitui/estende:** `2026-03-21-artesana-pwa-esqueleto-design.md` (esqueleto). Onde esta spec não fala, vale a de março.
**Escopo:** colocar o produto no ar como site: landing de apresentação na raiz + app PWA em `/app/`, com o esqueleto completo e as funcionalidades que rodam sem backend. Fase "app de loja" fica pra depois.

---

## 1. Decisões fechadas com o dono

| Tema | Decisão |
|------|---------|
| Hospedagem | GitHub Pages, repo público `bebezinbtc-droid/artesana`, branch `main`, raiz do repo |
| Domínio | Nenhum por enquanto. URL `https://bebezinbtc-droid.github.io/artesana/` |
| Escopo v1 | Esqueleto navegável + funcionalidades sem backend (§5). IA e Meta API = "em breve" |
| Landing | Sim. Raiz = apresentação, botão "Abrir o app" → `app/` |
| Stack | HTML/CSS/JS puro, ES modules, sem build, sem framework |
| Identidade | Logo novo (PDF `artesaná..pdf`, 10/09): Poppins Regular + ponto Poppins Bold, pêssego #FFB18B, creme #FFF5EF. Playfair Display sai. |

---

## 2. Identidade visual (atualizada)

```css
:root {
  --peach:   #FFB18B;  /* pêssego do logo: fundos de destaque, ponto do a., badges */
  --peach-d: #DE9060;  /* pêssego escuro (briefing): botões CTA com texto claro */
  --peach-l: #FFD9C4;  /* pêssego claro: hover, fundos suaves */
  --cream:   #FFF5EF;  /* creme do logo: fundo principal */
  --moss:    #4A6348;  /* cor principal: tab bar, botão primário */
  --moss-d:  #344838;  /* header escuro */
  --gold:    #CC9828;  /* detalhes premium, badge PRO, divisores */
  --ink:     #2C1A1E;  /* texto */
}
```

- **Família única:** Poppins (Google Fonts, pesos 400/500/600/700). Títulos 600, corpo 400.
- **Wordmark:** `artesaná.` em Poppins 400 com `letter-spacing: -0.04em`, ponto em 700 na cor `--peach` (sobre creme) ou `--cream` (sobre pêssego). Renderizado em HTML/CSS onde possível; `assets/brand/wordmark.svg` (paths, sem dependência de fonte) onde precisa de imagem.
- **Ícone do app:** `a.` (a em Poppins 400 creme, ponto Bold creme) sobre quadrado `--peach`. PNG 192, 512 e maskable 512. Gerados por script a partir dos glifos extraídos do PDF.
- **Lockups prontos:** `assets/brand/logo-cream-on-peach.png` e `logo-peach-on-cream.png` (2048px, do PDF).
- **Contraste:** texto creme só sobre `--moss`, `--moss-d` ou `--peach-d`. Sobre `--peach` usar `--ink`.
- Tudo que é marca fica em `assets/brand/` + `app/css/variables.css` pra troca quando a continuação da ID chegar.

---

## 3. Estrutura do repositório

```
bibi/  (raiz do repo = raiz do site)
├── index.html                 landing
├── landing.css
├── assets/brand/              wordmark.svg, icon-*.png, lockups
├── app/
│   ├── index.html             shell do PWA (todas as telas como <section data-route>)
│   ├── manifest.json
│   ├── sw.js
│   ├── css/  variables.css · global.css · components.css · modules.css · print.css
│   ├── js/
│   │   ├── app.js             boot: router + registra SW + monta módulos
│   │   ├── router.js          hash routing, rotas protegidas, botão voltar
│   │   ├── store.js           get/set localStorage com chaves artesana_*
│   │   ├── ui.js              helpers DOM: toast, modal, lista iOS, copiar
│   │   ├── onboarding.js      etapas, progresso, prompts contextuais
│   │   ├── lib/               LÓGICA PURA, sem DOM, testável em Node
│   │   │   ├── whatsapp.js    montar link wa.me, validar DDD/número
│   │   │   ├── inci.js        ordenar/gerar lista INCI
│   │   │   ├── rotulo.js      cálculo de grade A4 (quantos cabem, posições em mm)
│   │   │   └── progresso.js   calcular etapas completas do onboarding
│   │   ├── data/
│   │   │   ├── ingredientes.js  tabela PT → INCI (~100 itens)
│   │   │   ├── datas.js         datas comemorativas BR
│   │   │   ├── roadmap.js       título + descrição dos sub-itens "em breve"
│   │   │   └── tutoriais.js     passos dos tutoriais (foto celular, página FB)
│   │   └── modules/           um por tela: login, home, social, rotulos, fotos,
│   │                          identidade, feedback, inpi, mais, perfil, planos,
│   │                          config, whatsapp, meta, tutorial, detalhe
│   └── vendor/qrcode.min.js   qrcode-generator 1.4.4 (MIT)
├── tests/                     node --test, importa app/js/lib/*
├── scripts/gen-brand.py       gera wordmark.svg + ícones a partir dos TTF subset
├── scripts/smoke.py           Playwright: abre todas as rotas, falha em erro de console
├── docs/                      briefing, specs, plans
├── .gitignore                 .superpowers/, scripts/fonts/ (subset ttf não vai pro repo público)
└── README.md
```

Caminhos relativos em todo lugar (`./`), porque o site vive em `/artesana/` e não na raiz do domínio. SW registrado com escopo `./` a partir de `app/`.

---

## 4. Navegação e telas

Igual à spec de março (§4, §5, §6, §7, §10, §12, §13), com estes deltas:

- Rota inicial: `#login` se não logado, senão `#home`.
- **Login simulado** continua (localStorage), com aviso "beta: seus dados ficam só neste aparelho".
- Sub-item sem função real abre `#detalhe/<id>` com título, descrição do que vai fazer e selo "Em breve". A descrição vem de um mapa em `js/data/roadmap.js`.
- Telas de detalhe têm "←" no header (history.back()).
- Header de cada tela mostra o wordmark pequeno à esquerda.

---

## 5. Funcionalidades reais da v1 (sem backend)

### 5.1 Link WhatsApp + QR (`#whatsapp`)
- Campos: DDD (2 dígitos), número (8-9 dígitos), mensagem opcional com 3 sugestões prontas.
- `lib/whatsapp.js`: `montarLink({ddd, numero, mensagem})` → `https://wa.me/55DDDNUMERO?text=...` (mensagem URL-encoded; sem `?text` se vazia). `validar()` retorna erro em PT.
- Botões: Copiar link, Testar (abre em nova aba), Baixar QR (PNG via canvas do qrcode-generator, 512px, módulo `--ink` sobre branco).
- Salva em `artesana_whatsapp`. Reutilizado em: card do dashboard, menu Mais, perfil, end card (identidade) e rótulos.

### 5.2 Checklist de identidade (`#identidade`)
- 6 itens: Nome da marca, Paleta, Logo, Frase de impacto, End card, Fotos coringas. Cada um com toggle "tenho" e, para Logo/Paleta/Fotos, botão "Enviar arquivo".
- Upload: `<input type=file>`; aceita pdf/png/jpeg/svg. Guarda só `{nome, tipo, tamanho, data}` em `artesana_identidade.arquivos` (sem o binário, localStorage não aguenta). Se extensão for psd/cdr/ai ou o usuário marcar "fiz no Canva", mostra orientação de exportar PNG/PDF.
- Nome da marca marcado automaticamente se `artesana_user.marca` preenchido.
- Barra "X de 6 prontos". Itens faltando linkam para o detalhe "em breve" do gerador correspondente.

### 5.3 Gerador INCI (`#rotulos` → INCI)
- `data/ingredientes.js`: lista `{pt, inci, funcao, alergenos?}` cobrindo bases de sabonete (óleos, manteigas, NaOH/KOH, glicerina), essências/óleos essenciais comuns, corantes, aditivos (argilas, mel, aveia, cafés), conservantes e emulsionantes usuais em cosmético artesanal. ~100 entradas.
- UI: busca com autocomplete, lista dos selecionados com setas ↑↓ (ordem = maior para menor concentração), campo livre pra ingrediente fora da tabela (usuário digita o INCI).
- `lib/inci.js`: `gerarInci(lista)` → string `"Sodium Olivate, Aqua, ..."`; alergênicos de óleo essencial (Linalool, Limonene, etc.) sugeridos como opcionais após o EO.
- Botões: Copiar, Usar no rótulo. Salva em `artesana_rotulos.inci`.

### 5.4 Rótulo básico → PDF (`#rotulos` → Criar)
- Tipos: Redondo (diâmetro mm), Retangular (largura × altura mm), Tag de presente (retângulo com furo). Presets: redondo 40/50/60, retangular 50×30, 70×40, 90×50, tag 50×80.
- Conteúdo: nome da marca, nome do produto, frase curta, peso/volume, lista INCI (opcional, fonte pequena), QR do WhatsApp (opcional), cor de fundo (chips: creme, pêssego, musgo claro, branco) e cor do texto automática por contraste.
- `lib/rotulo.js`: `gradeA4({largura, altura, margem=8, espaco=3})` → `{colunas, linhas, total, posicoes[]}` em mm. Redondo usa diâmetro como largura e altura.
- Preview na tela: um rótulo em escala + texto "cabem N por folha A4".
- Exportar: seção print-only com a folha A4 em CSS `@page { size: A4; margin: 0 }`, unidades mm, `window.print()`. Instrução curta: "escolha Salvar como PDF". Vetorial, sem lib de PDF.
- Sugestão de papel (texto fixo): casa = adesivo brilhante A4; gráfica = couchê 90g adesivo.

### 5.5 Tutoriais estáticos
- Foto com celular (6 passos) em `#fotos` → Aprender.
- Criar página no Facebook, versões mobile e desktop (7 passos cada) em `#tutorial-meta`. Sem imagens ilustrativas na v1 (texto + emoji); slot pronto pra imagem depois.

### 5.6 Datas comemorativas
- `data/datas.js`: lista fixa (Dia das Mães, Namorados, Pais, Primavera, Black Friday, Natal, Páscoa etc.) com mês/dia e sugestão de gancho. Exibida em `#rotulos` → Datas e como chip no rótulo.

---

## 6. Landing (`/index.html`)

Uma página, mobile-first, largura máx. 1080px, fundo `--cream`:

1. **Hero** sobre `--peach`: wordmark grande em creme, frase "o app da empreendedora que faz, vende e fotografa", botões "Abrir o app" (→ `app/`) e "Ver planos".
2. **Pra quem é**: 3 cards (saboaria, artesanato, beleza natural).
3. **Módulos**: grid dos 6 com ícone, título e uma linha.
4. **Como instalar**: 2 colunas, Android (Chrome → Adicionar à tela inicial) e iPhone (Safari → Compartilhar → Tela de Início).
5. **Planos**: 3 cards Semente/Florescer/Prosperar com "em breve" no botão dos pagos.
6. **Rodapé**: wordmark, "beta", link do app.

Sem formulário, sem analytics, sem backend.

---

## 7. PWA

- `manifest.json`: name/short_name `artesaná.`, `start_url: "./"`, `scope: "./"`, `display: standalone`, `theme_color: #4A6348`, `background_color: #FFF5EF`, ícones 192/512 + maskable.
- `sw.js`: versão em constante `CACHE = "artesana-v1"`. Precache de todos os arquivos do app (lista explícita). Estratégia cache-first pra tudo do escopo, network-first pra `index.html` (pra pegar versão nova), stale-while-revalidate pra Google Fonts. `activate` apaga caches antigos. Bump da constante a cada deploy.
- `<meta name="apple-mobile-web-app-*">` + `apple-touch-icon` pro iOS.

---

## 8. Dados locais

Chaves e formato como na spec de março §15, mais:

```
artesana_identidade → { itens: {nome, paleta, logo, frase, endcard, fotos}, arquivos: [] }
artesana_rotulos    → { inci: [{pt, inci}], ultimoRotulo: {...campos §5.4} }
```

`store.js` expõe `get(chave, padrão)`, `set(chave, valor)`, `limparTudo()`. Todo JSON, com try/catch.

---

## 9. Testes

- `node --test tests/` cobre `lib/whatsapp.js`, `lib/inci.js`, `lib/rotulo.js`, `lib/progresso.js`. Exemplos: link com e sem mensagem, DDD inválido, ordenação INCI, grade A4 pra 50mm redondo, progresso 0..5.
- Smoke com Playwright (`scripts/smoke.py`): sobe `python -m http.server`, abre cada rota do app e a landing em viewport 375×812, falha se houver erro no console ou section vazia.
- Verificação manual no celular antes de anunciar: instalar na tela inicial, abrir offline.

---

## 10. Deploy

1. `git init` em bibi, `.gitignore`, commit inicial.
2. `gh repo create artesana --public --source=. --push`.
3. Ativar Pages: `gh api -X POST repos/bebezinbtc-droid/artesana/pages -f build_type=legacy -f source[branch]=main -f source[path]=/`.
4. Esperar build e verificar `curl -I` na URL.
5. Atualizações: commit + push. SW com cache versionado garante que o celular pega a nova versão no segundo acesso.

---

## 11. Fora do escopo (próximas fases)

- Backend + login real + IA (logo, legendas, foto, análise Instagram).
- Meta Business API (agendamento).
- Pagamento (Stripe/Mercado Pago) e planos reais.
- Domínio próprio: só DNS CNAME + campo "custom domain" no Pages.
- App nas lojas: Android via TWA (Bubblewrap) apontando pra esta URL, conta Google Play US$25; iOS via Capacitor, Mac + conta Apple US$99/ano.
- INPI classe 42 é trâmite manual do dono, fora do código.
