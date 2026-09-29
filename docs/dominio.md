# Domínio do artesaná.

Consulta feita em 29/09/2026 direto nos registros oficiais (RDAP do Google Registry, Registro.br e Verisign).

## Disponibilidade

| Domínio | Situação | Observação |
|---|---|---|
| artesana.app | **livre** | igual ao Instagram @artesana.app |
| artesana.app.br | **livre** | categoria "Aplicativos" do Registro.br, aceita CPF |
| artesana.net.br | livre | |
| useartesana.com.br | livre | |
| appartesana.com.br | livre | |
| artesanaapp.com | livre | |
| artesana.com.br | ocupado | Artesana Divisórias e Forros Ltda, desde 1998 |
| artesana.com | ocupado | estacionado desde 1998, renovado até 2031 |
| artesana.art.br | ocupado | pessoa física, desde 04/2025 |
| artesanaapp.com.br | ocupado | registrado em 24/04/2026 por "Igor Daniel" |

## Recomendação

Registrar **artesana.app** como endereço oficial e **artesana.app.br** como reserva, apontando pro mesmo site.

## Preço

| Domínio | Onde | 1º ano | Renovação |
|---|---|---|---|
| artesana.app | Porkbun | US$ 8,75 | US$ 14,93 por ano |
| artesana.app.br | Registro.br | R$ 40,00 | R$ 40,00 por ano |

Valores lidos na API pública da Porkbun e na busca do Registro.br em 29/09/2026. Outras empresas vendem `.app` com preço próprio.

## O que precisa pra comprar

**artesana.app** (qualquer empresa que venda `.app`)
- Conta com e-mail que você não vai perder.
- Nome, endereço e telefone do titular. Quem consta como titular é o dono legal do domínio.
- Cartão de crédito internacional ou PayPal.
- Não exige CPF nem CNPJ.
- Ativar a privacidade do WHOIS, que costuma ser gratuita.
- Ativar a renovação automática.

**artesana.app.br** (registro.br)
- Conta no Registro.br com CPF ou CNPJ do titular.
- Pagamento por Pix, boleto ou cartão.

## Depois da compra: DNS

No painel de DNS do domínio, criar:

| Tipo | Nome | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | bebezinbtc-droid.github.io |

Domínio `.app` só abre em HTTPS. O GitHub Pages emite o certificado sozinho depois que o DNS propaga.

## Depois do DNS: no repositório

1. Criar o arquivo `CNAME` na raiz com `artesana.app`.
2. Definir o domínio no Pages e forçar HTTPS.
3. Verificar o domínio na conta do GitHub, pra ninguém mais conseguir usá-lo.
4. Trocar os endereços no README e regenerar as peças com `python scripts/gen-instagram.py --bio artesana.app`.

O site usa só caminhos relativos, então funciona na raiz do domínio sem mudança de código.

Não criar o arquivo `CNAME` antes de o domínio existir: o Pages passa a redirecionar pra um endereço que não resolve e o site sai do ar.
