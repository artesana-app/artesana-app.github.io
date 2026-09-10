// Roteamento por hash: #rota ou #rota/param. Uma <section data-route="rota"> por tela.
import { logado } from './store.js';

const TAB_DE = {
  home: 'home', social: 'social', rotulos: 'rotulos', fotos: 'fotos', mais: 'mais',
  identidade: 'mais', feedback: 'mais', inpi: 'mais', perfil: 'mais', planos: 'mais',
  config: 'mais', whatsapp: 'mais', meta: 'mais', 'tutorial-meta': 'mais', detalhe: 'mais',
};

let rotas = {};
let historico = [];

export function atual() {
  const h = (location.hash || '').replace(/^#/, '');
  const [nome, ...resto] = h.split('/');
  return { nome: nome || '', param: resto.join('/') };
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

  document.querySelectorAll('section[data-route]').forEach((s) => s.classList.remove('active'));
  const section = document.querySelector(`section[data-route="${nome}"]`);
  if (!section) return;
  section.classList.add('active');
  window.scrollTo(0, 0);

  const tab = document.querySelector('.tabbar');
  if (tab) {
    tab.classList.toggle('hidden', nome === 'login');
    tab.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.tab === TAB_DE[nome]));
  }

  historico.push(nome);
  if (historico.length > 50) historico.shift();
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
