-- Colunas novas em visitantes (telefone e aceite de novidades). Rodar uma vez num banco criado antes de 01/10/2026:
--   npx wrangler d1 execute artesana --remote --file=migracoes/2026-10-01-telefone-novidades.sql
ALTER TABLE visitantes ADD COLUMN telefone TEXT;
ALTER TABLE visitantes ADD COLUMN novidades INTEGER;
