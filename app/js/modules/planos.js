import { h, header, toast, navegacao, modal } from '../ui.js';
import * as store from '../store.js';
import * as analitica from '../analitica.js';
import { SITE, diasDeBeta } from '../site.js';
import { PLANOS, precoFormatado, precoTotal } from '../lib/planos.js';

export function montar(section, param) {
  const atual = store.get('plano', 'semente');
  const dias = diasDeBeta();
  section.innerHTML = '';
  if (param === 'obrigada') {
    const pend = store.get('pagamento_pendente', null);
    if (pend && pend.plano) store.set('plano', pend.plano);
    store.remove('pagamento_pendente');
    toast('Pagamento recebido. Obrigada por florescer com a gente! 🌸', 4000);
  } else if (param === 'pendente') {
    toast('Pagamento em análise. Assim que o Mercado Pago confirmar, o plano ativa.', 4000);
  }
  const aviso = SITE.beta
    ? h('div', { class: 'card moss' },
      h('h3', {}, dias > 0 ? `Beta: tudo liberado, grátis até ${new Date(`${SITE.betaFim}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}` : 'O beta terminou'),
      h('p', { style: { margin: '6px 0 12px', fontSize: '13.5px' } }, `Até ${new Date(`${SITE.betaFim}T12:00:00`).toLocaleDateString('pt-BR')} você usa o app inteiro sem pagar. Depois, cada conta passa pro plano que escolher; quem não escolher fica no Semente, grátis.`),
      h('a', { class: 'btn soft block', href: '#feedback' }, 'Contar como foi o teste'))
    : null;

  const assinar = async (p, confirmado = false) => {
    analitica.evento('plano_clique', { plano: p.id });
    if (!p.preco) { store.set('plano', 'semente'); toast('Plano Semente escolhido'); return; }
    if (SITE.beta && dias > 0 && !confirmado) {
      modal({
        titulo: 'Ainda está tudo liberado',
        corpo: h('p', {}, `Até ${new Date(`${SITE.betaFim}T12:00:00`).toLocaleDateString('pt-BR')} você usa o app inteiro sem pagar. Se quiser garantir o ${p.nome} desde já, o pagamento abre agora e o plano já fica no seu nome.`),
        botoes: [
          { texto: 'Esperar o fim do beta', classe: 'white' },
          { texto: `Assinar o ${p.nome} agora`, classe: 'peach', onClick: () => assinar(p, true) },
        ],
      });
      return;
    }
    const fixo = SITE.pagamentos[p.id];
    if (fixo) { window.open(fixo, '_blank', 'noopener'); return; }
    if (!SITE.backend) { toast('O pagamento abre em breve. Durante o beta está tudo liberado.', 3500); return; }
    const user = store.usuario();
    let email = user.email || '';
    if (!email && p.id === 'florescer') {
      email = (window.prompt('A assinatura mensal precisa do seu e-mail (é onde o Mercado Pago avisa cada cobrança):', '') || '').trim();
      if (!email.includes('@')) { toast('Sem e-mail não dá pra assinar o mensal.'); return; }
      store.patch('user', { email });
    }
    toast('Abrindo o pagamento...');
    const r = await analitica.enviar(`/v1/pagar/${p.id}`, { email });
    if (r.ok && r.url) { store.set('pagamento_pendente', { plano: p.id, referencia: r.referencia, t: Date.now() }); window.open(r.url, '_blank', 'noopener'); return; }
    toast(r.semPagamento ? 'O pagamento ainda não está ligado. Durante o beta está tudo liberado.' : 'Não consegui abrir o pagamento agora. Tente de novo em instantes.', 3500);
  };

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Planos', sub: SITE.beta ? 'Como vai ficar depois do teste' : 'Cresça no seu ritmo', voltar: '#mais', peach: true }),
    h('div', { class: 'content' },
      aviso,
      h('div', { class: 'planos' }, ...PLANOS.map((p) => h('div', { class: `card plano ${p.id === 'prosperar' ? 'destaque' : ''} ${p.id === atual && !SITE.beta ? 'atual' : ''}` },
        p.id === 'prosperar' ? h('span', { class: 'badge gold' }, 'mais completo') : null,
        h('h3', {}, `${p.emoji} ${p.nome}`), h('div', { class: 'muted' }, p.desc),
        h('div', { class: 'preco' }, precoFormatado(p)),
        precoTotal(p) ? h('div', { class: 'muted', style: { marginTop: '-6px', marginBottom: '10px', fontSize: '13px' } }, `${precoTotal(p)}, no cartão em até ${p.parcelas}x ou PIX à vista`) : null,
        h('ul', {}, ...p.itens.map((i) => h('li', {}, `✓ ${i}`))),
        h('button', { class: `btn block ${p.id === 'prosperar' ? 'peach' : p.preco ? '' : 'white'}`, type: 'button', onClick: () => assinar(p) },
          p.preco ? 'Assinar' : (SITE.beta ? 'Grátis' : 'Ficar no Semente'))))),
      h('p', { class: 'muted center' }, 'Pagamento pelo Mercado Pago: PIX, cartão ou boleto. O anual pode ser parcelado no cartão.'),
      navegacao({ atual: 'planos', seguir: '' }),
    ),
  ));
}
