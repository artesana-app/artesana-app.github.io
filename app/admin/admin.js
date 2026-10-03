// Painel de admin: só pra quem tem usuário e senha do backend. Lê a API em SITE.backend (ou ?backend=... pra testar).
import { SITE } from '../js/site.js';

const params = new URLSearchParams(location.search);
const BACKEND = (params.get('backend') || SITE.backend || '').replace(/\/$/, '');
const tela = document.getElementById('tela');
const abas = document.getElementById('abas');
const guardado = (() => { try { return localStorage.getItem('artesana_admin_auth') || ''; } catch { return ''; } })();
let auth = guardado;
const ABA_INICIAL = (location.hash || '').replace('#', '');
let abaAtual = ['resumo', 'visitantes', 'perfis', 'feedbacks', 'suporte', 'pagamentos'].includes(ABA_INICIAL) ? ABA_INICIAL : 'resumo';
const guardar = (v) => { try { if (v) localStorage.setItem('artesana_admin_auth', v); else localStorage.removeItem('artesana_admin_auth'); } catch { /* sem armazenamento */ } };

const h = (tag, attrs = {}, ...filhos) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null) el.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f.nodeType ? f : document.createTextNode(String(f)));
  return el;
};
const quando = (t) => (t ? new Date(Number(t)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const dataCurta = (t) => (t ? new Date(Number(t)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '');

async function api(caminho, opts = {}) {
  const r = await fetch(`${BACKEND}${caminho}`, { ...opts, headers: { Authorization: auth, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (r.status === 401) { auth = ''; guardar(''); login('Usuário ou senha errados.'); throw new Error('login'); }
  return r.json();
}

function login(erro = '') {
  abas.classList.add('hidden');
  tela.innerHTML = '';
  if (!BACKEND) {
    tela.append(h('div', { class: 'login' }, h('h2', {}, 'Backend não configurado'), h('p', {}, 'Publique o Worker (docs/backend.md) e coloque o endereço em SITE.backend, ou abra esta página com ?backend=https://... pra testar.')));
    return;
  }
  const u = h('input', { placeholder: 'Usuário', autocomplete: 'username' });
  const s = h('input', { placeholder: 'Senha', type: 'password', autocomplete: 'current-password' });
  const msg = h('div', { class: 'erro' }, erro);
  const entrar = async (e) => {
    e.preventDefault();
    auth = 'Basic ' + btoa(`${u.value.trim()}:${s.value}`);
    try {
      const r = await fetch(`${BACKEND}/admin/resumo`, { headers: { Authorization: auth } });
      if (r.status === 401) { msg.textContent = 'Usuário ou senha errados.'; auth = ''; return; }
      guardar(auth);
      abrir(abaAtual);
    } catch { msg.textContent = 'Não consegui falar com o backend.'; }
  };
  tela.append(h('form', { class: 'login', onSubmit: entrar }, h('h2', {}, 'Entrar no painel'), u, s, msg, h('button', { class: 'btn', type: 'submit' }, 'Entrar')));
  u.focus();
}

const ABAS = [['resumo', 'Resumo'], ['visitantes', 'Visitantes'], ['perfis', 'Perfis'], ['feedbacks', 'Avaliações'], ['suporte', 'Atendimento'], ['pagamentos', 'Pagamentos']];

function montarAbas() {
  abas.classList.remove('hidden');
  abas.innerHTML = '';
  for (const [id, nome] of ABAS) abas.append(h('button', { class: id === abaAtual ? 'on' : '', onClick: () => abrir(id) }, nome));
  abas.append(h('button', { onClick: () => { auth = ''; guardar(''); login(); } }, 'Sair'));
}

function barras(lista, total) {
  const max = Math.max(1, ...lista.map((x) => x.n));
  return h('div', { class: 'barras' }, ...lista.map((x) => h('div', { class: 'barra' }, h('span', {}, x.k), h('i', { style: `width:${(x.n / max) * 100}%` }), h('small', {}, total ? `${x.n} · ${Math.round((x.n / total) * 100)}%` : x.n))));
}

async function resumo() {
  const d = await api('/admin/resumo');
  const t = d.totais;
  const cards = [
    [t.visitantes, 'aparelhos que abriram o app'], [t.hoje, 'ativos nas últimas 24 h'], [t.seteDias, 'ativos em 7 dias'], [t.novosTrintaDias, 'novos em 30 dias'],
    [t.entradas, 'entraram (escolheram rede)'], [t.emails, 'deixaram e-mail'], [t.telefones, 'deixaram telefone'], [t.perfis, 'perfis enviados'], [`${t.feedbacks}${t.notaMedia ? ` · ${Number(t.notaMedia).toFixed(1)}★` : ''}`, 'avaliações'],
    [t.conversasEsperando, 'conversas esperando resposta'], [`${t.pagamentos} · R$ ${Number(t.receita || 0).toFixed(0)}`, 'pagamentos aprovados'],
    [`${t.pessoasQueBaixaram ?? 0} · ${t.downloads ?? 0}`, 'pessoas que baixaram algo · downloads'],
  ];
  const max = Math.max(1, ...d.porDia.map((x) => x.n));
  tela.append(
    h('div', { class: 'cards' }, ...cards.map(([n, l]) => h('div', { class: 'card' }, h('div', { class: 'n' }, n ?? 0), h('div', { class: 'l' }, l)))),
    h('h2', {}, 'Visitantes por dia (30 dias)'),
    h('div', { class: 'card' }, h('div', { class: 'dias' }, ...d.porDia.map((x) => h('div', { style: `height:${(x.n / max) * 100}%`, title: `${x.dia}: ${x.n}` }, h('span', {}, `${x.dia.slice(5)} · ${x.n}`))))),
    h('div', { class: 'duas' },
      h('div', {}, h('h2', {}, 'Até onde chegaram (última tela)'), h('div', { class: 'card' }, barras(d.porRota, t.visitantes))),
      h('div', {}, h('h2', {}, 'Passo da conversa de perfil'), h('div', { class: 'card' }, barras(d.porPasso, t.visitantes))),
      h('div', {}, h('h2', {}, 'De onde (cidade)'), h('div', { class: 'card' }, barras(d.porCidade, t.visitantes))),
      h('div', {}, h('h2', {}, 'País'), h('div', { class: 'card' }, barras(d.porPais, t.visitantes))),
      h('div', {}, h('h2', {}, 'Faixa etária'), h('div', { class: 'card' }, barras(d.porFaixa, t.visitantes))),
      h('div', {}, h('h2', {}, 'Aparelho'), h('div', { class: 'card' }, barras(d.porAparelho, t.visitantes))),
      h('div', {}, h('h2', {}, 'Rede escolhida na entrada'), h('div', { class: 'card' }, barras(d.porRedes, t.visitantes))),
      h('div', {}, h('h2', {}, 'Quer receber novidades?'), h('div', { class: 'card' }, barras(d.porNovidades || [], t.visitantes))),
      h('div', {}, h('h2', {}, 'Telas mais abertas'), h('div', { class: 'card' }, barras(d.rotasVistas))),
      h('div', {}, h('h2', {}, 'O que baixaram'), h('div', { class: 'card' }, (d.porBaixado || []).length ? barras(d.porBaixado.map((x) => ({ k: `${x.k} (${x.pessoas} ${x.pessoas === 1 ? 'pessoa' : 'pessoas'})`, n: x.n }))) : h('p', { class: 'nota' }, 'Nenhum download ainda. Conta rótulo em PDF, logo, end card, QR, foto editada, agenda, locução e capa do reel.'))),
      h('div', {}, h('h2', {}, 'O que buscaram no Pinterest'), h('div', { class: 'card' }, (d.buscas || []).length ? barras(d.buscas) : h('p', { class: 'nota' }, 'Nenhuma busca ainda.'))),
      h('div', {}, h('h2', {}, 'O que perguntaram na Ajuda'), h('div', { class: 'card' }, (d.perguntas || []).length ? barras(d.perguntas) : h('p', { class: 'nota' }, 'Nenhuma pergunta ainda.'))),
    ),
  );
}

function tabela(colunas, linhas, render = {}) {
  return h('div', { class: 'tabela-rolavel' }, h('table', {},
    h('thead', {}, h('tr', {}, ...colunas.map(([, nome]) => h('th', {}, nome)))),
    h('tbody', {}, ...linhas.map((l) => h('tr', {}, ...colunas.map(([k]) => h('td', {}, render[k] ? render[k](l[k], l) : (l[k] ?? ''))))))));
}

async function visitantes() {
  const d = await api('/admin/visitantes?limite=500');
  tela.append(
    h('p', { class: 'nota' }, `${d.visitantes.length} mais recentes. `, h('a', { href: '#', onClick: async (e) => { e.preventDefault(); const r = await fetch(`${BACKEND}/admin/visitantes?formato=csv&limite=1000`, { headers: { Authorization: auth } }); const b = await r.blob(); const a = h('a', { href: URL.createObjectURL(b), download: 'visitantes.csv' }); a.click(); } }, 'Baixar CSV')),
    tabela([['ultimo', 'Última vez'], ['primeiro', 'Primeira'], ['nome', 'Nome'], ['marca', 'Marca'], ['email', 'E-mail'], ['telefone', 'Telefone'], ['novidades', 'Novidades'], ['faixa', 'Idade'], ['cidade', 'Cidade (IP)'], ['cidade_informada', 'Cidade (disse)'], ['aparelho', 'Aparelho'], ['redes', 'Rede'], ['ultima_rota', 'Parou em'], ['passo', 'Passo'], ['paginas', 'Telas'], ['perfil_enviado', 'Perfil']],
      d.visitantes, {
        ultimo: quando, primeiro: dataCurta,
        telefone: (v) => (v ? v.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3') : ''),
        novidades: (v) => (v === 1 ? h('span', { class: 'tag ok' }, 'sim') : v === 0 ? h('span', { class: 'tag' }, 'não') : ''),
        cidade: (v, l) => [v, l.regiao, l.pais].filter(Boolean).join(' · '),
        perfil_enviado: (v) => (v ? h('span', { class: 'tag ok' }, 'enviado') : ''),
        ultima_rota: (v, l) => h('a', { href: '#', onClick: async (e) => { e.preventDefault(); detalhe(l.id); } }, v || '?'),
      }),
  );
}

async function detalhe(id) {
  const d = await api(`/admin/visitante?id=${encodeURIComponent(id)}`);
  tela.innerHTML = '';
  tela.append(h('button', { class: 'btn claro sm', onClick: () => abrir('visitantes') }, '← Visitantes'), h('h2', {}, `Caminho de ${d.visitante?.nome || 'visitante'} ${d.visitante?.marca ? `(${d.visitante.marca})` : ''}`),
    h('p', { class: 'nota' }, `${d.visitante?.aparelho || ''} · ${[d.visitante?.cidade, d.visitante?.regiao, d.visitante?.pais].filter(Boolean).join(', ')} · ${d.visitante?.navegador || ''} · ${d.visitante?.idioma || ''}`),
    tabela([['t', 'Quando'], ['tipo', 'Evento'], ['rota', 'Tela'], ['dados', 'Detalhes']], d.eventos, { t: quando, dados: (v) => { try { const o = JSON.parse(v); delete o.rota; return Object.keys(o).length ? JSON.stringify(o) : ''; } catch { return v; } } }));
}

async function perfis() {
  const d = await api('/admin/perfis');
  tela.append(tabela([['t', 'Quando'], ['nome', 'Nome'], ['marca', 'Marca'], ['email', 'E-mail'], ['resumo', 'Perfil']], d.perfis, { t: quando, resumo: (v) => h('pre', {}, v) }));
}

async function feedbacks() {
  const d = await api('/admin/feedbacks');
  tela.append(tabela([['t', 'Quando'], ['nota', 'Nota'], ['nome', 'Nome'], ['marca', 'Marca'], ['email', 'E-mail'], ['texto', 'Avaliação']], d.feedbacks, { t: quando, texto: (v) => h('pre', {}, v), nota: (v) => (v ? '★'.repeat(v) : '') }));
}

async function suporte() {
  const d = await api('/admin/suporte');
  tela.append(h('div', { class: 'aviso' }, 'As mensagens da cliente chegam também no Telegram. Responder aqui ou lá dá no mesmo: ela vê na tela Ajuda do app.'));
  if (!d.conversas.length) tela.append(h('p', { class: 'nota' }, 'Nenhuma conversa ainda.'));
  for (const c of d.conversas) {
    const ultima = c.mensagens[c.mensagens.length - 1];
    const esperando = c.status === 'aberta' && ultima && ultima.de === 'cliente';
    const caixa = h('textarea', { placeholder: 'Sua resposta' });
    const bloco = h('div', { class: 'conversa' },
      h('header', {}, h('b', {}, `#c${c.id} · ${c.nome || 'sem nome'}${c.marca ? ` · ${c.marca}` : ''}`), h('span', { class: 'nota' }, `${quando(c.ultima)} · ${c.status}${esperando ? ' · esperando resposta' : ''}`)),
      h('div', { class: 'msgs' }, ...c.mensagens.map((m) => h('div', { class: `msg ${m.de}` }, m.texto, h('small', {}, `${quando(m.t)}${m.origem ? ` · ${m.origem}` : ''}`)))),
      c.status === 'aberta' ? h('div', { class: 'responder' }, caixa,
        h('button', { class: 'btn', onClick: async () => { const texto = caixa.value.trim(); if (!texto) return; await api(`/admin/suporte/${c.id}/responder`, { method: 'POST', body: JSON.stringify({ texto }) }); abrir('suporte'); } }, 'Responder'),
        h('button', { class: 'btn claro', onClick: async () => { await api(`/admin/suporte/${c.id}/fechar`, { method: 'POST' }); abrir('suporte'); } }, 'Fechar')) : null,
    );
    tela.append(bloco);
  }
}

async function pagamentos() {
  const d = await api('/admin/pagamentos');
  tela.append(tabela([['t', 'Quando'], ['plano', 'Plano'], ['email', 'E-mail'], ['status', 'Status'], ['valor', 'Valor'], ['referencia', 'Referência'], ['mp_id', 'Mercado Pago']], d.pagamentos, { t: quando, valor: (v) => (v != null ? `R$ ${Number(v).toFixed(2)}` : '') }));
}

const TELAS = { resumo, visitantes, perfis, feedbacks, suporte, pagamentos };

async function abrir(aba) {
  abaAtual = aba;
  if (location.hash !== `#${aba}`) history.replaceState(null, '', `#${aba}`);
  montarAbas();
  tela.innerHTML = '';
  tela.append(h('p', { class: 'nota' }, 'carregando...'));
  try {
    tela.innerHTML = '';
    await TELAS[aba]();
  } catch (e) {
    if (e.message !== 'login') tela.append(h('p', { class: 'erro' }, `Não carregou: ${e.message}`));
  }
}

if (auth && BACKEND) abrir(abaAtual); else login();
