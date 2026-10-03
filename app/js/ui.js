// Helpers de DOM: criação de elementos, toast, modal, lista, navegação entre telas, copiar.
import * as router from './router.js';
import * as analitica from './analitica.js';
import { SITE, diasDeBeta } from './site.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function wordmark(classe = '') {
  return h('span', { class: `wordmark ${classe}`.trim() }, 'artesaná', h('b', {}, '.'));
}

// Header padrão. opts: {titulo, sub, voltar, peach, avatar, extra}
export function header(opts = {}) {
  const top = h('div', { class: 'top' });
  if (opts.voltar) top.append(h('button', { class: 'back', 'aria-label': 'Voltar', onClick: () => router.voltar(typeof opts.voltar === 'string' ? opts.voltar : '#home') }, '←'));
  top.append(wordmark(opts.peach ? 'ink' : 'cream'));
  if (opts.avatar) top.append(h('div', { class: 'avatar', title: 'Seu perfil', onClick: () => router.ir('#perfil') }, opts.avatar));
  const head = h('div', { class: `header ${opts.peach ? 'peach' : ''}` }, top);
  if (opts.titulo) head.append(h('h1', {}, opts.titulo));
  if (opts.sub) head.append(h('div', { class: 'sub' }, opts.sub));
  if (opts.extra) head.append(opts.extra);
  return head;
}

// Pergunta grande, no estilo de conversa. pergunta(texto, ajuda)
export function pergunta(texto, ajuda) {
  return h('div', { class: 'pergunta-bloco' }, h('h2', { class: 'pergunta' }, texto), ajuda ? h('p', { class: 'ajuda' }, ajuda) : null);
}

// Barra de Voltar e Seguir no fim da tela. navegacao({ atual, voltar, seguir, textoSeguir, aoSeguir })
export function navegacao(opts = {}) {
  const atual = opts.atual || router.atual().nome;
  const seg = opts.seguir !== undefined ? opts.seguir : router.proximo(atual);
  const ant = opts.voltar !== undefined ? opts.voltar : router.anterior(atual);
  const bar = h('div', { class: 'navegacao' });
  if (ant) bar.append(h('a', { class: 'btn white', href: `#${String(ant).replace(/^#/, '')}` }, `← ${router.NOME_DA_ROTA[ant] || 'Voltar'}`));
  if (seg) {
    const texto = opts.textoSeguir || `Seguir: ${router.NOME_DA_ROTA[seg] || seg}`;
    bar.append(opts.aoSeguir
      ? h('button', { class: 'btn peach', type: 'button', onClick: opts.aoSeguir }, `${texto} →`)
      : h('a', { class: 'btn peach', href: `#${String(seg).replace(/^#/, '')}` }, `${texto} →`));
  }
  return bar;
}

let toastTimer = null;
export function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export async function copiar(texto, msg = 'Copiado!') {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = h('textarea', { value: texto, style: { position: 'fixed', opacity: '0' } });
    document.body.append(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
  }
  toast(msg);
}

// baixar(dataUrlOuBlob, nomeDoArquivo)
// Nome legível do que foi baixado, pro painel (o nome do arquivo leva a marca da pessoa; o tipo não).
export function tipoDoArquivo(nome) {
  const n = String(nome || '').toLowerCase();
  if (n.startsWith('logo')) return 'logo';
  if (n.startsWith('end-card')) return 'end card';
  if (n.startsWith('locucao')) return 'locução';
  if (n.startsWith('capa')) return 'capa do reel';
  if (n.endsWith('.ics')) return 'agenda';
  if (n.startsWith('foto')) return 'foto editada';
  if (n.startsWith('qr')) return 'QR do WhatsApp';
  return n.replace(/\.[a-z0-9]+$/, '') || 'arquivo';
}

export function baixar(conteudo, nome) {
  const url = conteudo instanceof Blob ? URL.createObjectURL(conteudo) : conteudo;
  const a = h('a', { href: url, download: nome, style: { display: 'none' } });
  document.body.append(a); a.click(); a.remove();
  if (conteudo instanceof Blob) setTimeout(() => URL.revokeObjectURL(url), 2000);
  analitica.evento('baixou', { tipo: tipoDoArquivo(nome) });
}

// modal({titulo, corpo (Node|string), botoes:[{texto, classe, onClick}], fechavel})
export function modal({ titulo, corpo, botoes = [], fechavel = true } = {}) {
  const root = document.getElementById('modal');
  if (!root) return { fechar() {} };
  root.innerHTML = '';
  const sheet = h('div', { class: 'sheet' });
  if (titulo) sheet.append(h('h2', {}, titulo));
  if (corpo) sheet.append(typeof corpo === 'string' ? h('div', { html: corpo }) : corpo);
  const fechar = () => { root.classList.remove('show'); root.innerHTML = ''; };
  if (botoes.length) {
    const row = h('div', { class: 'btn-row' });
    for (const b of botoes) {
      row.append(h('button', { class: `btn ${b.classe || ''}`, onClick: async () => { const r = b.onClick ? await b.onClick() : true; if (r !== false) fechar(); } }, b.texto));
    }
    sheet.append(row);
  }
  root.append(sheet);
  root.onclick = (e) => { if (fechavel && e.target === root) fechar(); };
  root.classList.add('show');
  return { fechar, sheet };
}

export function confirmar(titulo, texto, textoOk = 'Confirmar') {
  return new Promise((res) => {
    modal({ titulo, corpo: h('p', {}, texto), botoes: [
      { texto: 'Cancelar', classe: 'white', onClick: () => res(false) },
      { texto: textoOk, classe: 'peach', onClick: () => res(true) },
    ] });
  });
}

// lista([{emoji, titulo, sub, badge, badgeClasse, href, onClick, static, extra}])
export function lista(itens) {
  const ul = h('ul', { class: 'list' });
  for (const it of itens) {
    const conteudo = [
      it.emoji ? h('span', { class: 'emoji' }, it.emoji) : null,
      h('span', { class: 'txt' }, h('b', {}, it.titulo), it.sub ? h('span', {}, it.sub) : null),
      it.badge ? h('span', { class: `badge ${it.badgeClasse || ''}` }, it.badge) : null,
      it.extra || null,
      !it.static ? h('span', { class: 'chev' }, '›') : null,
    ];
    const item = it.href
      ? h('a', { class: 'item', href: it.href }, ...conteudo)
      : h('button', { class: `item ${it.static ? 'static' : ''}`, type: 'button', onClick: it.onClick }, ...conteudo);
    ul.append(h('li', {}, item));
  }
  return ul;
}

export function grupo(titulo, ...nodes) {
  return h('div', {}, h('div', { class: 'group-title' }, titulo), ...nodes);
}

// Galeria de cartões (Canva): cartoes([{titulo, sub, href, onClick, capa (Node), on}])
export function cartoes(itens, classe = '') {
  return h('div', { class: `galeria ${classe}`.trim() }, ...itens.map((it) => {
    const miolo = [h('div', { class: 'capa' }, it.capa || null), h('b', {}, it.titulo), it.sub ? h('span', {}, it.sub) : null];
    return it.href
      ? h('a', { class: `cartao ${it.on ? 'on' : ''}`, href: it.href }, ...miolo)
      : h('button', { type: 'button', class: `cartao ${it.on ? 'on' : ''}`, onClick: it.onClick }, ...miolo);
  }));
}

// Chips de escolha. chips({ opcoes:[{id, nome, emoji}], valor (string|array), multi, aoMudar }) -> elemento
export function chips({ opcoes, valor, multi = false, aoMudar }) {
  let atual = multi ? [...(valor || [])] : (valor || '');
  const box = h('div', { class: 'chips', role: 'group' });
  const desenhar = () => {
    box.innerHTML = '';
    for (const o of opcoes) {
      const on = multi ? atual.includes(o.id) : atual === o.id;
      box.append(h('button', { type: 'button', class: `chip ${on ? 'on' : ''}`, 'aria-pressed': String(on), onClick: () => {
        if (multi) atual = on ? atual.filter((x) => x !== o.id) : [...atual, o.id];
        else atual = o.id;
        desenhar();
        aoMudar(atual);
      } }, `${o.emoji || ''} ${o.nome}`.trim()));
    }
  };
  desenhar();
  return box;
}

export function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function inicial(nome) {
  return (nome || 'a').trim().charAt(0).toUpperCase() || 'A';
}

// Aviso do beta: quanto falta e o que vem depois.
export function avisoBeta() {
  if (!SITE.beta) return null;
  const dias = diasDeBeta();
  const fim = new Date(`${SITE.betaFim}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const texto = dias > 0 ? `Versão beta: tudo liberado, grátis até ${fim}. Depois entram os planos.` : 'O beta terminou. Os planos passam a valer.';
  return h('a', { class: 'aviso-beta', href: '#planos' }, texto);
}
