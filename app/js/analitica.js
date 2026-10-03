// Registro de uso pro painel de admin: página aberta, passo do perfil, e-mail deixado, perfil enviado.
// Só envia quando SITE.backend está definido. Sem backend, não sai nada do aparelho.
// Sem cookie: o visitante ganha um código aleatório guardado no próprio aparelho.
import { SITE } from './site.js';
import * as store from './store.js';

const fila = [];
let timer = null;

export function visitante() {
  let v = store.get('visitante', null);
  if (!v) {
    const bytes = new Uint8Array(8);
    (globalThis.crypto || {}).getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
    v = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    store.set('visitante', v);
  }
  return v;
}

function aparelho() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iphone';
  return 'computador';
}

function despachar() {
  timer = null;
  if (!SITE.backend || !fila.length) { fila.length = 0; return; }
  const corpo = JSON.stringify({ visitante: visitante(), aparelho: aparelho(), eventos: fila.splice(0, fila.length) });
  const url = `${SITE.backend}/v1/eventos`;
  // text/plain: sem preflight de CORS, então o beacon sai mesmo com a página fechando. O backend lê o JSON do corpo.
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([corpo], { type: 'text/plain;charset=UTF-8' }))) return;
  } catch { /* cai pro fetch */ }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: corpo, keepalive: true }).catch(() => {});
}

export function evento(tipo, dados = {}) {
  if (!SITE.backend) return;
  // o tipo do evento vem por último: nenhum campo do payload pode sobrescrevê-lo
  fila.push({ ...dados, t: Date.now(), tipo });
  clearTimeout(timer);
  timer = setTimeout(despachar, 1500);
}

export function pagina(rota) {
  evento('pagina', { rota });
}

// Chamada de quem envia perfil, feedback ou mensagem de suporte: manda direto e devolve a resposta.
export async function enviar(caminho, dados) {
  if (!SITE.backend) return { ok: false, semBackend: true };
  try {
    const r = await fetch(`${SITE.backend}${caminho}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitante: visitante(), aparelho: aparelho(), ...dados }) });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, ...json };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function buscar(caminho) {
  if (!SITE.backend) return { ok: false, semBackend: true };
  try {
    const r = await fetch(`${SITE.backend}${caminho}`);
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, ...json };
  } catch {
    return { ok: false, offline: true };
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { clearTimeout(timer); despachar(); });
}
