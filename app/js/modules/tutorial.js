import { h, header, toast, navegacao } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';
import { PAGINA_FB_MOBILE, PAGINA_FB_DESKTOP } from '../data/tutoriais.js';

export function passos(lista) {
  return h('ol', { class: 'steps list' }, ...lista.map((p) => h('li', {}, h('div', {}, h('b', {}, `${p.emoji} ${p.titulo}`), h('span', {}, p.texto)))));
}

export function montar(section) {
  let modo = 'mobile';
  section.innerHTML = '';
  const corpo = h('div', {});
  const tabs = h('div', { class: 'tabs' });
  const render = () => {
    tabs.innerHTML = '';
    tabs.append(
      h('button', { class: modo === 'mobile' ? 'on' : '', onClick: () => { modo = 'mobile'; render(); } }, '📱 Celular'),
      h('button', { class: modo === 'desktop' ? 'on' : '', onClick: () => { modo = 'desktop'; render(); } }, '💻 Computador'),
    );
    corpo.innerHTML = '';
    corpo.append(passos(modo === 'mobile' ? PAGINA_FB_MOBILE : PAGINA_FB_DESKTOP));
  };
  render();
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Criar página no Facebook', sub: '7 passos, uns 10 minutos', voltar: '#redes' }),
    h('div', { class: 'content' },
      tabs, corpo,
      h('button', { class: 'btn peach block', style: { marginTop: '12px' }, onClick: () => { store.patch('user', { redes: { ...(store.usuario().redes || {}), facebook: true } }); toast('Página anotada'); router.ir('#redes'); } }, 'Já criei a página'),
      navegacao({ atual: 'social', voltar: 'redes', seguir: 'social' }),
    ),
  ));
}
