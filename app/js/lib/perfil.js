// Perfil da marca: o que falta preencher e o resumo em texto. Lógica pura, sem DOM.
import { numeroFormatado } from './whatsapp.js';

export const NICHOS = [
  { id: 'sabonetes', nome: 'Sabonetes e saboaria', emoji: '🧼' },
  { id: 'velas', nome: 'Velas e aromas', emoji: '🕯️' },
  { id: 'cosmeticos', nome: 'Cosméticos naturais', emoji: '🌿' },
  { id: 'alimentos', nome: 'Alimentos artesanais', emoji: '🍯' },
  { id: 'artesanato', nome: 'Artesanato em geral', emoji: '🧶' },
];

export const PERSONALIDADES = [
  { id: 'delicada', nome: 'Delicada', emoji: '🌸' },
  { id: 'rustica', nome: 'Rústica', emoji: '🪵' },
  { id: 'sofisticada', nome: 'Sofisticada', emoji: '✨' },
  { id: 'alegre', nome: 'Alegre', emoji: '🌞' },
];

// Na ordem em que aparecem na tela.
export const CAMPOS_OBRIGATORIOS = [
  { id: 'nome', onde: 'user', rotulo: 'Seu nome' },
  { id: 'marca', onde: 'user', rotulo: 'Nome da marca' },
  { id: 'nicho', onde: 'onboarding', rotulo: 'O que você produz' },
  { id: 'historia', onde: 'onboarding', rotulo: 'História da marca' },
  { id: 'personalidade', onde: 'onboarding', rotulo: 'Personalidade da marca' },
  { id: 'publicoAlvo', onde: 'onboarding', rotulo: 'Pra quem você vende' },
  { id: 'arroba', onde: 'instagram', rotulo: '@ do Instagram' },
];

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const nomeDe = (lista, id) => (lista.find((i) => i.id === id) || {}).nome || texto(id);

export function camposFaltando(dados = {}) {
  return CAMPOS_OBRIGATORIOS.filter((c) => !texto((dados[c.onde] || {})[c.id]));
}

export function resumoPerfil({ user = {}, onboarding = {}, instagram = {}, whatsapp = {} } = {}) {
  const u = user || {}; const o = onboarding || {}; const i = instagram || {}; const w = whatsapp || {};
  const linhas = [texto(u.marca) ? `Perfil da marca ${texto(u.marca)}` : 'Perfil no artesaná.', ''];
  const por = (rotulo, valor) => { if (texto(valor)) linhas.push(`${rotulo}: ${texto(valor)}`); };
  por('Responsável', u.nome);
  por('E-mail', u.email);
  if (texto(o.nicho)) por('Nicho', nomeDe(NICHOS, o.nicho));
  por('Produto principal', o.tipoProduto);
  if (texto(o.personalidade)) por('Personalidade', nomeDe(PERSONALIDADES, o.personalidade));
  por('Público-alvo', o.publicoAlvo);
  por('História', o.historia);
  por('Instagram', i.arroba);
  const refs = (i.perfisReferencia || []).map(texto).filter(Boolean);
  if (refs.length) linhas.push(`Referências: ${refs.join(', ')}`);
  if (texto(w.ddd) && texto(w.numero)) linhas.push(`WhatsApp: ${numeroFormatado(w)}`);
  const link = texto(w.linkCurto) || texto(w.link);
  if (link) linhas.push(`Link: ${link.replace(/^https?:\/\//, '')}`);
  return linhas.join('\n').trim();
}
