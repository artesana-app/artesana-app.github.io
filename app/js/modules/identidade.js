import { h, header } from '../ui.js';

export function montar(section, param) {
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' }, header({ titulo: 'identidade', voltar: true }), h('div', { class: 'content' }, h('div', { class: 'soon' }, h('div', { class: 'big' }, '🌱'), h('p', {}, 'Em construção')))));
}
