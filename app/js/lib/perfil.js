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

export const FAIXAS_ETARIAS = ['até 24', '25 a 34', '35 a 44', '45 a 54', '55 a 64', '65 ou mais'];

// Na ordem em que aparecem na conversa. O @ do Instagram não é obrigatório: quem ainda não tem pode pedir ajuda.
export const CAMPOS_OBRIGATORIOS = [
  { id: 'nome', onde: 'user', rotulo: 'Seu nome' },
  { id: 'marca', onde: 'user', rotulo: 'Nome da marca' },
  { id: 'nicho', onde: 'onboarding', rotulo: 'O que você produz' },
  { id: 'historia', onde: 'onboarding', rotulo: 'História da marca' },
  { id: 'personalidade', onde: 'onboarding', rotulo: 'Personalidade da marca' },
  { id: 'publicoAlvo', onde: 'onboarding', rotulo: 'Pra quem você vende' },
];

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const nomeDe = (lista, id) => (lista.find((i) => i.id === id) || {}).nome || texto(id);

// Os nichos escolhidos, como lista. Aceita o formato antigo (um só, em `nicho`).
export function nichosDe(onboarding = {}) {
  const o = onboarding || {};
  const lista = Array.isArray(o.nichos) ? o.nichos.filter((n) => NICHOS.some((x) => x.id === n)) : [];
  if (lista.length) return lista;
  return NICHOS.some((x) => x.id === o.nicho) ? [o.nicho] : [];
}

export function nichoPrincipal(onboarding = {}) {
  return nichosDe(onboarding)[0] || '';
}

// Nomes dos nichos pra mostrar, incluindo o que a pessoa escreveu em "outro".
export function nichosLegiveis(onboarding = {}) {
  const o = onboarding || {};
  const nomes = nichosDe(o).map((id) => nomeDe(NICHOS, id));
  if (texto(o.nichoOutro)) nomes.push(texto(o.nichoOutro));
  return nomes;
}

export function camposFaltando(dados = {}) {
  return CAMPOS_OBRIGATORIOS.filter((c) => {
    const grupo = dados[c.onde] || {};
    if (c.id === 'nicho') return !nichosDe(grupo).length && !texto(grupo.nichoOutro);
    return !texto(grupo[c.id]);
  });
}

// Resumo do perfil, bonito de ler: um emoji por item, na ordem da conversa.
export function resumoPerfil({ user = {}, onboarding = {}, instagram = {}, whatsapp = {} } = {}) {
  const u = user || {}; const o = onboarding || {}; const i = instagram || {}; const w = whatsapp || {};
  const linhas = [texto(u.marca) ? `✨ Perfil da marca ${texto(u.marca)}` : '✨ Perfil no artesaná.', ''];
  const por = (emoji, rotulo, valor) => { if (texto(valor)) linhas.push(`${emoji} ${rotulo}: ${texto(valor)}`); };
  por('👩', 'Responsável', u.nome);
  por('📧', 'E-mail', u.email);
  const nichos = nichosLegiveis(o);
  if (nichos.length) {
    const emoji = (NICHOS.find((n) => n.id === nichoPrincipal(o)) || {}).emoji || '🧶';
    linhas.push(`${emoji} O que faz: ${nichos.join(', ')}`);
  }
  por('🛍️', 'Produto principal', o.tipoProduto);
  if (texto(o.personalidade)) por((PERSONALIDADES.find((p) => p.id === o.personalidade) || {}).emoji || '💫', 'Personalidade', nomeDe(PERSONALIDADES, o.personalidade));
  por('🎯', 'Pra quem vende', o.publicoAlvo);
  por('📖', 'História', o.historia);
  if (texto(i.arroba)) por('📸', 'Instagram', i.arroba);
  else if (i.semConta) linhas.push('📸 Instagram: ainda não tem, pediu ajuda pra criar');
  const refs = (i.perfisReferencia || []).map(texto).filter(Boolean);
  if (refs.length) linhas.push(`🌟 Referências: ${refs.join(', ')}`);
  if (texto(w.ddd) && texto(w.numero)) linhas.push(`💬 WhatsApp: ${numeroFormatado(w)}`);
  const link = texto(w.linkCurto) || texto(w.link);
  if (link) linhas.push(`🔗 Link: ${link.replace(/^https?:\/\//, '')}`);
  por('🎂', 'Faixa etária', u.faixaEtaria);
  por('📍', 'Cidade', u.cidade);
  return linhas.join('\n').trim();
}
