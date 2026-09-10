// Link wa.me a partir de DDD + número brasileiro. Lógica pura, sem DOM.
const digitos = (s) => String(s ?? '').replace(/\D/g, '');

export function validar({ ddd, numero } = {}) {
  const d = digitos(ddd);
  const n = digitos(numero);
  if (d.length !== 2 || d.startsWith('0')) return { ok: false, erro: 'DDD precisa ter 2 dígitos (ex: 21).' };
  if (n.length < 8 || n.length > 9) return { ok: false, erro: 'Número precisa ter 8 ou 9 dígitos.' };
  return { ok: true, ddd: d, numero: n };
}

export function montarLink({ ddd, numero, mensagem = '' } = {}) {
  const d = digitos(ddd);
  const n = digitos(numero);
  const base = `https://wa.me/55${d}${n}`;
  const msg = String(mensagem ?? '').trim();
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}

export function numeroFormatado({ ddd, numero } = {}) {
  const d = digitos(ddd);
  const n = digitos(numero);
  const corte = n.length - 4;
  return `(${d}) ${n.slice(0, corte)}-${n.slice(corte)}`;
}

export const SUGESTOES_MENSAGEM = [
  'Olá! Quero fazer um pedido 🌿',
  'Oi! Vi seus produtos e amei 💛',
  'Olá! Quero saber mais sobre os produtos',
];
