# Instagram @artesana.app — primeiras três publicações

Formato: 1080 × 1350 (4:5), JPG. Publicar na ordem 1, 2, 3, em dias diferentes.
Na grade do perfil a mais recente aparece primeiro, então a fileira fica: chamada, app, propósito.

Antes de publicar: colocar o endereço do site no campo "Site" da bio.

---

## 1. Propósito — `post-1.jpg`

**Legenda**

Você faz o produto, tira a foto, responde cliente no WhatsApp e ainda pensa no post de amanhã.

A gente sabe como é, porque o artesaná. nasceu olhando pra essa rotina. É um app feito pra quem vive de artesanato e cuida de tudo sozinha: produzir, vender e divulgar.

Ele ajuda naquilo que toma tempo e ninguém ensina: o rótulo do produto, a lista de ingredientes, o link do WhatsApp e a cara da marca.

Já está no ar, em versão beta, e é grátis pra começar. O link está na bio.

Conta pra gente: qual dessas três partes mais pesa no seu dia?

#artesanato #feitoamao #artesanatobrasileiro #saboariaartesanal #velasartesanais #cosmeticosnaturais #empreendedorismofeminino #pequenosnegocios

**Texto alternativo**

Mulher sorrindo, apoiada numa mesa ao ar livre, segurando um celular. Texto: Você produz, vende e divulga. O artesaná. nasceu pra ajudar quem faz tudo isso sozinha.

---

## 2. O app — `post-2.jpg`

**Legenda**

Seu ateliê cabe no celular.

O que já dá pra fazer hoje no artesaná.:

Rótulo em PDF, redondo, retangular ou tag de presente, com a folha A4 montada pra imprimir em casa ou mandar pra gráfica.

Lista de ingredientes no padrão INCI. Você escolhe em português e copia pronta.

Link do WhatsApp com mensagem automática e QR code pra colocar na bio e na embalagem.

Checklist da identidade da marca, pra ver o que você já tem e o que ainda falta.

Abre no navegador e instala na tela inicial, no Android e no iPhone. O link está na bio.

#artesanato #rotulos #saboariaartesanal #cosmeticosnaturais #velasartesanais #identidadevisual #feitoamao #pequenosnegocios

**Texto alternativo**

Mulher de camisa cinza e faixa branca no cabelo mostra um celular com a tela inicial do app artesaná. Texto: Seu ateliê cabe no celular. Rótulo em PDF, link do WhatsApp e identidade da marca num app só. Selo: grátis pra começar.

---

## 3. Chamada — `post-3.jpg`

**Legenda**

A versão beta do artesaná. está aberta, e começar é grátis.

Como entrar:

1. Toque no link da bio.
2. Abra o app e diga o nome da sua marca.
3. Crie o primeiro rótulo do produto que você mais vende.

Leva poucos minutos e seus dados ficam só no seu aparelho.

Conhece alguém que faz sabonete, vela, cosmético natural ou artesanato? Marca aqui nos comentários.

#artesanato #feitoamao #saboariaartesanal #velasartesanais #cosmeticosnaturais #empreendedorismofeminino #artesanatobrasileiro #pequenosnegocios

**Texto alternativo**

Mulher de chapéu vermelho fotografa com o celular uma vela artesanal perto de uma janela. Texto: Comece grátis hoje. Versão beta aberta pra quem faz sabonete, vela, cosmético natural e artesanato. Selo: beta aberto.

---

## Como regenerar

```bash
python scripts/gen-instagram.py                    # assinatura "link na bio"
python scripts/gen-instagram.py --bio artesana.app # depois de registrar o domínio
```

Modelos em `modelos/post-N.html` e `modelos/estilo.css`. Textos das peças ficam nos HTML.

## Fotos

Banco Pexels, licença livre para uso comercial, sem obrigação de crédito. As pessoas são modelos de banco de imagem: a licença não permite dar a entender que elas usam ou recomendam o produto, por isso nenhum texto das peças está em forma de depoimento.

| Peça | Autor | Página |
|---|---|---|
| 1 | Matheus Bertelli | https://www.pexels.com/photo/smiling-woman-in-blouse-holding-a-smartphone-11749490/ |
| 2 | Tima Miroshnichenko | https://www.pexels.com/photo/woman-in-gray-long-sleeve-shirt-standing-while-holding-smartphone-6612222/ |
| 3 | RDNE Stock project | https://www.pexels.com/photo/woman-taking-pictures-using-a-smartphone-7309930/ |

Na peça 2 o fundo rosa da foto foi levado para o pêssego da marca e a tela do celular mostra a tela inicial real do app.
