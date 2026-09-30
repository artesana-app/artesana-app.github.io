// Progresso do perfil da marca em 5 etapas. Lógica pura, sem DOM.
import { nichosDe } from './perfil.js';

const cheio = (v) => typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v;

export const ETAPAS = [
  { id: 'nome-marca', nome: 'Seu nome e sua marca', dica: 'Conte seu nome e o nome da sua marca pra começar.', rota: '#conversa/nome' },
  { id: 'nicho', nome: 'O que você produz', dica: 'Diga o que você produz pra gente sugerir rótulos e legendas certeiras.', rota: '#conversa/nichos' },
  { id: 'historia', nome: 'História da marca', dica: 'Conte a história da sua marca: ela vira frase de impacto e legendas.', rota: '#conversa/historia' },
  { id: 'personalidade-publico', nome: 'Personalidade e público', dica: 'Escolha a personalidade da marca e diga pra quem você vende.', rota: '#conversa/publico' },
  { id: 'instagram', nome: 'Instagram', dica: 'Informe seu @ ou peça ajuda pra criar a conta.', rota: '#conversa/arroba' },
];

export function calcularProgresso({ user = {}, onboarding = {}, instagram = {} } = {}) {
  const u = user || {}; const o = onboarding || {}; const i = instagram || {};
  const ok = {
    'nome-marca': cheio(u.nome) && cheio(u.marca),
    nicho: nichosDe(o).length > 0 || cheio(o.nichoOutro),
    historia: cheio(o.historia),
    'personalidade-publico': cheio(o.personalidade) && cheio(o.publicoAlvo),
    instagram: cheio(i.arroba) || i.semConta === true,
  };
  const etapas = ETAPAS.map((e) => ({ ...e, ok: ok[e.id] === true }));
  const feitas = etapas.filter((e) => e.ok).length;
  const proxima = etapas.find((e) => !e.ok) || null;
  return { feitas, total: etapas.length, etapas, proxima, completo: feitas === etapas.length };
}
