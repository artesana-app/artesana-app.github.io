// Entrada: a pessoa diz que redes usa (isso filtra o que o app mostra depois) ou entra pelo número de telefone.
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

// só dígitos, com o 55 na frente quando a pessoa digitou DDD + número
export function normalizarTelefone(valor) {
  const n = String(valor || '').replace(/\D/g, '');
  if (n.length === 10 || n.length === 11) return `55${n}`;
  if ((n.length === 12 || n.length === 13) && n.startsWith('55')) return n;
  return '';
}

export function montar(section) {
  section.innerHTML = '';
  const email = campo({ type: 'email', placeholder: 'seu@email.com (opcional)', 'aria-label': 'E-mail' });
  const telefone = h('input', { class: 'input grande', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', placeholder: '(47) 99999-9999', 'aria-label': 'Telefone com DDD' });
  const novidades = h('input', { type: 'checkbox', checked: true });
  const erroTel = h('div', { class: 'err-msg hidden', role: 'alert' });
  const caixaTel = h('div', { class: 'card hidden', style: { marginTop: '10px' } },
    h('div', { class: 'field' }, h('label', {}, 'Seu WhatsApp ou telefone, com DDD'), telefone, erroTel),
    h('button', { class: 'btn peach block', type: 'button', onClick: () => entrar({ id: 'telefone', redes: { instagram: false, facebook: false } }) }, 'Entrar com este número'));

  const entrar = (op) => {
    const atual = store.usuario();
    const mail = email.input.value.trim();
    let tel = atual.telefone || '';
    if (op.id === 'telefone') {
      tel = normalizarTelefone(telefone.value);
      if (!tel) { erroTel.textContent = 'Digite o DDD e o número, como (47) 99999-9999.'; erroTel.classList.remove('hidden'); telefone.focus(); return; }
    }
    const aceita = novidades.checked ? 'sim' : 'nao';
    store.set('user', { ...atual, logado: true, loginTipo: op.id, redes: op.redes, email: mail || atual.email || '', telefone: tel, novidades: aceita });
    if (mail) analitica.evento('email', { email: mail });
    if (tel) analitica.evento('telefone', { telefone: tel });
    analitica.evento('novidades', { aceita });
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
        h('button', { class: 'btn block escolha soft', type: 'button', onClick: () => { caixaTel.classList.toggle('hidden'); if (!caixaTel.classList.contains('hidden')) telefone.focus(); } },
          h('span', {}, h('b', {}, 'Continuar com número de telefone'), h('small', {}, 'Só o seu WhatsApp, sem rede social'))),
        caixaTel,
        h('div', { class: 'field', style: { marginTop: '14px' } }, h('label', {}, 'Seu e-mail'), email.el),
        h('label', { class: 'check', style: { marginTop: '6px' } }, novidades, h('span', {}, 'Quero receber novidades do artesaná. por e-mail ou WhatsApp')),
        h('p', { class: 'beta' }, 'Versão beta: seus dados ficam neste aparelho. A conexão com a conta do Instagram chega junto com o login.'),
      ),
    ),
  );
}
