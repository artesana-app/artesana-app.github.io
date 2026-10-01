-- Banco do artesaná. (Cloudflare D1 / SQLite). Aplicar com:
--   npx wrangler d1 execute artesana --remote --file=schema.sql   (produção)
--   npx wrangler d1 execute artesana --local  --file=schema.sql   (teste local)
-- Tudo aqui é idempotente: pode rodar de novo sem apagar nada.

-- Um registro por aparelho (o código aleatório que o app guarda). Onde a pessoa está, de onde veio e até onde foi.
CREATE TABLE IF NOT EXISTS visitantes (
  id TEXT PRIMARY KEY,
  primeiro INTEGER NOT NULL,          -- ms desde 1970, primeira visita
  ultimo INTEGER NOT NULL,            -- última atividade
  aparelho TEXT,                      -- android | iphone | computador
  pais TEXT, regiao TEXT, cidade TEXT,-- pelo IP (Cloudflare), nunca gravado o IP em si
  idioma TEXT, navegador TEXT,
  redes TEXT,                         -- instagram | facebook | ambos | nenhuma (escolha na entrada)
  email TEXT, nome TEXT, marca TEXT, faixa TEXT, cidade_informada TEXT,
  ultima_rota TEXT,                   -- última tela aberta
  passo TEXT,                         -- último passo da conversa de perfil
  paginas INTEGER NOT NULL DEFAULT 0,
  perfil_enviado INTEGER NOT NULL DEFAULT 0,
  telefone TEXT,                      -- quando entrou ou se identificou pelo número
  novidades INTEGER                   -- 1 aceita receber novidades, 0 não quer, NULL não respondeu
);
-- Banco criado antes de 01/10/2026: aplicar também migracoes/2026-10-01-telefone-novidades.sql

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitante TEXT NOT NULL,
  t INTEGER NOT NULL,
  tipo TEXT NOT NULL,                 -- pagina, passo, entrada, email, perfil_enviado, feedback, plano_clique, suporte_pergunta
  rota TEXT,
  dados TEXT                          -- JSON com o resto
);
CREATE INDEX IF NOT EXISTS eventos_visitante ON eventos(visitante, t);
CREATE INDEX IF NOT EXISTS eventos_t ON eventos(t);
CREATE INDEX IF NOT EXISTS eventos_tipo ON eventos(tipo, t);

CREATE TABLE IF NOT EXISTS perfis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitante TEXT NOT NULL,
  t INTEGER NOT NULL,
  nome TEXT, marca TEXT, email TEXT,
  resumo TEXT,                        -- o texto com emojis que a pessoa viu e enviou
  dados TEXT                          -- JSON completo do perfil
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitante TEXT NOT NULL,
  t INTEGER NOT NULL,
  nota INTEGER, nome TEXT, marca TEXT, email TEXT,
  texto TEXT, dados TEXT
);

-- Atendimento: uma conversa por visitante (reabre se ela voltar). As mensagens da equipe vêm do Telegram ou do painel.
CREATE TABLE IF NOT EXISTS conversas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitante TEXT NOT NULL,
  aberta INTEGER NOT NULL,
  ultima INTEGER NOT NULL,
  nome TEXT, marca TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' -- aberta | fechada
);
CREATE INDEX IF NOT EXISTS conversas_visitante ON conversas(visitante, status);

CREATE TABLE IF NOT EXISTS mensagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversa INTEGER NOT NULL,
  t INTEGER NOT NULL,
  de TEXT NOT NULL,                   -- cliente | equipe
  texto TEXT NOT NULL,
  origem TEXT                         -- app | telegram | painel
);
CREATE INDEX IF NOT EXISTS mensagens_conversa ON mensagens(conversa, t);

CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitante TEXT,
  t INTEGER NOT NULL,
  plano TEXT NOT NULL,                -- florescer | prosperar
  email TEXT,
  referencia TEXT,                    -- external_reference mandado ao Mercado Pago
  mp_id TEXT,                         -- id do pagamento ou da assinatura no Mercado Pago
  status TEXT,                        -- criado | approved | pending | rejected | authorized | cancelled ...
  valor REAL,
  dados TEXT
);
CREATE INDEX IF NOT EXISTS pagamentos_ref ON pagamentos(referencia);
