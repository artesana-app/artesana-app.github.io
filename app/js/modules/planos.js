import { h, header, toast } from '../ui.js';
import * as store from '../store.js';

const PLANOS = [
  { id: 'semente', emoji: '🌱', nome: 'Semente', preco: 'Grátis', desc: 'Pra começar', itens: ['Link do WhatsApp com QR', 'Checklist de identidade', 'Gerador INCI', 'Rótulo básico em PDF', 'Tutoriais'] },
  { id: 'florescer', emoji: '🌸', nome: 'Florescer', preco: 'R$ 47/mês', desc: 'Uso profissional', itens: ['Tudo do Semente', 'Logo e frase com IA', 'Legendas e calendário', 'Edição de foto com IA', 'Métricas do Instagram'] },
  { id: 'prosperar', emoji: '🌳', nome: 'Prosperar', preco: 'R$ 127/mês', desc: 'Operação completa + Academia', itens: ['Tudo do Florescer', 'Reels com voz IA', 'Agendamento via Meta', 'Academia artesaná.', 'Suporte prioritário'] },
];

export function montar(section) {
  const atual = store.get('plano', 'semente');
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Planos', sub: 'Cresça no seu ritmo', voltar: '#mais', peach: true }),
    h('div', { class: 'content' },
      ...PLANOS.map((p) => h('div', { class: `card ${p.id === atual ? 'gold-border' : ''}` },
        h('div', { class: 'row' },
          h('div', { class: 'grow' }, h('h3', {}, `${p.emoji} ${p.nome}`), h('div', { class: 'muted' }, p.desc)),
          h('b', {}, p.preco)),
        h('ul', { style: { margin: '10px 0' } }, ...p.itens.map((i) => h('li', { style: { fontSize: '13.5px', padding: '2px 0' } }, `✓ ${i}`))),
        p.id === atual
          ? h('span', { class: 'badge moss' }, 'Seu plano atual')
          : p.id === 'semente'
            ? h('button', { class: 'btn ghost sm', onClick: () => { store.set('plano', 'semente'); toast('Plano Semente ativo'); montar(section); } }, 'Voltar pro grátis')
            : h('button', { class: 'btn peach sm', onClick: () => toast('Assinatura em breve. Por enquanto tudo é grátis 💛') }, 'Em breve'),
      )),
      h('p', { class: 'muted center' }, 'Valores de layout. Os preços finais serão definidos antes de ativar o pagamento.'),
    ),
  ));
}
