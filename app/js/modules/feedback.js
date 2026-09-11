import { h, header } from '../ui.js';

export function montar(section) {
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Feedback', sub: 'Sua opinião molda o app', voltar: '#mais' }),
    h('div', { class: 'content' }, h('div', { class: 'card' }, h('div', { class: 'soon' },
      h('div', { class: 'big' }, '💬'),
      h('h2', {}, 'Conte seus desafios, sugestões e avalie o app'),
      h('p', { style: { marginTop: '10px' } }, 'Um formulário curto: o que está difícil no seu dia a dia, o que você gostaria que o artesaná. fizesse e uma nota de 1 a 5. A IA resume as respostas e sugere ações pra Bibiana.'),
      h('span', { class: 'badge gold', style: { marginTop: '12px' } }, 'Em breve'),
    ))),
  ));
}
