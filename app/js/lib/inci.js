// Gerador de lista INCI. Lógica pura, sem DOM.
export function gerarInci(itens = []) {
  const vistos = new Set();
  const saida = [];
  for (const it of itens) {
    const inci = String(it?.inci ?? '').trim();
    if (!inci) continue;
    const k = inci.toLowerCase();
    if (vistos.has(k)) continue;
    vistos.add(k);
    saida.push(inci);
  }
  return saida.join(', ');
}

export function sugerirAlergenos(itens = []) {
  const vistos = new Set();
  const saida = [];
  for (const it of itens) {
    for (const a of it?.alergenos || []) {
      const k = a.toLowerCase();
      if (vistos.has(k)) continue;
      vistos.add(k);
      saida.push(a);
    }
  }
  return saida;
}

export function normalizar(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function buscar(termo, tabela = [], limite = 8) {
  const t = normalizar(termo);
  if (!t) return [];
  const comeca = [];
  const contem = [];
  for (const it of tabela) {
    const pt = normalizar(it.pt);
    const inci = normalizar(it.inci);
    if (pt.startsWith(t)) comeca.push(it);
    else if (pt.includes(t) || inci.includes(t)) contem.push(it);
  }
  return [...comeca, ...contem].slice(0, limite);
}
