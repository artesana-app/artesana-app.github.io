// Roteamento por hash: #rota ou #rota/param. Uma <section data-route="rota"> por tela.
import { logado } from './store.js';
import * as analitica from './analitica.js';

const TAB_DE = {
  home: 'home', conversa: 'home', social: 'social', rotulos: 'rotulos', fotos: 'fotos', editor: 'fotos', mais: 'mais',
  identidade: 'mais', criar: 'mais', feedback: 'mais', suporte: 'mais', inpi: 'mais', perfil: 'mais', 'ajuda-instagram': 'mais',
  planos: 'mais', config: 'mais', whatsapp: 'mais', redes: 'mais', 'tutorial-meta': 'mais', detalhe: 'mais', referencias: 'mais',
};

// ordem natural de uso: os botões Voltar e Seguir de cada tela seguem esta sequência
export const FLUXO = ['home', 'perfil', 'identidade', 'rotulos', 'whatsapp', 'social', 'fotos', 'referencias', 'planos'];
export const NOME_DA_ROTA = {
  home: 'Início', perfil: 'Perfil', identidade: 'Identidade', rotulos: 'Rótulos', whatsapp: 'WhatsApp', social: 'Social',
  fotos: 'Fotos', referencias: 'Referências', planos: 'Planos', suporte: 'Ajuda', feedback: 'Avaliar', config: 'Configurações', mais: 'Mais',
};

let rotas = {};
let historico = [];

export function atual() {
  const h = (location.hash || '').replace(/^#/, '');
  const [nome, ...resto] = h.split('/');
  return { nome: nome || '', param: resto.join('/') };
}

export function proximo(nome) {
  const i = FLUXO.indexOf(nome);
  return i >= 0 && i < FLUXO.length - 1 ? FLUXO[i + 1] : '';
}

export function anterior(nome) {
  const i = FLUXO.indexOf(nome);
  return i > 0 ? FLUXO[i - 1] : 'home';
}

export function ir(hash) {
  const alvo = hash.startsWith('#') ? hash : '#' + hash;
  if (location.hash === alvo) render();
  else location.hash = alvo;
}

export function voltar(padrao = '#home') {
  if (historico.length > 1) history.back();
  else ir(padrao);
}

function render() {
  let { nome, param } = atual();
  if (!nome) nome = logado() ? 'home' : 'login';
  if (!rotas[nome]) nome = logado() ? 'home' : 'login';
  if (!logado() && nome !== 'login') { location.replace('#login'); return; }
  if (logado() && nome === 'login') { location.replace('#home'); return; }

  const modalEl = document.getElementById('modal');
  if (modalEl) { modalEl.classList.remove('show'); modalEl.innerHTML = ''; }
  document.querySelectorAll('section[data-route]').forEach((s) => s.classList.remove('active'));
  const section = document.querySelector(`section[data-route="${nome}"]`);
  if (!section) return;
  section.classList.add('active');
  window.scrollTo(0, 0);
  document.body.dataset.rota = nome;

  const aba = TAB_DE[nome];
  document.querySelectorAll('.tabbar, .lateral').forEach((nav) => {
    nav.classList.toggle('hidden', nome === 'login');
    nav.querySelectorAll('a[data-tab]').forEach((a) => a.classList.toggle('active', a.dataset.tab === aba || a.dataset.tab === nome));
  });
  const fab = document.getElementById('fab-beta');
  if (fab) fab.classList.toggle('hidden', nome === 'login');

  historico.push(nome);
  if (historico.length > 50) historico.shift();
  analitica.pagina(param ? `${nome}/${param.split('/')[0]}` : nome);
  try {
    rotas[nome](section, param);
  } catch (e) {
    console.error('erro ao montar', nome, e);
    section.innerHTML = `<div class="content"><div class="card">Não foi possível abrir esta tela.</div></div>`;
  }
}

export function iniciar(mapa) {
  rotas = mapa;
  window.addEventListener('hashchange', render);
  render();
}
