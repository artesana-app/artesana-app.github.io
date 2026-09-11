import { h, header, lista, grupo, toast } from '../ui.js';
import * as store from '../store.js';
import * as onboarding from '../onboarding.js';
import { numeroFormatado } from '../lib/whatsapp.js';

function campoTexto(label, valor, onSalvar, opts = {}) {
  const input = opts.multi ? h('textarea', { class: 'textarea' }) : h('input', { class: 'input', placeholder: opts.placeholder || '' });
  input.value = valor || '';
  input.addEventListener('change', () => { onSalvar(input.value.trim()); toast('Salvo'); });
  return h('div', { class: 'field', style: { padding: '10px 14px 4px' } }, h('label', {}, label), input);
}

function campoSelect(label, valor, opcoes, onSalvar) {
  const sel = h('select', { class: 'select' }, h('option', { value: '' }, 'Escolher...'), ...opcoes.map((o) => h('option', { value: o.id }, `${o.emoji} ${o.nome}`)));
  sel.value = valor || '';
  sel.addEventListener('change', () => { onSalvar(sel.value); toast('Salvo'); });
  return h('div', { class: 'field', style: { padding: '10px 14px 4px' } }, h('label', {}, label), sel);
}

export function montar(section) {
  const render = () => {
    const user = store.usuario();
    const o = store.get('onboarding', {});
    const ig = store.get('instagram', {});
    const wa = store.get('whatsapp', {});
    const p = onboarding.progresso();
    section.innerHTML = '';

    const salvarUser = (campo) => (v) => { store.patch('user', { [campo]: v }); render(); };
    const salvarOnb = (campo) => (v) => { store.patch('onboarding', { [campo]: v }); render(); };

    const progresso = h('div', { class: 'card' },
      h('div', { class: 'progress-label' }, h('b', {}, `${p.feitas} de ${p.total} etapas`), h('span', { class: 'muted' }, p.completo ? 'perfil completo 🎉' : '')),
      h('div', { class: 'progress dark' }, h('i', { style: { width: `${(p.feitas / p.total) * 100}%` } })),
      h('ul', { style: { marginTop: '10px' } }, ...p.etapas.map((e) => h('li', { style: { fontSize: '13px', padding: '3px 0' } }, `${e.ok ? '✅' : '○'} ${e.nome}`))),
    );

    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Meu Perfil', sub: 'Dados que personalizam o app', voltar: '#mais' }),
      h('div', { class: 'content' },
        progresso,
        grupo('Dados pessoais', h('div', { class: 'list' },
          campoTexto('Nome', user.nome, salvarUser('nome'), { placeholder: 'Seu nome' }),
          h('div', { class: 'field', style: { padding: '6px 14px 12px' } }, h('label', {}, 'Conta'), h('div', { class: 'muted' }, user.email || `Login via ${user.loginTipo || 'e-mail'}`)),
        )),
        grupo('Dados da marca', h('div', { class: 'list' },
          campoTexto('Nome da marca', user.marca, salvarUser('marca'), { placeholder: 'Ex: Flor de Sal' }),
          campoSelect('Nicho', o.nicho, onboarding.NICHOS, salvarOnb('nicho')),
          campoTexto('História da marca', o.historia, salvarOnb('historia'), { multi: true }),
          campoSelect('Personalidade', o.personalidade, onboarding.PERSONALIDADES, salvarOnb('personalidade')),
          campoTexto('Público-alvo', o.publicoAlvo, salvarOnb('publicoAlvo'), { placeholder: 'Pra quem você vende' }),
          campoTexto('Produto principal', o.tipoProduto, salvarOnb('tipoProduto'), { placeholder: 'Ex: sabonete de lavanda' }),
        )),
        grupo('Contato', lista([
          { emoji: '💬', titulo: 'Link do WhatsApp', sub: wa.link ? numeroFormatado(wa) : 'Ainda não criado', href: '#whatsapp', badge: wa.link ? null : 'Criar' },
        ]), h('div', { class: 'list' },
          campoTexto('@ do Instagram', ig.arroba, (v) => { store.patch('instagram', { arroba: v ? v.replace(/^@?/, '@') : '' }); render(); }, { placeholder: '@suamarca' }),
          campoTexto('Perfis de referência (separe por vírgula)', (ig.perfisReferencia || []).join(', '), (v) => { store.patch('instagram', { perfisReferencia: v.split(',').map((s) => s.trim()).filter(Boolean) }); render(); }),
        )),
      ),
    ));
  };
  render();
}
