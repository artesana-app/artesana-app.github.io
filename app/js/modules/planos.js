import { h, header, toast, navegacao } from '../ui.js';
import * as store from '../store.js';
import * as analitica from '../analitica.js';
import { SITE, diasDeBeta } from '../site.js';
import { PLANOS, precoFormatado } from '../lib/planos.js';

export function montar(section) {
  const atual = store.get('plano', 'semente');
  const dias = diasDeBeta();
  section.innerHTML = '';
  const aviso = SITE.beta
    ? h('div', { class: 'card moss' },
      h('h3', {}, dias > 0 ? `Beta: tudo liberado por mais ${dias} ${dias === 1 ? 'dia' : 'dias'}` : 'O beta terminou'),
      h('p', { style: { margin: '6px 0 12px', fontSize: '13.5px' } }, `Até ${new Date(`${SITE.betaFim}T12:00:00`).toLocaleDateString('pt-BR')} você usa o app inteiro sem pagar. Depois, cada conta passa pro plano que escolher; quem não escolher fica no Semente, grátis.`),
      h('a', { class: 'btn soft block', href: '#feedback' }, 'Contar como foi o teste'))
    : null;

  const assinar = (p) => {
    analitica.evento('plano_clique', { plano: p.id });
    const link = SITE.pagamentos[p.id];
    if (!p.preco) { store.set('plano', 'semente'); toast('Plano Semente escolhido'); return; }
    if (!link) { toast('O pagamento abre em breve. Durante o beta está tudo liberado.', 3500); return; }
    window.open(link, '_blank', 'noopener');
  };

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Planos', sub: SITE.beta ? 'Como vai ficar depois do teste' : 'Cresça no seu ritmo', voltar: '#mais', peach: true }),
    h('div', { class: 'content' },
      aviso,
      h('div', { class: 'planos' }, ...PLANOS.map((p) => h('div', { class: `card plano ${p.id === 'prosperar' ? 'destaque' : ''} ${p.id === atual && !SITE.beta ? 'atual' : ''}` },
        p.id === 'prosperar' ? h('span', { class: 'badge gold' }, 'mais completo') : null,
        h('h3', {}, `${p.emoji} ${p.nome}`), h('div', { class: 'muted' }, p.desc),
        h('div', { class: 'preco' }, precoFormatado(p)),
        h('ul', {}, ...p.itens.map((i) => h('li', {}, `✓ ${i}`))),
        h('button', { class: `btn block ${p.id === 'prosperar' ? 'peach' : p.preco ? '' : 'white'}`, type: 'button', onClick: () => assinar(p) },
          SITE.beta ? (p.preco ? 'Assinar depois do beta' : 'Grátis') : (p.preco ? 'Assinar' : 'Ficar no Semente'))))),
      h('p', { class: 'muted center' }, 'Pagamento pelo Mercado Pago: PIX, cartão ou boleto. O anual pode ser parcelado no cartão.'),
      navegacao({ atual: 'planos', seguir: '' }),
    ),
  ));
}
