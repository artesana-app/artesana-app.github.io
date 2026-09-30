// Registro da marca no INPI: conferir se o nome está livre e o passo a passo pra pessoa física.
import { h, header, navegacao, copiar } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import { nichosDe } from '../lib/perfil.js';

// classes de Nice mais comuns pra quem faz à mão
const CLASSES = {
  sabonetes: [{ n: 3, o: 'Sabonetes, cosméticos e perfumaria' }],
  cosmeticos: [{ n: 3, o: 'Cosméticos e produtos de higiene' }],
  velas: [{ n: 4, o: 'Velas e pavios' }],
  alimentos: [{ n: 30, o: 'Doces, pães, biscoitos, chocolate' }, { n: 29, o: 'Geleias, conservas' }],
  artesanato: [{ n: 20, o: 'Objetos de decoração e madeira' }, { n: 26, o: 'Bordados, rendas e aviamentos' }, { n: 21, o: 'Utensílios e cerâmica' }],
};
const PASSOS = [
  ['Pesquise o nome', 'Na busca do INPI, procure a sua marca e variações (com e sem acento, junto e separado). Se já existir na mesma classe, escolha outro nome antes de imprimir rótulo.'],
  ['Crie o cadastro', 'No portal gov.br, entre no e-INPI e faça o cadastro como pessoa física. Não precisa de CNPJ.'],
  ['Emita a GRU', 'Gere a guia de pagamento do pedido de registro. Pessoa física, MEI e pequenas empresas pagam o valor reduzido.'],
  ['Faça o pedido', 'No e-Marcas, preencha o pedido: nome da marca, tipo (nominativa, só o nome, ou mista, com o logo) e a classe do produto.'],
  ['Acompanhe', 'O pedido sai na Revista da Propriedade Industrial. Terceiros têm 60 dias pra se opor; depois o INPI examina. Leva meses, e você pode usar a marca enquanto espera.'],
  ['Registro concedido', 'Pague a taxa de concessão e guarde o certificado: vale 10 anos, renovável.'],
];

export function montar(section) {
  const user = store.usuario();
  const o = store.get('onboarding', {});
  const nome = campo({ valor: user.marca || '', placeholder: 'Nome da marca', autocapitalize: 'words' });
  const classes = [...new Map(nichosDe(o).flatMap((n) => CLASSES[n] || []).map((c) => [c.n, c])).values()];
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Registrar a marca', sub: 'INPI, como pessoa física, sem CNPJ', voltar: '#mais' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('div', { class: 'field' }, h('label', {}, 'Conferir se o nome está livre'), nome.el),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn peach', type: 'button', onClick: () => { const n = nome.input.value.trim(); copiar(n, 'Nome copiado. Cole na busca do INPI.'); window.open('https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp', '_blank', 'noopener'); } }, 'Abrir a busca do INPI'),
          h('a', { class: 'btn white', href: 'https://www.gov.br/inpi/pt-br/servicos/marcas', target: '_blank', rel: 'noopener' }, 'Página oficial')),
        h('p', { class: 'muted', style: { marginTop: '10px' } }, 'A busca do INPI abre em outra aba. Pesquise pelo nome exato e por parecidos.')),
      classes.length ? h('div', { class: 'card' }, h('h3', {}, 'Classe do seu produto'), h('p', { class: 'muted' }, 'Pelo que você produz, o pedido costuma entrar nestas classes:'),
        h('ul', { class: 'lista-simples' }, ...classes.map((c) => h('li', {}, h('b', {}, `Classe ${c.n}: `), c.o)))) : null,
      h('ol', { class: 'steps list' }, ...PASSOS.map(([t, x]) => h('li', {}, h('div', {}, h('b', {}, t), h('span', {}, x))))),
      h('p', { class: 'muted' }, 'Valores e prazos mudam; confira no site do INPI antes de pagar. O app orienta; o pedido é seu.'),
      navegacao({ atual: 'mais', voltar: 'mais', seguir: '' }),
    ),
  ));
}
