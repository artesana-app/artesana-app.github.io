// Feedback do teste beta: validação e texto pronto pra enviar. Lógica pura, sem DOM.
export const NOTAS = [
  { valor: 1, rotulo: 'Não gostei', emoji: '😕' },
  { valor: 2, rotulo: 'Fraco', emoji: '🙁' },
  { valor: 3, rotulo: 'Ok', emoji: '🙂' },
  { valor: 4, rotulo: 'Gostei', emoji: '😊' },
  { valor: 5, rotulo: 'Amei', emoji: '😍' },
];

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

export function validarFeedback({ nota, gostou, dificil, sugestao } = {}) {
  const n = Number(nota);
  if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, erro: 'Escolha uma nota de 1 a 5.' };
  if (!texto(gostou) && !texto(dificil) && !texto(sugestao)) return { ok: false, erro: 'Conte pelo menos uma coisa: o que gostou, o que foi difícil ou uma sugestão.' };
  return { ok: true };
}

export function montarFeedback({ nota, gostou, dificil, sugestao, nome, marca, versao, aparelho } = {}) {
  const linhas = ['Feedback do artesaná.', '', `Nota: ${Number(nota)} de 5`];
  const bloco = (titulo, valor) => { if (texto(valor)) linhas.push('', `${titulo}:`, texto(valor)); };
  bloco('O que mais gostei', gostou);
  bloco('O que foi difícil', dificil);
  bloco('Sugestão', sugestao);
  const quem = [texto(nome), texto(marca)].filter(Boolean).join(', ');
  linhas.push('');
  if (quem) linhas.push(`Enviado por: ${quem}`);
  const rodape = [texto(versao) && `versão ${texto(versao)}`, texto(aparelho)].filter(Boolean).join(', ');
  if (rodape) linhas.push(`Teste beta, ${rodape}`);
  return linhas.join('\n').trim();
}
