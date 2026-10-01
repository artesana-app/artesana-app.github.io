// Planos e preços. Lógica pura, sem DOM. Os valores precisam bater com PLANOS_PAGOS em backend/src/util.js (teste garante).
export const PLANOS = [
  { id: 'semente', emoji: '🌱', nome: 'Semente', preco: 0, cobranca: '', desc: 'Só o básico, pra começar', rotulosPorMes: 3,
    itens: ['Link do WhatsApp com QR', 'Lista INCI', '3 rótulos em PDF por mês'] },
  { id: 'florescer', emoji: '🌸', nome: 'Florescer', preco: 52.9, cobranca: 'por mês', desc: 'Pra quem já vende', rotulosPorMes: 15,
    itens: ['Tudo do Semente', '15 rótulos em PDF por mês, com os campos da Anvisa', 'Logo, frase e end card', 'Legendas e calendário do mês', 'Editor de foto com a marca', 'Análise do perfil e do público'] },
  { id: 'prosperar', emoji: '🌳', nome: 'Prosperar', preco: 312, cobranca: 'por ano', parcelas: 12, avista: 279, desc: 'Tudo, o ano inteiro, pela metade do preço', rotulosPorMes: Infinity,
    itens: ['Tudo do Florescer', 'Rótulos sem limite', 'Referências do Pinterest ligadas à conta', 'Agenda e métricas', 'Locução e roteiro de reels', 'Atendimento com prioridade', 'Novidades primeiro', 'Desconto no pagamento à vista'] },
];

const reais = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

export function planoPorId(id) {
  return PLANOS.find((p) => p.id === id) || PLANOS[0];
}

// Linha principal do preço: a parcela vem primeiro ("12x de R$ 26,00"); sem parcelas, o valor cheio ("R$ 52,90 por mês").
export function precoFormatado(p) {
  if (!p.preco) return 'Grátis';
  if (p.parcelas) return `${p.parcelas}x de ${reais(p.preco / p.parcelas)}`;
  return `${reais(p.preco)} ${p.cobranca}`.trim();
}

// Linha de apoio: o total quando há parcelas ("R$ 312,00 por ano"); vazio nos outros casos.
export function precoTotal(p) {
  if (!p.preco || !p.parcelas) return '';
  return `${reais(p.preco)} ${p.cobranca}`.trim();
}

// Preço à vista com desconto (PIX, boleto ou débito), quando o plano tem.
export function precoAVista(p) {
  if (!p.avista || p.avista >= p.preco) return '';
  return reais(p.avista);
}

export function descontoAVista(p) {
  if (!p.avista || p.avista >= p.preco) return 0;
  return Math.round(((p.preco - p.avista) / p.preco) * 100);
}

// Quanto o anual economiza em relação a 12 meses do plano mensal.
export function economiaAnual(anual = planoPorId('prosperar'), mensal = planoPorId('florescer')) {
  return Math.max(0, Math.round((mensal.preco * 12 - anual.preco) * 100) / 100);
}

export function limiteRotulos(planoId) {
  return planoPorId(planoId).rotulosPorMes;
}

// Quantas exportações de rótulo aconteceram no mês de `agora`.
export function exportacoesNoMes(lista = [], agora = new Date()) {
  const ini = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).getTime();
  return (Array.isArray(lista) ? lista : []).filter((t) => Number(t) >= ini && Number(t) < fim).length;
}

// No beta, sempre pode. Depois, vale o limite mensal do plano.
export function podeExportar({ beta = false, plano = 'semente', exportadas = [], agora = new Date() } = {}) {
  const limite = limiteRotulos(plano);
  const usadas = exportacoesNoMes(exportadas, agora);
  if (beta || limite === Infinity) return { pode: true, usadas, limite, restantes: Infinity };
  return { pode: usadas < limite, usadas, limite, restantes: Math.max(0, limite - usadas) };
}

// O que a pessoa pode usar hoje: no beta, tudo; depois, o plano dela.
export function liberado(recurso, { beta, plano = 'semente' } = {}) {
  if (beta) return true;
  const nivel = { semente: 0, florescer: 1, prosperar: 2 }[plano] ?? 0;
  const exige = { anvisa: 1, logo: 1, legendas: 1, editor: 1, analises: 1, rotulo_ilimitado: 2, pinterest_conta: 2, agenda: 2, metricas: 2, locucao: 2 }[recurso] ?? 0;
  return nivel >= exige;
}
