# artesaná. — Briefing Completo para Desenvolvimento

## Sobre o Produto
Aplicativo mobile para pequenas empreendedoras de artesanato, saboaria e beleza natural.
Simplifica a vida de quem é produtora, vendedora, fotógrafa e gestora ao mesmo tempo.

---

## Identidade Visual

**Nome:** artesaná.
**Elemento de marca:** `a.` minimalista — letra em tinta escura, ponto em pêssego
**Fonte principal:** Playfair Display Negrito, kerning -6px (letras juntinhas)
**Fonte corpo/interface:** Poppins ou Nunito
**Tom de voz:** acolhedor, alegre, como reunião de amigas empreendedoras

### Paleta
| Token       | Hex       | Uso                              |
|-------------|-----------|----------------------------------|
| `--moss`    | `#4A6348` | Cor principal, nav, botão primário |
| `--moss-d`  | `#344838` | Fundo escuro, cabeçalho          |
| `--peach`   | `#DE9060` | CTA, ponto do elemento `a.`      |
| `--peach-l` | `#F2BE9A` | Destaques suaves                 |
| `--gold`    | `#CC9828` | Detalhes premium, divisores      |
| `--cream`   | `#FCF5EA` | Fundo principal                  |
| `--ink`     | `#2C1A1E` | Texto principal                  |

---

## Módulos do App

### 1. Identidade Visual
- Upload de arquivos existentes (PDF, PNG, SVG, JPEG — PSI/CDR orientar conversão)
- Lista de verificação do que está pronto e do que falta
- Gerador de logomarca com IA — 3 opções + caixa de remix
- Gerador de frase de impacto baseada na história da marca
- Cartão final para reels com contato e formas de compra
- Sugestões de fotos coringas para produto

### 2. Rótulos, Etiquetas & Tags
- Modelos: redondo, retangular, tag de presente
- Tamanhos baseados em folha A4 (quantidades automáticas)
- Gerador de INCI automático por ingredientes
- Sugestão de papel: casa (adesivo brilhante) e gráfica (couchê 90g)
- Datas comemorativas e personalizados
- Exportação PDF 300dpi pronto para gráfica

### 3. Conteúdo Social
- Calendário editorial mensal automatizado
- Gerador de legendas na voz da marca
- Tipos: publicação, story, reel, carrossel
- Reel com IA — opção de gravar a própria voz ou avatar IA humanizado
- Análise do perfil Instagram via @ — sugestões de bio, destaques, publicação fixada, frequência
- Solicitar 3 perfis de referência e criar estilo baseado neles
- Roteiro para captação humana ou modelo IA realista

### 4. Fotos & Vídeos Profissionais
- Transformação de foto com IA: remove fundo, aplica identidade visual
- 6 estilos: Natural, Botânico, Rústico, Blush, Estúdio, Eco
- Predefinições da marca (Verde Musgo, Pêssego Suave, Golden Moss, Terra Viva)
- Edição de vídeo: trilha sonora, texto, identidade visual
- Locução: voz da empreendedora, voz IA humanizada, ou só trilha sonora
- Tutorial de fotografia com celular (6 passos)

### 5. Formulário de Feedback
- Coleta desafios, sugestões e avaliação
- IA analisa respostas e gera resumo com sugestão de ação para a Maria

### 6. Verificação INPI
- Busca de disponibilidade do nome
- Passo a passo de registro como pessoa física (sem CNPJ)
- Classe 42 para aplicativos/software
- Custos e prazos atualizados (2025)

---

## Integração (Quiz em 4 etapas)
1. Nicho do produto (sabonetes, velas, cosméticos, alimentos, artesanato)
2. História da marca (texto livre + público-alvo + sentimento desejado)
3. Personalidade (delicada, rústica, sofisticada, alegre)
4. Nome da marca → gera identidade completa

---

## Modelo de Negócio
Freemium com 3 planos:
- **Semente** — grátis, funcionalidades limitadas
- **Florescer** — R$47/mês, uso profissional
- **Prosperar** — R$127/mês, operação completa + Academia

---

## Tecnologia Atual (PWA Beta)
- HTML/CSS/JS puro — arquivo único
- Service Worker para cache offline
- manifest.json configurado para instalação (iOS + Android)
- Sem dependências externas além do Google Fonts

## Arquivos Entregues
- `index.html` — aplicativo completo navegável
- `manifest.json` — configuração PWA
- `sw.js` — service worker offline

---

## Próximos Passos
- [ ] Hospedar PWA em servidor (Vercel, Netlify ou similar)
- [ ] Testar e iterar ferramentas com a Maria
- [x ] Criar página de apresentação do artesaná.
- [ ] Integrar APIs de IA (geração de logo, legenda, foto)
- [ ] Publicar na App Store e Google Play
- [ ] Registrar marca no INPI (Classe 42, pessoa física)
