// Grade de rótulos em folha A4 e cor de texto por contraste. Lógica pura, sem DOM.
export const A4 = { largura: 210, altura: 297 };

export const PRESETS = [
  { id: 'red40', tipo: 'redondo', nome: 'Redondo 40 mm', largura: 40, altura: 40 },
  { id: 'red50', tipo: 'redondo', nome: 'Redondo 50 mm', largura: 50, altura: 50 },
  { id: 'red60', tipo: 'redondo', nome: 'Redondo 60 mm', largura: 60, altura: 60 },
  { id: 'ret5030', tipo: 'retangular', nome: 'Retangular 50 × 30 mm', largura: 50, altura: 30 },
  { id: 'ret7040', tipo: 'retangular', nome: 'Retangular 70 × 40 mm', largura: 70, altura: 40 },
  { id: 'ret9050', tipo: 'retangular', nome: 'Retangular 90 × 50 mm', largura: 90, altura: 50 },
  { id: 'tag5080', tipo: 'tag', nome: 'Tag de presente 50 × 80 mm', largura: 50, altura: 80 },
];

export const CORES_FUNDO = [
  { id: 'creme', nome: 'Creme', hex: '#FFF5EF' },
  { id: 'pessego', nome: 'Pêssego', hex: '#FFB18B' },
  { id: 'musgo-claro', nome: 'Musgo claro', hex: '#DCE6D9' },
  { id: 'musgo', nome: 'Musgo', hex: '#4A6348' },
  { id: 'branco', nome: 'Branco', hex: '#FFFFFF' },
];

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

export function gradeA4({ largura, altura, margem = 8, espaco = 3 } = {}) {
  const l = num(largura); const a = num(altura); const m = Math.max(0, num(margem)); const e = Math.max(0, Number(espaco) || 0);
  if (!l || !a) return { colunas: 0, linhas: 0, total: 0, posicoes: [] };
  const colunas = Math.max(0, Math.floor((A4.largura - 2 * m + e) / (l + e)));
  const linhas = Math.max(0, Math.floor((A4.altura - 2 * m + e) / (a + e)));
  const posicoes = [];
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < colunas; c++) {
      posicoes.push({ x: +(m + c * (l + e)).toFixed(2), y: +(m + r * (a + e)).toFixed(2) });
    }
  }
  return { colunas, linhas, total: colunas * linhas, posicoes };
}

export function corTexto(hexFundo) {
  const hex = String(hexFundo || '').replace('#', '');
  if (hex.length !== 6) return '#2C1A1E';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.4 ? '#2C1A1E' : '#FFF5EF';
}

// Tamanhos menores que rendem mais rótulos por folha A4, a partir do tamanho atual.
// Devolve até `qtd` opções, da mais próxima pra menor, cada uma com quantos cabem.
export function sugestoesA4({ largura, altura, tipo = 'retangular' } = {}, qtd = 3) {
  const l = num(largura); const a = num(altura);
  if (!l || !a) return [];
  const atual = gradeA4({ largura: l, altura: a }).total;
  const passos = [0.9, 0.8, 0.7, 0.6, 0.5];
  const vistos = new Set([atual]);
  const saida = [];
  for (const f of passos) {
    const nl = Math.max(20, Math.round(l * f)); const na = tipo === 'redondo' ? nl : Math.max(15, Math.round(a * f));
    const g = gradeA4({ largura: nl, altura: na });
    if (g.total > atual && !vistos.has(g.total)) {
      vistos.add(g.total);
      saida.push({ largura: nl, altura: na, total: g.total, colunas: g.colunas, linhas: g.linhas, ganho: g.total - atual });
    }
    if (saida.length >= qtd) break;
  }
  return saida;
}
