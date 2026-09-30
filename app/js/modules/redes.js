// Redes da marca: só Instagram, só Facebook ou os dois (Meta). Muda o que o app mostra.
// A conexão de verdade com a conta (puxar dados, publicar) depende do app registrado na Meta; até lá, é escolha.
import { h, header, toast, navegacao, lista, grupo } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';

const OPCOES = [
  { id: 'instagram', nome: 'Só Instagram', redes: { instagram: true, facebook: false } },
  { id: 'facebook', nome: 'Só Facebook', redes: { instagram: false, facebook: true } },
  { id: 'meta', nome: 'Os dois, ligados no Meta', redes: { instagram: true, facebook: true } },
  { id: 'nenhuma', nome: 'Ainda não tenho', redes: { instagram: false, facebook: false } },
];

export function montar(section) {
  const user = store.usuario();
  const ig = store.get('instagram', {});
  const atual = user.loginTipo || 'instagram';
  const pagina = campo({ valor: user.paginaFacebook || '', placeholder: 'Nome ou link da sua Página', autocapitalize: 'none' });
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Suas redes', sub: 'O app mostra o que faz sentido pra onde a sua marca está', voltar: '#mais' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('h3', {}, 'Onde a sua marca aparece?'),
        h('div', { class: 'escolhas', style: { marginTop: '10px' } }, ...OPCOES.map((op) => h('button', { type: 'button', class: `btn block ${op.id === atual ? 'peach' : 'white'}`, onClick: () => { store.patch('user', { loginTipo: op.id, redes: op.redes }); toast('Salvo'); router.ir('#redes'); } }, op.nome)))),
      grupo('Instagram', lista([
        { emoji: '📸', titulo: ig.arroba ? `Seu @: ${ig.arroba}` : 'Informar o @ da marca', sub: ig.arroba ? 'Toque pra mudar' : 'Ou peça ajuda pra criar a conta', href: '#conversa/arroba' },
        { emoji: '🆕', titulo: 'Criar a conta do Instagram', sub: 'Passo a passo com telas, pelo celular', href: '#ajuda-instagram' },
      ])),
      grupo('Facebook', h('div', { class: 'card' },
        h('div', { class: 'field' }, h('label', {}, 'Sua Página no Facebook'), pagina.el, h('div', { class: 'hint' }, 'Opcional. Se ainda não tem, o tutorial abaixo mostra como criar.')),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onClick: () => { store.patch('user', { paginaFacebook: pagina.input.value.trim() }); toast('Página salva'); } }, 'Salvar'), h('a', { class: 'btn white', href: '#tutorial-meta' }, 'Criar uma Página')))),
      h('p', { class: 'muted' }, 'Publicar direto e ler os números da conta pelo app depende de uma conexão oficial com a Meta, que chega junto com o login.'),
      navegacao({ atual: 'social', voltar: 'mais', seguir: 'social' }),
    ),
  ));
}
