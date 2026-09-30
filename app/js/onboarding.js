// Estado do perfil da marca: progresso, dica do dia e envio do perfil pra equipe.
import * as store from './store.js';
import * as analitica from './analitica.js';
import { calcularProgresso } from './lib/progresso.js';
import { NICHOS, PERSONALIDADES, resumoPerfil, camposFaltando } from './lib/perfil.js';

export { NICHOS, PERSONALIDADES };

export function dadosDoPerfil() {
  return { user: store.usuario(), onboarding: store.get('onboarding', {}), instagram: store.get('instagram', {}), whatsapp: store.get('whatsapp', {}) };
}

export function progresso() {
  return calcularProgresso(dadosDoPerfil());
}

export function visto(modulo) {
  const o = store.get('onboarding', {});
  return !!(o.vistos && o.vistos[modulo]);
}

export function marcarVisto(modulo) {
  const o = store.get('onboarding', {});
  store.set('onboarding', { ...o, vistos: { ...(o.vistos || {}), [modulo]: true } });
}

export function dica(p = progresso()) {
  if (p.completo) return { emoji: '🎉', texto: 'Perfil completo. Agora todas as sugestões são personalizadas pra sua marca.' };
  return { emoji: '💡', texto: p.proxima.dica, rota: p.proxima.rota };
}

// Envia o perfil pra equipe (quando há backend) e guarda que foi enviado. Devolve { resumo, enviado, faltando }.
export async function enviarPerfil() {
  const dados = dadosDoPerfil();
  const faltando = camposFaltando(dados);
  const resumo = resumoPerfil(dados);
  if (faltando.length) return { resumo, enviado: false, faltando };
  const r = await analitica.enviar('/v1/perfil', { resumo, dados });
  store.set('perfil_enviado', { data: new Date().toISOString(), enviado: !!r.ok });
  analitica.evento('perfil_enviado');
  return { resumo, enviado: !!r.ok, faltando: [] };
}
