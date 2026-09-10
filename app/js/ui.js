// Helpers de DOM: criação de elementos, toast, modal, lista iOS, copiar.
import * as router from './router.js';

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
  if (opts.avatar) top.append(h('div', { class: 'avatar' }, opts.avatar));
  const head = h('div', { class: `header ${opts.peach ? 'peach' : ''}` }, top);
  if (opts.titulo) head.append(h('h1', {}, opts.titulo));
  if (opts.sub) head.append(h('div', { class: 'sub' }, opts.sub));
  if (opts.extra) head.append(opts.extra);
  return head;
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

// lista([{emoji, titulo, sub, badge, badgeClasse, href, onClick, static}])
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

export function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function inicial(nome) {
  return (nome || 'a').trim().charAt(0).toUpperCase() || 'A';
}
