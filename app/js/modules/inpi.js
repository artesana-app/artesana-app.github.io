import { h, header } from '../ui.js';

export function montar(section) {
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Verificação INPI', sub: 'Proteja o nome da sua marca', voltar: '#mais' }),
    h('div', { class: 'content' }, h('div', { class: 'card' }, h('div', { class: 'soon' },
      h('div', { class: 'big' }, '🔍'),
      h('h2', {}, 'Verifique se o nome da sua marca está disponível'),
      h('p', { style: { marginTop: '10px' } }, 'Busca no INPI, passo a passo de registro como pessoa física (sem CNPJ), classe certa pro seu produto, custos e prazos atualizados.'),
      h('span', { class: 'badge gold', style: { marginTop: '12px' } }, 'Em breve'),
      h('p', { class: 'muted', style: { marginTop: '16px' } }, 'Enquanto isso, você pode pesquisar manualmente em busca.inpi.gov.br.'),
      h('a', { class: 'btn ghost', href: 'https://busca.inpi.gov.br/pePI/', target: '_blank', rel: 'noopener', style: { marginTop: '8px' } }, 'Abrir busca do INPI'),
    ))),
  ));
}
