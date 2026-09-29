# Domínio do artesaná.

## Domínio oficial: artesana-mktdigital.com.br

Registrado no Registro.br em 29/09/2026, em nome de Bibiana Kohls Silveira, válido até 29/09/2027.
Usa o DNS do próprio Registro.br (`a.auto.dns.br` e `b.auto.dns.br`).

Situação em 29/09/2026: o domínio existe, mas ainda não tem nenhum registro de DNS. Enquanto isso o site segue em
https://bebezinbtc-droid.github.io/artesana/.

## O registro está pago. O que falta é só configuração

Os R$ 40,00 pagam o registro do nome por um ano. Não há mais nada a pagar: a hospedagem no GitHub e o
certificado HTTPS são gratuitos. Falta dizer ao domínio onde o site mora, e isso é feito no painel do
Registro.br, de graça. Há dois caminhos.

### Caminho rápido: redirecionamento

O DNS do Registro.br, no modo básico, tem um redirecionamento pronto. Segundo a ajuda oficial
(registro.br/ajuda/gerenciamento-de-conta, seção 7):

- aceita qualquer endereço como destino;
- vale para o domínio e para `www.`;
- fica ativo em até 2 minutos quando o domínio já está no modo básico;
- atende só em `http`, sem `https` no domínio.

Passos: entrar no Registro.br, abrir o domínio, ir na parte de DNS, escolher o redirecionamento e informar
`https://bebezinbtc-droid.github.io/artesana/` como destino.

Resultado: quem digita `artesana-mktdigital.com.br` cai no site. A barra do navegador passa a mostrar o endereço
do GitHub. Para divulgar, escrever `artesana-mktdigital.com.br` sem `https://` na frente.

### Caminho completo: o site morando no domínio

Com as entradas de DNS abaixo, o site abre no próprio domínio, com `https` e sem mostrar o endereço do GitHub.

## Caminho completo, passo a passo

Quem faz: a titular, com o login dela no Registro.br.

1. Entrar em https://registro.br e abrir o domínio `artesana-mktdigital.com.br`.
2. Na parte de DNS, abrir a configuração da zona e ativar o modo avançado, que libera a criação de entradas.
3. Criar as entradas abaixo e salvar.

| Tipo | Nome | Valor |
|---|---|---|
| A | (vazio) | 185.199.108.153 |
| A | (vazio) | 185.199.109.153 |
| A | (vazio) | 185.199.110.153 |
| A | (vazio) | 185.199.111.153 |
| CNAME | www | bebezinbtc-droid.github.io |

Opcionais, para quem acessa por IPv6:

| Tipo | Nome | Valor |
|---|---|---|
| AAAA | (vazio) | 2606:50c0:8000::153 |
| AAAA | (vazio) | 2606:50c0:8001::153 |
| AAAA | (vazio) | 2606:50c0:8002::153 |
| AAAA | (vazio) | 2606:50c0:8003::153 |

Os nomes dos botões no painel podem variar um pouco. O que importa são as entradas da tabela.
A propagação costuma levar de alguns minutos a poucas horas.

## Depois do DNS: virar o site

```bash
python scripts/ativar-dominio.py --verificar   # só confere
python scripts/ativar-dominio.py               # confere e vira
```

O script só vira o site se o DNS já estiver apontando certo. Ele cria o arquivo `CNAME`, define o domínio no
GitHub Pages, liga o HTTPS obrigatório e troca os endereços no README.

Não criar o arquivo `CNAME` à mão antes disso: o endereço antigo passa a redirecionar para um domínio que ainda
não abre e o site sai do ar.

O site usa só caminhos relativos, então funciona na raiz do domínio sem mudança de código. Os links curtos de
WhatsApp já criados no endereço antigo continuam funcionando, porque o GitHub redireciona para o domínio novo.

## Depois de virar

- Trocar o link da bio do Instagram para `https://artesana-mktdigital.com.br`.
- Verificar o domínio na conta do GitHub, em Settings, Pages, pra ninguém mais conseguir usá-lo.
- Deixar a renovação automática ligada no Registro.br.

## Outros nomes consultados em 29/09/2026

| Domínio | Situação | Observação |
|---|---|---|
| artesana.app | livre | igual ao Instagram @artesana.app. Porkbun: US$ 8,75 no 1º ano, US$ 14,93 na renovação |
| artesana.app.br | livre | Registro.br, R$ 40,00 por ano |
| artesana.com.br | ocupado | Artesana Divisórias e Forros Ltda, desde 1998 |
| artesana.com | ocupado | estacionado desde 1998 |
| artesana.art.br | ocupado | pessoa física, desde 04/2025 |
| artesanaapp.com.br | ocupado | registrado em 24/04/2026 por "Igor Daniel" |
