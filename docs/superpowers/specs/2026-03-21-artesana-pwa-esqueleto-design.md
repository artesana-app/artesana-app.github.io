# artesaná. — Spec: Esqueleto do PWA

**Data:** 2026-03-21
**Escopo:** Estrutura navegável do app — shell, navegação, onboarding progressivo, telas base dos módulos
**Stack:** HTML/CSS/JS puro, multi-arquivo vanilla, sem framework

---

## 1. Visão Geral

App PWA para pequenas empreendedoras de artesanato, saboaria e beleza natural. O esqueleto é a primeira entrega: toda a estrutura navegável com layout montado nos módulos prioritários e placeholders nos secundários.

**O que está no escopo:**
- Shell do app (index.html com todas as telas)
- Navegação: tab bar + dashboard + menu "Mais"
- Login com Facebook/Instagram/E-mail
- Integração Meta Business (fluxo + tutorial)
- Onboarding progressivo (contextual por módulo)
- 6 módulos com telas base
- Gerador de link WhatsApp
- Tela de planos (Semente/Florescer/Prosperar)
- Service Worker + manifest.json

**O que NÃO está no escopo:**
- Backend / APIs de IA
- Funcionalidades reais (geração de logo, edição de foto, etc.)
- Agendamento real via Meta Business API
- Pagamento / assinatura

---

## 2. Estrutura de Arquivos

```
bibi/
├── index.html              ← Shell do app (todas as telas como <section>)
├── manifest.json            ← Configuração PWA
├── sw.js                    ← Service Worker para cache offline
├── css/
│   ├── variables.css        ← Tokens da paleta (--moss, --peach, etc.)
│   ├── global.css           ← Reset, tipografia, layout base
│   ├── components.css       ← Tab bar, cards, botões, inputs, listas
│   └── modules.css          ← Estilos específicos de cada módulo
├── js/
│   ├── app.js               ← Roteamento hash + inicialização
│   ├── onboarding.js        ← Lógica do onboarding progressivo
│   └── modules/
│       ├── home.js           ← Dashboard
│       ├── conteudo-social.js
│       ├── rotulos.js
│       ├── fotos-videos.js
│       ├── identidade.js
│       ├── feedback.js
│       ├── inpi.js
│       ├── whatsapp.js      ← Gerador de link + QR code
│       ├── login.js         ← Login simulado (localStorage)
│       ├── perfil.js        ← Dados da marca + onboarding
│       ├── planos.js        ← Cards dos planos
│       ├── config.js        ← Configurações (toggle, limpar dados)
│       └── meta-tutorial.js ← Tutorial criar página Facebook
└── assets/
    └── icons/               ← Ícones do PWA (192x192, 512x512)
```

**Princípios:**
- Sem dependências externas além do Google Fonts (Playfair Display + Poppins) — fontes cacheadas pelo Service Worker para offline
- Exceção: biblioteca `qrcode.js` (~10KB) para geração de QR Code no link WhatsApp
- Cada tela é um `<section id="tela-xxx">` — JS alterna classe `.active`
- CSS separado por responsabilidade
- Um JS por módulo para isolar lógica
- Sem build system — funciona direto no navegador

---

## 3. Identidade Visual (Tokens CSS)

```css
:root {
  --moss:    #4A6348;   /* Cor principal, nav, botão primário */
  --moss-d:  #344838;   /* Fundo escuro, header */
  --peach:   #DE9060;   /* CTA, ponto do a., badges de ação */
  --peach-l: #F2BE9A;   /* Destaques suaves */
  --gold:    #CC9828;   /* Detalhes premium, divisores, badge PRO */
  --cream:   #FCF5EA;   /* Fundo principal */
  --ink:     #2C1A1E;   /* Texto principal */
}
```

- **Fonte título:** Playfair Display Bold, letter-spacing: -3px
- **Fonte corpo:** Poppins 400/600
- **Elemento de marca:** `artesaná.` — ponto em `--peach`
- **Ícones:** Emojis nativos (sem biblioteca de ícones)

---

## 4. Navegação

### 4.1 Tab Bar (barra inferior fixa)

5 itens, fundo `--moss`, sempre visível:

| Posição | Ícone | Label    | Rota      |
|---------|-------|----------|-----------|
| 1       | 🏠    | Home     | `#home`   |
| 2       | 📱    | Social   | `#social` |
| 3       | 🏷️    | Rótulos  | `#rotulos`|
| 4       | 📸    | Fotos    | `#fotos`  |
| 5       | ⋯     | Mais     | `#mais`   |

- Item ativo: opacidade 1 + font-weight 600
- Itens inativos: opacidade 0.5

### 4.2 Roteamento por Hash

```
#home        → Dashboard
#social      → Conteúdo Social
#rotulos     → Rótulos & Etiquetas
#fotos       → Fotos & Vídeos Pro
#mais        → Menu Mais
#identidade  → Identidade Visual
#feedback    → Feedback
#inpi        → Verificação INPI
#perfil      → Meu Perfil / Onboarding
#planos      → Planos
#config      → Configurações
#login       → Tela de Login
#whatsapp    → Gerador de Link WhatsApp
#tutorial-meta → Tutorial Criar Página Facebook
```

- `app.js` escuta `hashchange` e alterna `display:none` / `display:block` nas sections
- Rota padrão: `#login` se não logado, `#home` se logado
- Rotas protegidas: qualquer rota exceto `#login` redireciona para `#login` se `artesana_user.logado` for falso

### 4.3 Navegação de Volta

- Telas da tab bar (home, social, rotulos, fotos, mais): sem botão voltar, navegação pela tab bar
- Sub-telas acessadas pelo menu "Mais" ou dashboard (#identidade, #feedback, #inpi, #perfil, #planos, #config, #whatsapp, #tutorial-meta): exibem seta "←" no header que volta para a tela anterior (`history.back()`)
- Tab bar permanece visível em todas as telas, com "Mais" destacado quando em sub-telas do menu Mais
- Botão voltar do navegador/celular funciona naturalmente com hash routing

### 4.4 Comportamento dos Sub-itens no Esqueleto

Regra geral para os itens de lista dentro dos módulos com layout montado (8.1 a 8.4):
- Cada item é uma **lista clicável** (estilo iOS)
- Ao tocar, exibe uma **tela de detalhe** com: título, descrição do que a funcionalidade vai fazer, e mensagem "Funcionalidade em desenvolvimento"
- Exceção: itens que já funcionam no esqueleto (ex: gerador de link WhatsApp, checklist de identidade)

---

## 5. Login e Autenticação

### 5.1 Tela de Login

3 opções de entrada:
- **Continuar com Facebook** — botão azul #1877F2
- **Continuar com Instagram** — botão gradiente rosa/laranja
- **Continuar com E-mail** — botão branco com borda → exibe campos: e-mail + senha + botão "Entrar". Salva `loginTipo: "email"` no localStorage.

Nesta fase (esqueleto), todos os logins são simulados — qualquer entrada salva estado no localStorage e redireciona para `#home`. Não há validação real.

### 5.2 Integração Meta Business (fluxo)

Pós-login com Facebook/Instagram (não exibido para login via e-mail):

1. Verificar se tem Página no Facebook
2. **Se SIM** → conectar ao Meta Business (simulado — exibe badge "✅ Conectado" e salva `artesana_meta: { conectado: true, temPagina: true }`)
3. **Se NÃO** → duas opções:
   - **Criar automaticamente** — exibe animação de loading (2s), depois card de sucesso "Página criada!". Salva `artesana_meta: { conectado: true, temPagina: true }` no localStorage.
   - **Tutorial passo a passo** — versões Mobile (7 passos) e Desktop (7 passos), cada passo com imagem ilustrativa. Ao final, botão "Já criei, conectar agora" que salva o estado.

Para login via e-mail: o Meta Business aparece no menu "Mais" com status "Não conectado" e link para conectar via Facebook.

Status de conexão exibido como badge no header do Conteúdo Social e no menu Mais.

---

## 6. Onboarding Progressivo

Em vez de bloquear a entrada, o app pede informações conforme a pessoa usa cada módulo:

| Momento                      | O que pede                                          |
|------------------------------|-----------------------------------------------------|
| Primeiro acesso              | Nome + "Tem uma marca?"                             |
| Ao usar Identidade Visual    | Nicho, história da marca, personalidade, público-alvo |
| Ao usar Conteúdo Social      | @ do Instagram, 3 perfis de referência              |
| Ao usar Rótulos              | Ingredientes, tipo de produto                       |

**5 etapas contabilizadas na barra de progresso:**

| #  | Etapa                  | Campo localStorage               | Gatilho                     |
|----|------------------------|-----------------------------------|-----------------------------|
| 1  | Nome e marca           | `artesana_user.nome/marca`        | Primeiro acesso             |
| 2  | Nicho do produto       | `artesana_onboarding.nicho`       | Ao abrir Identidade Visual  |
| 3  | História da marca      | `artesana_onboarding.historia`    | Ao abrir Identidade Visual  |
| 4  | Personalidade e público| `artesana_onboarding.personalidade/publicoAlvo` | Ao abrir Identidade Visual |
| 5  | Instagram e referências| `artesana_instagram.arroba/perfisReferencia` | Ao abrir Conteúdo Social |

**Como as etapas 2-4 são apresentadas:** ao abrir Identidade Visual pela primeira vez, exibe um formulário único com todos os campos (nicho, história, personalidade, público-alvo) em uma sequência de passos dentro do mesmo modal. Nas visitas seguintes, o formulário não reaparece — só é acessível pelo Meu Perfil.

**Onboarding do módulo Rótulos:** ao abrir Rótulos pela primeira vez, exibe prompt inline pedindo ingredientes e tipo de produto. Esse dado é salvo em `artesana_onboarding.tipoProduto` mas **não conta** na barra de progresso "X de 5" — é um dado complementar usado apenas dentro do módulo.

**Dashboard mostra:**
- Barra de progresso: "X de 5 completos" (calculado verificando quais campos acima estão preenchidos)
- Dica contextual que muda conforme o que falta
- Texto: "Complete para desbloquear sugestões personalizadas"

**Questionário da história da marca:**
- Formulário com texto livre + opções sugeridas
- Opções relevantes para pequenos empreendedores sem conhecimento de branding
- Adapta criando conexão emocional com a marca
- Dados usados para: logo, frase de impacto, legendas, sugestões

---

## 7. Dashboard (Home)

Estrutura de cima para baixo:

1. **Header escuro** (`--moss-d`) — saudação com hora do dia + nome da marca + avatar (inicial em círculo `--peach`)
2. **Barra de onboarding** — progresso do perfil dentro do header
3. **Dica contextual** — card com borda esquerda `--gold`, muda conforme o que falta
4. **Grid 2x3** — cards dos 6 módulos, cada um clicável (navega para a rota do módulo). Bolinha `--peach` = ação pendente.
   - 🎨 Identidade Visual → `#identidade`
   - 📱 Conteúdo Social → `#social`
   - 🏷️ Rótulos & Etiquetas → `#rotulos`
   - 📸 Fotos & Vídeos → `#fotos`
   - 💬 Feedback → `#feedback`
   - 🔍 Verificação INPI → `#inpi`
5. **Link WhatsApp** — card `--moss` com link + botão copiar
6. **Plano atual** — card com borda `--gold`, plano + botão "Evoluir"

---

## 8. Módulos — Telas Base

### 8.1 Conteúdo Social (layout montado)

Organizado em 3 grupos com listas estilo iOS:

**Criar:**
- Calendário Editorial — sugestão mensal automatizada
- Gerador de Legendas — post, story, reel, carrossel, na voz da marca
- Editor de Reels — até 2min, 3 opções: voz própria (gravar), IA humanizada (vozes reais, não robóticas), somente imagens + música. Captação humana (app edita o relevante do vídeo). Modelo IA realista que fala diretamente com o público.

**Analisar:**
- Análise de Perfil Instagram — questionário "Já tem Instagram?" → pedir @ → analisar → sugestões de bio, destaques, post fixo, frequência, tipos de stories, formato de reels (falado, produto, roteiro)
- Perfis de Referência — pede 3 perfis de inspiração → cria estilo baseado neles, formatos bonitos que convertem em vendas
- Análise de Público — conexão marca + público-alvo

**Agendar:**
- Agendar Publicação — post, story ou reel via Meta Business. *No esqueleto: item visível, ao tocar exibe mensagem "Conecte o Meta Business para agendar" ou "Em breve" se já conectado.*
- Métricas — alcance, engajamento, melhores horários (badge PRO). *No esqueleto: item visível com badge PRO, ao tocar exibe tela do plano Florescer.*

**Onboarding contextual:** banner `--peach` pedindo @ do Instagram.

### 8.2 Rótulos & Etiquetas (layout montado)

Organizado em 4 grupos:

**Criar:**
- Rótulo Redondo — tampas e potes
- Rótulo Retangular — frascos, garrafas, caixas
- Tag de Presente — pendurar com barbante ou fita
- Datas Comemorativas — Natal, Dia das Mães, Páscoa, personalizados

**Embalagem:**
- Tamanhos em Folha A4 — quantidades automáticas por folha
- Sugestão de Papel — casa: adesivo brilhante / gráfica: couchê 90g

**Personalizar:**
- Nome & Frase de Venda — marca + frase que conecta com o cliente
- Gerador INCI — lista de ingredientes automática
- QR Code WhatsApp — inclui no rótulo para contato direto

**Ação:** botão "Exportar PDF 300dpi — Pronto para Gráfica"

### 8.3 Fotos & Vídeos Pro (layout montado)

**Fotos:**
- Editar Foto com IA — remove fundo, aplica identidade visual
- Escolher Estilo — pergunta ANTES de editar: Natural, Botânico, Rústico, Blush, Estúdio, Eco (carrossel horizontal com cores)

**Vídeos:**
- Editar Vídeo — trilha sonora, texto, identidade visual
- Locução — 3 opções detalhadas:
  - 🗣️ Gravar minha voz (direto no app)
  - 🤖 Voz IA humanizada (vozes reais, naturais, não robóticas)
  - 🎵 Só trilha sonora (imagens + música)

**Presets da marca:** Verde Musgo, Pêssego Suave, Golden Moss, Terra Viva (chips visuais com cor)

**Aprender:** Tutorial Foto com Celular (6 passos)

### 8.4 Identidade Visual (layout montado)

**Onboarding contextual:** banner `--peach` pedindo história da marca.

**Checklist — Sua Identidade:**
- Lista automática do que tem pronto (✓) vs o que falta (badge "criar")
- Itens: Nome da marca, Paleta de cores, Logo, Frase de impacto, End card, Fotos coringas
- Sugestão: "Podemos sugerir uma identidade completa com base na sua história"
- Se já tem identidade: questiona se pode sugerir nova

**Upload de Arquivos:**
- Aceitos direto: PDF, PNG, JPEG, SVG
- PSD, CDR, Canva: orientação de como converter e enviar
- Se incompatível: sugere formatos e formas de enviar
- Analisa o que foi enviado, identifica o que tem pronto e o que falta

**Criar com IA:**
- Gerador de Logo — 3 opções exclusivas (sem templates/referências de Canva), criar e personalizar
  - Caixa de Remix: "Quero a tipografia da 1 com as cores da 3..."
  - Botão "Reformular com base no pedido"
  - Opções sugeridas relevantes para pequeno empreendedor sem conhecimento de marca
- Frase de Impacto — baseada na história da marca, criando conexão
- End Card para Reels — contato, WhatsApp, formas de compra

**Fotos Coringas:** sugestões de fotos com produtos que façam o consumidor imaginar sua marca ali

### 8.5 Feedback (placeholder)

- Título + descrição: "Conte seus desafios, sugestões e avalie o app"
- Ilustração/ícone
- Mensagem "Em breve"

### 8.6 Verificação INPI (placeholder)

- Título + descrição: "Verifique se o nome da sua marca está disponível"
- Ilustração/ícone
- Mensagem "Em breve"

---

## 9. Gerador de Link WhatsApp

Acessível em 4 pontos do app:
- **Dashboard** — card com link + botão copiar
- **Identidade Visual** — end card para reels
- **Meu Perfil** — dados de contato
- **Menu Mais** — seção "Contato"

**Campos:**
- +55 (fixo) | DDD (campo separado) | Número
- Mensagem automática (opcional) — personalizada pela cliente
- Sugestões prontas: "Olá! Quero fazer um pedido", "Oi! Vi seus produtos e amei"

**Resultado:**
- Link curto direto: `wa.me/55DDD00000000`
- Botão Copiar (para bio do Instagram)
- Botão Testar (abre WhatsApp)
- QR Code gerado automaticamente — salvar PNG ou usar em rótulo

**Reutilização:** bio, end card, rótulos (QR code), sugestão de bio.

---

## 10. Menu "Mais"

Header com avatar + nome da marca + plano atual.

Organizado em grupos estilo iOS:

**Ferramentas:** Identidade Visual, Feedback, Verificação INPI

**Contato:** Link WhatsApp com botão copiar rápido

**Sua Conta:**
- Meu Perfil (badge progresso onboarding)
- Meta Business (status de conexão)
- Planos (badge "Evoluir")
- Configurações

**Extra:** Card do Tutorial "Criar Página no Facebook" (mobile + desktop)

**Rodapé:** "Sair da conta"

---

## 11. Planos

3 cards com comparativo:

| Plano      | Preço      | Descrição                    |
|------------|------------|------------------------------|
| 🌱 Semente  | Grátis     | Funcionalidades limitadas    |
| 🌸 Florescer| R$47/mês   | Uso profissional             |
| 🌳 Prosperar| R$127/mês  | Operação completa + Academia |

*Nota: preços são para layout apenas. Valores finais serão definidos antes da integração de pagamento.*

---

## 12. Tela Meu Perfil (#perfil)

Estrutura de lista estilo iOS:

**Dados Pessoais:**
- Nome (editável)
- E-mail ou conta social vinculada (somente leitura)

**Dados da Marca:**
- Nome da marca (editável)
- Nicho (seleção: sabonetes, velas, cosméticos, alimentos, artesanato)
- História da marca (texto livre, editável)
- Personalidade (seleção: delicada, rústica, sofisticada, alegre)
- Público-alvo (texto livre)

**Contato:**
- Link WhatsApp (exibe link + botão editar → `#whatsapp`)
- @ Instagram (editável)

**Progresso do Onboarding:** barra visual com "X de 5 completos" + lista de etapas com status

Cada campo preenchido atualiza o localStorage correspondente e recalcula a barra de progresso.

---

## 13. Tela Configurações (#config)

Tela simples com lista:

- **Notificações** — toggle on/off (simulado, salva no localStorage)
- **Idioma** — Português (fixo nesta fase)
- **Sobre o artesaná.** — versão do app, link para termos de uso
- **Limpar dados** — apaga localStorage e volta para `#login`

---

## 14. PWA (Service Worker + Manifest)

**manifest.json:**
- name: "artesaná."
- short_name: "artesaná."
- theme_color: #4A6348
- background_color: #FCF5EA
- display: standalone
- icons: 192x192 e 512x512

**sw.js:**
- Cache-first para todos os assets estáticos (HTML, CSS, JS, fontes Google, ícones, qrcode.js)
- Nesta fase não há dados dinâmicos — tudo é local (localStorage)
- Como todas as telas estão dentro de `index.html`, cachear o HTML + assets garante funcionamento offline completo

---

## 15. Dados Locais (localStorage)

Nesta fase, todos os dados ficam no navegador:

```
artesana_user       → { nome, marca, logado, loginTipo }
artesana_onboarding → { etapasCompletas, nicho, historia, personalidade, publicoAlvo, tipoProduto }
artesana_instagram  → { arroba, perfisReferencia }
artesana_whatsapp   → { numero, ddd, mensagem, link }
artesana_meta       → { conectado, temPagina }
artesana_plano      → "semente" | "florescer" | "prosperar"
```

---

## 16. Responsividade

- **Mobile-first** — projetado para 375px de largura
- **Máximo 480px** — mantém layout mobile em telas maiores
- Tab bar sempre fixa na base
- Scroll vertical dentro de cada tela
- Inputs e botões com min-height 44px (toque confortável)
