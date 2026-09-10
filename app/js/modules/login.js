import { h, wordmark, toast } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';

function entrar(loginTipo, extra = {}) {
  const atual = store.usuario();
  store.set('user', { ...atual, ...extra, logado: true, loginTipo });
  toast('Bem-vinda ao artesaná.');
  router.ir('#home');
}

export function montar(section) {
  section.innerHTML = '';
  const emailBox = h('div', { class: 'hidden' },
    h('div', { class: 'field' }, h('label', {}, 'E-mail'), h('input', { class: 'input', type: 'email', id: 'login-email', placeholder: 'voce@exemplo.com', autocomplete: 'email' })),
    h('div', { class: 'field' }, h('label', {}, 'Senha'), h('input', { class: 'input', type: 'password', id: 'login-senha', placeholder: '••••••••', autocomplete: 'current-password' })),
    h('button', { class: 'btn block', onClick: () => {
      const email = emailBox.querySelector('#login-email').value.trim();
      if (!email.includes('@')) { toast('Digite um e-mail válido'); return; }
      entrar('email', { email });
    } }, 'Entrar'),
  );

  section.append(
    h('div', { class: 'screen no-tab login' },
      h('div', { class: 'brand' },
        wordmark(),
        h('p', {}, 'o app da empreendedora que faz, vende e fotografa'),
      ),
      h('div', { class: 'opts' },
        h('button', { class: 'btn fb block', onClick: () => entrar('facebook') }, 'Continuar com Facebook'),
        h('button', { class: 'btn ig block', onClick: () => entrar('instagram') }, 'Continuar com Instagram'),
        h('button', { class: 'btn white block', onClick: () => emailBox.classList.toggle('hidden') }, 'Continuar com E-mail'),
        emailBox,
        h('p', { class: 'beta' }, 'Versão beta: por enquanto seus dados ficam só neste aparelho.'),
      ),
    ),
  );
}
