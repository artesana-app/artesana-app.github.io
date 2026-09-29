// Link wa.me a partir de DDD + número brasileiro. Lógica pura, sem DOM.
const digitos = (s) => String(s ?? '').replace(/\D/g, '');

export function validar({ ddd, numero } = {}) {
  const d = digitos(ddd);
  const n = digitos(numero);
  if (d.length !== 2 || d.startsWith('0')) return { ok: false, erro: 'DDD precisa ter 2 dígitos (ex: 21).' };
  if (n.length < 8 || n.length > 9) return { ok: false, erro: 'Número precisa ter 8 ou 9 dígitos.' };
  return { ok: true, ddd: d, numero: n };
}

export function montarLink({ ddd, numero, mensagem = '' } = {}) {
  const d = digitos(ddd);
  const n = digitos(numero);
  const base = `https://wa.me/55${d}${n}`;
  const msg = String(mensagem ?? '').trim();
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}

export function numeroFormatado({ ddd, numero } = {}) {
  const d = digitos(ddd);
  const n = digitos(numero);
  const corte = n.length - 4;
  return `(${d}) ${n.slice(0, corte)}-${n.slice(corte)}`;
}

export const SUGESTOES_MENSAGEM = [
  'Olá! Quero fazer um pedido 🌿',
  'Oi! Vi seus produtos e amei 💛',
  'Olá! Quero saber mais sobre os produtos',
];

// ---- link curto com identificação: <base>?<marca>-<ddd><numero>[-m<n>][&t=<texto>]
const CONECTIVOS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);

export function slugMarca(marca) {
  let s = String(marca ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > 24) s = s.slice(0, 24).replace(/-+$/g, '');
  return s;
}

export function marcaLegivel(slug) {
  return String(slug ?? '').split('-').filter(Boolean)
    .map((p, i) => (i > 0 && CONECTIVOS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ');
}

export function montarLinkCurto({ base, marca, ddd, numero, mensagem = '' } = {}) {
  const slug = slugMarca(marca);
  let q = `${slug ? `${slug}-` : ''}${digitos(ddd)}${digitos(numero)}`;
  const msg = String(mensagem ?? '').trim();
  const pronta = SUGESTOES_MENSAGEM.indexOf(msg);
  if (pronta >= 0) q += `-m${pronta + 1}`;
  else if (msg) q += `&t=${encodeURIComponent(msg)}`;
  return `${base}?${q}`;
}

export function lerLinkCurto(query) {
  const bruto = String(query ?? '').replace(/^\?/, '');
  if (!bruto) return null;
  const [parte, ...resto] = bruto.split('&');
  const m = /^(?:([a-z0-9]+(?:-[a-z0-9]+)*)-)?(\d{10,11})(?:-m([1-9]))?$/.exec(parte);
  if (!m) return null;
  let texto = '';
  for (const r of resto) {
    if (!r.startsWith('t=')) continue;
    try { texto = decodeURIComponent(r.slice(2)).slice(0, 300); } catch { texto = ''; }
  }
  const slug = m[1] || '';
  return { slug, marca: marcaLegivel(slug), ddd: m[2].slice(0, 2), numero: m[2].slice(2), sugestao: m[3] ? Number(m[3]) : 0, texto };
}

export function destinoLinkCurto(dados) {
  if (!dados) return null;
  const corpo = (dados.sugestao && SUGESTOES_MENSAGEM[dados.sugestao - 1]) || dados.texto || '';
  let mensagem = corpo;
  if (dados.marca) mensagem = corpo ? `${corpo} (vim pelo link da ${dados.marca})` : `Olá! Vim pelo link da ${dados.marca}.`;
  return montarLink({ ddd: dados.ddd, numero: dados.numero, mensagem });
}

// As versões do link de uma marca.
// curto: o link do próprio WhatsApp, só com o número. É o que vai na bio.
// comMensagem: o mesmo link com a mensagem pronta, identificando a marca. Vazio se não houver o que escrever.
// comMarca: passa pela página /w/ do artesaná., que mostra o nome da marca e abre o WhatsApp.
export function versoesDoLink({ base, marca, ddd, numero, mensagem = '' } = {}) {
  const curto = montarLink({ ddd, numero });
  const comMarca = montarLinkCurto({ base, marca, ddd, numero, mensagem });
  const destino = destinoLinkCurto(lerLinkCurto(comMarca.slice(comMarca.indexOf('?')))) || curto;
  const comMensagem = destino === curto ? '' : destino;
  const mensagemEnviada = comMensagem ? decodeURIComponent(comMensagem.split('?text=')[1] || '') : '';
  return { curto, comMensagem, comMarca, mensagemEnviada };
}
