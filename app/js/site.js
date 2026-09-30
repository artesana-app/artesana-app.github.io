// Constantes do site. Muda aqui, muda em todo lugar.
export const SITE = {
  dominio: 'artesana-mktdigital.com.br',
  url: 'https://artesana-mktdigital.com.br',
  instagram: 'artesana.app',
  versao: '2.0.0',
  beta: true,
  betaFim: '2026-10-15', // depois desta data os planos passam a valer
  // Endereço do backend (Cloudflare Worker em backend/). Enquanto for null, o app guarda tudo só no aparelho:
  // sem chat com atendente, sem painel de admin, e o perfil enviado fica salvo localmente.
  backend: 'https://artesana-api.artesana.workers.dev',
  // Links de pagamento do Mercado Pago, um por plano. Enquanto forem null, o botão "Assinar" avisa que falta pouco.
  pagamentos: { florescer: null, prosperar: null },
  whatsappEquipe: null,
};

// Base do link curto identificado: <site>/w/ ao lado de /app/
export function baseLinkCurto() {
  return new URL('../w/', location.href.split('#')[0]).href;
}

export const semProtocolo = (url) => String(url ?? '').replace(/^https?:\/\//, '');

// Dias que faltam pro fim do beta (0 se já passou).
export function diasDeBeta(hoje = new Date()) {
  const fim = new Date(`${SITE.betaFim}T23:59:59`);
  return Math.max(0, Math.ceil((fim - hoje) / 86400000));
}
