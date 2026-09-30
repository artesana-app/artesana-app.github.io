// Entrada: a pessoa diz que redes usa. Isso filtra o que o app mostra depois.
// Ainda não é uma conexão de verdade com a conta: essa chega quando o app da Meta estiver registrado.
import { h, wordmark, toast } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as analitica from '../analitica.js';

const OPCOES = [
  { id: 'instagram', nome: 'Uso o Instagram', sub: 'Só Instagram', redes: { instagram: true, facebook: false }, classe: 'ig' },
  { id: 'facebook', nome: 'Uso o Facebook', sub: 'Só Facebook', redes: { instagram: false, facebook: true }, classe: 'fb' },
  { id: 'meta', nome: 'Uso os dois', sub: 'Instagram e Facebook, ligados no Meta', redes: { instagram: true, facebook: true }, classe: 'meta' },
  { id: 'nenhuma', nome: 'Ainda não tenho redes', sub: 'A gente te ajuda a começar', redes: { instagram: false, facebook: false }, classe: 'white' },
];

export function montar(section) {
  section.innerHTML = '';
  const email = campo({ type: 'email', placeholder: 'seu@email.com (opcional)', 'aria-label': 'E-mail' });

  const entrar = (op) => {
    const atual = store.usuario();
    const mail = email.input.value.trim();
    store.set('user', { ...atual, logado: true, loginTipo: op.id, redes: op.redes, email: mail || atual.email || '' });
    if (mail) analitica.evento('email', { email: mail });
    analitica.evento('entrada', { redes: op.id });
    toast('Bem-vinda ao artesaná.');
    router.ir(atual.nome ? '#home' : '#conversa');
  };

  section.append(
    h('div', { class: 'screen no-tab login' },
      h('div', { class: 'brand' },
        wordmark(),
        h('p', {}, 'o app de quem faz, vende e divulga sozinha'),
      ),
      h('div', { class: 'opts' },
        h('p', { class: 'pergunta-login' }, 'Onde a sua marca aparece hoje?'),
        ...OPCOES.map((op) => h('button', { class: `btn block escolha ${op.classe}`, type: 'button', onClick: () => entrar(op) },
          h('span', {}, h('b', {}, op.nome), h('small', {}, op.sub)))),
        h('div', { class: 'field', style: { marginTop: '14px' } }, h('label', {}, 'Quer receber as novidades por e-mail?'), email.el),
        h('p', { class: 'beta' }, 'Versão beta: seus dados ficam neste aparelho. A conexão com a conta do Instagram chega junto com o login.'),
      ),
    ),
  );
}
