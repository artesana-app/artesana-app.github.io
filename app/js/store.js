// Estado local em localStorage. Todas as chaves começam com "artesana_".
const PREFIXO = 'artesana_';

function chave(k) { return k.startsWith(PREFIXO) ? k : PREFIXO + k; }

export function get(k, padrao = null) {
  try {
    const raw = localStorage.getItem(chave(k));
    if (raw === null) return padrao;
    return JSON.parse(raw);
  } catch {
    return padrao;
  }
}

export function set(k, valor) {
  try { localStorage.setItem(chave(k), JSON.stringify(valor)); } catch { /* quota / privado */ }
  return valor;
}

// Mescla campos num objeto já salvo.
export function patch(k, campos) {
  const atual = get(k, {});
  return set(k, { ...(atual && typeof atual === 'object' ? atual : {}), ...campos });
}

export function remove(k) {
  try { localStorage.removeItem(chave(k)); } catch { /* ignore */ }
}

export function limparTudo() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIXO))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

export function usuario() { return get('user', { nome: '', marca: '', logado: false, loginTipo: '' }); }
export function logado() { return usuario().logado === true; }
