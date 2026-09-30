// Planos e preços. Lógica pura, sem DOM.
export const PLANOS = [
  { id: 'semente', emoji: '🌱', nome: 'Semente', preco: 0, cobranca: '', desc: 'Pra começar',
    itens: ['Link do WhatsApp com QR', 'Um rótulo em PDF por mês', 'Lista INCI'] },
  { id: 'florescer', emoji: '🌸', nome: 'Florescer', preco: 49.9, cobranca: 'por mês', desc: 'Pra quem já vende',
    itens: ['Tudo do Semente', 'Rótulos sem limite, com os campos da Anvisa', 'Logo, frase e end card', 'Legendas e calendário do mês', 'Editor de foto com a marca', 'Análise do perfil e do público'] },
  { id: 'prosperar', emoji: '🌳', nome: 'Prosperar', preco: 297, cobranca: 'por ano', parcelas: 12, desc: 'Tudo, e o ano inteiro',
    itens: ['Tudo do Florescer', 'Referências do Pinterest ligadas à conta', 'Agenda e métricas', 'Locução e roteiro de reels', 'Atendimento com prioridade', 'Novidades primeiro'] },
];

export function precoFormatado(p) {
  if (!p.preco) return 'Grátis';
  const v = p.preco.toFixed(2).replace('.', ',');
  const base = `R$ ${v} ${p.cobranca}`.trim();
  if (p.parcelas) return `${base}, em até ${p.parcelas}x de R$ ${(p.preco / p.parcelas).toFixed(2).replace('.', ',')}`;
  return base;
}

// O que a pessoa pode usar hoje: no beta, tudo; depois, o plano dela.
export function liberado(recurso, { beta, plano = 'semente' } = {}) {
  if (beta) return true;
  const nivel = { semente: 0, florescer: 1, prosperar: 2 }[plano] ?? 0;
  const exige = { rotulo_ilimitado: 1, anvisa: 1, logo: 1, legendas: 1, editor: 1, analises: 1, pinterest_conta: 2, agenda: 2, metricas: 2, locucao: 2 }[recurso] ?? 0;
  return nivel >= exige;
}
