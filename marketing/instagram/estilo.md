# Estilo das publicações do artesaná.

Guia curto do que a equipe aprovou até aqui, pra toda peça nova sair na mesma linha. Os modelos ficam em
`modelos/`, o gerador é `scripts/gen-instagram.py`, as fotos vêm de `scripts/gen-fotos-ia.py`.

## O que vale pra tudo

- Formato 1080 × 1350 (4:5). Nenhum texto a menos de 120 px de qualquer borda: o gerador recusa a peça se passar.
- No máximo três fontes por peça: Fraunces (frase), Homemade Apple (recado à mão), Poppins (marca, avisos, caixa alta).
- A frase da imagem é de conexão, sem venda. O que o app faz vai na legenda, com "o link está na bio".
- Foto realista, gente de verdade trabalhando, mulheres 40+, mãos, produto. Sem pose, sem estúdio, sem marca de terceiros.
- Cores da marca: creme #FFF5EF, pêssego #FFB18B, musgo #4A6348, tinta #2C1A1E. Dourado só em detalhe.
- A marca aparece pequena, `artesaná.` em Poppins, com o ponto pêssego.
- Na grade do perfil, peças claras e escuras se alternam (xadrez). Ímpares escuras ou de foto inteira; pares claras.

## O que a equipe rejeitou

- Barra creme + bloco + selo ("muito layout").
- Texto colado na borda, foto sem enquadramento no rosto ou nas mãos.
- Tom comercial na imagem, CTA gritando. Fotos de banco com cara de modelo de estúdio.

## Composições aprovadas

Série ateliê (peças 1 a 6):

- `inteira`: foto na peça toda, texto na área calma, alinhado à esquerda.
- `bilhete`: foto até 820 px e papel creme embaixo com a frase e o recado.
- Bordado: na peça do bastidor, a frase sai bordada no linho (`scripts/bordado.py`).

Referências que a equipe curtiu em 30/09/2026 (perfis de vela e saboaria), aplicadas nos sete dias de fim de ano (dia1 a dia7):

- `noite`: foto escura de luz de vela, frase pequena em itálico leve numa área calma, marca centrada embaixo.
- `arco`: frase curta em caixa alta com espaçamento largo, seguindo um arco em volta da chama ou do produto.
- `editorial`: título em serifa caixa alta centrado no alto, linha pequena em Poppins caixa alta, produto no meio de papel de seda amassado.
- `grito`: frase grande em Poppins leve + negrito tomando a foto ("Em terra de IA, o feito à mão é o verdadeiro luxo").
- `anotada`: recados à mão com setas apontando pro produto, como quem explica o que tem dentro.

## Ajustes aprovados em 30/09/2026

- Letra de mão sempre alinhada à esquerda com a frase de cima, sem inclinação.
- Nada de fundo bege liso em carrossel: foto inteira com um painel creme alinhado às margens.
- Etiqueta de produto na foto sempre com texto ("sua marca"), nunca em branco.
- Reel tem que ser vídeo de verdade (Pexels ou gravado), com texto animado alinhado.
- Foto de pessoa: banco de imagens ou IA conferida em zoom; rosto deformado não passa.
- A marca pode virar só "a." discreto quando a foto já é forte.
- Letra de mão: bege claro com sombra quando está sobre foto; a distância pra frase de cima é curta (metade de uma linha).
- Reels: só a marca embaixo do texto, sem linha de apoio.
- Bordado: linha bege pro recado e pro ponto da marca; a marca vai dentro do bastidor. Foto sem mãos: scripts/bordado-sem-maos.py.

## Reels

- 1080 × 1920, 10 a 12 segundos, foto com zoom lento e o texto entrando em camadas (`scripts/gen-reels.py`).
- Sem áudio no arquivo: a música entra na hora de publicar, pela biblioteca do Instagram, que é o que faz o reel circular.
- Texto fora da área dos botões: nada acima de 250 px nem abaixo de 340 px do fim. O gerador confere.
- A capa é o último quadro, com tudo visível; no perfil ela aparece cortada em 3:4, então o texto fica no centro.

## Ideias de foto pra fazer em casa, com o celular

Fim de ano:

- Mãos embrulhando um presente em kraft com barbante, fatia de laranja seca e raminho de pinheiro, só com a luz de uma vela.
- Vela ou sabonete no centro de papel de seda amassado, luz da janela, bastante papel vazio em volta.
- Mão acendendo uma vela com fósforo de madeira, ambiente escuro atrás.
- Kit de Natal aberto sobre linho, visto de cima: sabonetes, vela, canela, laranja seca, tag em branco.
- Mesa de ceia pequena à noite, só com velas, guardanapo de linho, ramos de pinheiro, sem gente.
- Duas mãos entregando um presente pequeno, árvore desfocada atrás, luz do dia.
- Caderno aberto na mesa à noite, planejando o ano, com os produtos ao lado.

Sempre: luz natural ou de vela, fundo limpo, produto sem rótulo de terceiros, uma área calma pro texto.

## Grade "mais foto" (01/10/2026)

Pedido literal: "tô achando com muita escrita, acho que quero só mais foto, pode ter uma escrita ou outra, não precisa nem de logo".

- Logo (a marca "artesaná.") não entra em peça nenhuma, nem nos reels. A marca é o perfil.
- Da grade de 13, só três peças têm texto: o bordado (atelie-3, a frase é parte da foto), "Pode chegar." (atelie-5) e "Antes do ano virar" (dia7). Todo o resto é foto pura.
- Capa dos reels = primeiro quadro, sem texto. O texto do reel continua dentro do vídeo.
- Slides internos dos carrosséis mantêm o texto (é o conteúdo), mas sem logo.
- A mensagem vai na legenda. A foto tem que se sustentar sozinha: gente real trabalhando, luz natural ou de vela, uma coisa só por quadro.
- Como fazer: `python scripts/gen-instagram.py atelie`, `... dia`, `python scripts/gen-reels.py` e `python scripts/gen-instagram-pagina.py`. Os conjuntos SO_FOTO e COM_TEXTO ficam no gen-instagram.py.
