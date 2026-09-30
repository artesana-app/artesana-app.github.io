# Backend: painel, atendimento e pagamentos

O app funciona sem servidor: tudo fica no aparelho da pessoa. O que precisa sair do aparelho passa pelo backend em
`backend/`, um Cloudflare Worker (grátis até 100 mil chamadas por dia) com banco D1 (SQLite, grátis até 5 GB):

| O que | Rota | Pra onde vai |
| --- | --- | --- |
| Uso do app (tela aberta, passo da conversa, e-mail deixado, escolha de rede) | `POST /v1/eventos` | banco, painel |
| "Enviar perfil" | `POST /v1/perfil` | banco, painel e aviso no Telegram |
| Avaliação do beta | `POST /v1/feedback` | banco, painel e aviso no Telegram |
| Cliente pediu atendente na tela Ajuda | `POST /v1/suporte` | banco, painel e aviso no Telegram; a resposta da equipe volta pro app em `GET /v1/suporte` |
| Assinar plano | `POST /v1/pagar/florescer` ou `/prosperar` | cria o link no Mercado Pago e devolve pro app abrir |
| Resposta da equipe pelo Telegram | `POST /telegram/<segredo>` | vira mensagem na conversa da cliente |
| Aviso do Mercado Pago | `POST /mp/webhook` | atualiza o status do pagamento |
| Painel | `GET /admin/...` | só com usuário e senha (`/app/admin/`) |

O que o painel mostra: quantos aparelhos abriram o app (hoje, 7 dias, 30 dias), visitantes por dia, até que tela
cada pessoa chegou, em que passo do perfil parou, cidade e país (pelo IP, sem guardar o IP), aparelho, rede escolhida
na entrada, faixa etária e cidade que ela mesma informou, e-mails deixados, perfis enviados, avaliações, conversas de
atendimento (com resposta direto do painel) e pagamentos. Cada visitante abre o caminho completo, evento por evento.

O número de WhatsApp da equipe nunca aparece pra cliente: ela conversa na tela Ajuda do app, e a equipe responde no
Telegram ou no painel. (WhatsApp direto ficaria caro: precisa de conta na API oficial da Meta ou de serviço pago.)

## Publicar (uma vez)

Tudo abaixo roda na pasta `backend/`. Precisa do Node (já tem) e de uma conta Cloudflare (grátis).

```bash
cd backend
npx wrangler login                                  # abre o navegador, entra na conta Cloudflare
npx wrangler d1 create artesana                     # imprime um database_id: cole no wrangler.toml
npx wrangler d1 execute artesana --remote --file=schema.sql

# usuário e senha do painel (escolha os seus; a senha nunca vai pro repositório)
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_SENHA

npx wrangler deploy                                 # imprime o endereço: https://artesana-api.<sua-conta>.workers.dev
```

Depois, em `app/js/site.js`, troque `backend: null` pelo endereço impresso (sem barra no fim), suba o `CACHE` em
`app/sw.js`, commit e push. A partir daí o app manda os eventos, o painel em `/app/admin/` passa a funcionar e a
tela Ajuda oferece atendente.

Pra testar antes de publicar: `npx wrangler d1 execute artesana --local --file=schema.sql` e `npx wrangler dev`
sobem tudo em `http://localhost:8787`; abra `/app/admin/?backend=http://localhost:8787`.

## Telegram: avisos e atendimento

1. No Telegram, fale com o `@BotFather`, mande `/newbot`, dê um nome (ex.: "artesaná avisos") e guarde o token.
2. Abra o bot criado e mande `/start`. Depois descubra o seu `chat_id`: abra
   `https://api.telegram.org/bot<TOKEN>/getUpdates` no navegador e copie o número em `"chat":{"id":...}`.
3. Guarde no Worker (o segredo do webhook é qualquer texto longo sem espaços, ex.: 32 letras e números):

   ```bash
   npx wrangler secret put TELEGRAM_TOKEN
   npx wrangler secret put TELEGRAM_CHAT
   npx wrangler secret put TELEGRAM_SECRET
   ```

4. Aponte o Telegram pro Worker (troque `<TOKEN>`, `<endereço>` e `<SEGREDO>`):

   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<endereço do worker>/telegram/<SEGREDO>
   ```

Como funciona no dia a dia: a cliente toca em "Falar com uma atendente" no app. Chega no Telegram uma mensagem com
`#c12 · Maria, marca Flor de Sal` e a pergunta. Você usa "Responder" nessa mensagem e escreve; o bot confirma com ✅ e
a resposta aparece na tela Ajuda dela (o app confere a cada 15 segundos enquanto está aberto, e quando ela volta).
`/abertas` lista as conversas sem resposta. `/r 12 texto` responde sem usar o "Responder".

## Mercado Pago

Planos: Florescer é assinatura mensal (R$ 49,90, cobrada todo mês no cartão) e Prosperar é cobrança única anual
(R$ 297, em até 12x no cartão, ou PIX e boleto à vista). O app chama `POST /v1/pagar/<plano>` e abre o link que o
Mercado Pago devolve; o aviso de pagamento volta pelo webhook e fica na aba Pagamentos do painel.

1. Em https://www.mercadopago.com.br/developers, crie uma aplicação ("artesaná", modelo de integração: Checkout Pro,
   pagamentos online). Em "Credenciais de produção", copie o **Access Token**.
2. `npx wrangler secret put MP_TOKEN` e cole o token.
3. Em "Webhooks" da aplicação, cadastre `https://<endereço do worker>/mp/webhook` pros eventos Pagamentos e
   Assinaturas (preapproval). Copie a "assinatura secreta" e guarde com `npx wrangler secret put MP_WEBHOOK_SECRET`.
4. Pra testar sem cobrar de verdade, use o Access Token de **teste** e os cartões de teste do Mercado Pago; depois troque
   pelo de produção com o mesmo comando.

O plugin do Mercado Pago no Claude Code (`/mp-connect`, `/mp-integrate`) faz os passos 1 e 3 conversando; os
comandos acima são o caminho manual.

## O que nunca vai pro repositório

Senhas, tokens, número de telefone da equipe e o `database_id` sensível ficam só nos segredos do Worker
(`wrangler secret put`) e no `wrangler.toml` local. O repositório é público: o painel só existe em `/app/admin/`
com usuário e senha, e essa página não aparece em menu nenhum.
