// Limite mensal de rótulos exportados por plano (só vale depois do beta). Conta no próprio aparelho.
import * as store from './store.js';
import * as analitica from './analitica.js';
import { SITE } from './site.js';
import { podeExportar, planoPorId } from './lib/planos.js';

export function conferirLimite() {
  const plano = store.get('plano', 'semente');
  const r = podeExportar({ beta: SITE.beta, plano, exportadas: store.get('rotulos_exportados', []) });
  const p = planoPorId(plano);
  const mensagem = r.pode
    ? (r.limite === Infinity ? '' : `${r.restantes === 1 ? 'Resta 1 rótulo' : `Restam ${r.restantes} rótulos`} este mês no plano ${p.nome}.`)
    : `O plano ${p.nome} permite ${r.limite} rótulos por mês e você já usou os ${r.usadas}. No Prosperar os rótulos são sem limite.`;
  return { ...r, plano, mensagem };
}

export function registrarExportacao(tipo = 'rótulo em PDF') {
  const lista = store.get('rotulos_exportados', []);
  const limpa = (Array.isArray(lista) ? lista : []).filter((t) => Number(t) > Date.now() - 400 * 86400000);
  limpa.push(Date.now());
  store.set('rotulos_exportados', limpa);
  analitica.evento('baixou', { item: tipo });
}
