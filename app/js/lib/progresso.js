// Progresso do onboarding em 5 etapas. Lógica pura, sem DOM.
const cheio = (v) => typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v;

export const ETAPAS = [
  { id: 'nome-marca', nome: 'Seu nome e sua marca', dica: 'Conte seu nome e o nome da sua marca pra começar.', rota: '#perfil' },
  { id: 'nicho', nome: 'Nicho do produto', dica: 'Diga o que você produz pra gente sugerir rótulos e legendas certeiras.', rota: '#identidade' },
  { id: 'historia', nome: 'História da marca', dica: 'Escreva a história da sua marca: ela vira frase de impacto e legendas.', rota: '#identidade' },
  { id: 'personalidade-publico', nome: 'Personalidade e público', dica: 'Escolha a personalidade da marca e descreva pra quem você vende.', rota: '#identidade' },
  { id: 'instagram', nome: 'Instagram e referências', dica: 'Informe seu @ e 3 perfis que te inspiram pra criar seu estilo.', rota: '#social' },
];

export function calcularProgresso({ user = {}, onboarding = {}, instagram = {} } = {}) {
  const u = user || {}; const o = onboarding || {}; const i = instagram || {};
  const ok = {
    'nome-marca': cheio(u.nome) && cheio(u.marca),
    nicho: cheio(o.nicho),
    historia: cheio(o.historia),
    'personalidade-publico': cheio(o.personalidade) && cheio(o.publicoAlvo),
    instagram: cheio(i.arroba),
  };
  const etapas = ETAPAS.map((e) => ({ ...e, ok: ok[e.id] === true }));
  const feitas = etapas.filter((e) => e.ok).length;
  const proxima = etapas.find((e) => !e.ok) || null;
  return { feitas, total: etapas.length, etapas, proxima, completo: feitas === etapas.length };
}
