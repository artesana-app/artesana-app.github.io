import { h, header } from '../ui.js';
import { ROADMAP } from '../data/roadmap.js';

export function montar(section, param) {
  const item = ROADMAP[param];
  section.innerHTML = '';
  const corpo = item
    ? h('div', { class: 'soon' },
      h('div', { class: 'big' }, item.emoji),
      h('h2', {}, item.titulo),
      h('p', { style: { marginTop: '10px' } }, item.descricao),
      h('span', { class: 'badge gold', style: { marginTop: '12px' } }, 'Em breve'),
      h('p', { class: 'muted', style: { marginTop: '12px' } }, 'Essa função ainda não ficou pronta, então não entra neste teste.'),
      h('p', { class: 'muted', style: { marginTop: '16px' } }, 'Enquanto isso, complete o perfil da marca: é ele que alimenta esta função.'),
      h('a', { class: 'btn ghost', href: '#perfil', style: { marginTop: '8px' } }, 'Completar perfil'),
    )
    : h('div', { class: 'soon' }, h('div', { class: 'big' }, '🤔'), h('h2', {}, 'Funcionalidade não encontrada'));
  section.append(h('div', { class: 'screen' },
    header({ titulo: item ? item.titulo : 'Detalhe', voltar: item ? `#${item.modulo}` : '#home', peach: true }),
    h('div', { class: 'content' }, h('div', { class: 'card' }, corpo)),
  ));
}
