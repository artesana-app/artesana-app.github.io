import { h, header } from '../ui.js';
import { SITE } from '../site.js';

const PLANOS = [
  { id: 'semente', emoji: '🌱', nome: 'Semente', preco: 'Grátis', desc: 'Pra começar', itens: ['Link do WhatsApp com QR', 'Checklist de identidade', 'Gerador INCI', 'Rótulo básico em PDF', 'Tutoriais'] },
  { id: 'florescer', emoji: '🌸', nome: 'Florescer', preco: 'R$ 47/mês', desc: 'Uso profissional', itens: ['Tudo do Semente', 'Logo e frase com IA', 'Legendas e calendário', 'Edição de foto com IA', 'Métricas do Instagram'] },
  { id: 'prosperar', emoji: '🌳', nome: 'Prosperar', preco: 'R$ 127/mês', desc: 'Operação completa + Academia', itens: ['Tudo do Florescer', 'Reels com voz IA', 'Agendamento via Meta', 'Academia artesaná.', 'Suporte prioritário'] },
];

export function montar(section) {
  section.innerHTML = '';
  const aviso = SITE.beta
    ? h('div', { class: 'card moss' },
      h('h3', {}, 'Teste beta: tudo liberado'),
      h('p', { style: { margin: '6px 0 12px', fontSize: '13.5px' } }, 'Durante o teste você usa o app inteiro sem pagar e sem limite. Nenhum plano precisa ser escolhido.'),
      h('a', { class: 'btn soft block', href: '#feedback' }, 'Contar como foi o teste'))
    : null;

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Planos', sub: SITE.beta ? 'Como vai ficar depois do teste' : 'Cresça no seu ritmo', voltar: '#mais', peach: true }),
    h('div', { class: 'content' },
      aviso,
      ...PLANOS.map((p) => h('div', { class: 'card' },
        h('div', { class: 'row' },
          h('div', { class: 'grow' }, h('h3', {}, `${p.emoji} ${p.nome}`), h('div', { class: 'muted' }, p.desc)),
          h('b', {}, p.preco)),
        h('ul', { style: { margin: '10px 0' } }, ...p.itens.map((i) => h('li', { style: { fontSize: '13.5px', padding: '2px 0' } }, `✓ ${i}`))),
        h('span', { class: 'badge soft' }, SITE.beta ? 'liberado no teste' : 'em breve'),
      )),
      h('p', { class: 'muted center' }, 'Valores de referência. Os preços finais serão definidos antes de ativar o pagamento.'),
    ),
  ));
}
