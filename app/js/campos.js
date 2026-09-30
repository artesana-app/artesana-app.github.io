// Campos de formulário já com o microfone (falar em vez de digitar).
// campo(): <input> de texto. area(): <textarea>. Quem chama continua ouvindo 'input' no elemento.
import { h } from './ui.js';
import { comDitado } from './ditado.js';

const SEM_VOZ = new Set(['email', 'password', 'number', 'tel', 'url', 'date']);

// campo({ valor, placeholder, tipo, ... }) -> { el, input }
// el é o que vai na tela (o input dentro do envelope com o microfone); input é o próprio <input>.
export function campo(attrs = {}) {
  const { valor = '', ...resto } = attrs;
  const tipo = resto.type || 'text';
  const input = h('input', { class: 'input', type: tipo, autocomplete: 'off', ...resto });
  input.value = valor;
  const el = SEM_VOZ.has(tipo) ? input : comDitado(input);
  return { el, input };
}

export function area(attrs = {}) {
  const { valor = '', ...resto } = attrs;
  const input = h('textarea', { class: 'textarea', rows: '4', ...resto });
  input.value = valor;
  return { el: comDitado(input), input };
}
