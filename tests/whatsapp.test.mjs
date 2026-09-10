import test from 'node:test';
import assert from 'node:assert/strict';
import { validar, montarLink, numeroFormatado } from '../app/js/lib/whatsapp.js';

test('link sem mensagem', () => {
  assert.equal(montarLink({ ddd: '21', numero: '999163148' }), 'https://wa.me/5521999163148');
});

test('link com mensagem encoda', () => {
  assert.equal(
    montarLink({ ddd: '21', numero: '999163148', mensagem: 'Olá! Quero um pedido' }),
    'https://wa.me/5521999163148?text=Ol%C3%A1!%20Quero%20um%20pedido',
  );
});

test('aceita mascara e espaços', () => {
  assert.equal(montarLink({ ddd: '(21)', numero: '99916-3148' }), 'https://wa.me/5521999163148');
});

test('mensagem so com espacos nao vira text', () => {
  assert.equal(montarLink({ ddd: '21', numero: '999163148', mensagem: '   ' }), 'https://wa.me/5521999163148');
});

test('ddd invalido', () => {
  const r = validar({ ddd: '1', numero: '999163148' });
  assert.equal(r.ok, false);
  assert.match(r.erro, /DDD/);
});

test('numero curto', () => {
  const r = validar({ ddd: '21', numero: '1234' });
  assert.equal(r.ok, false);
  assert.match(r.erro, /número/i);
});

test('numero fixo de 8 digitos e valido', () => {
  assert.equal(validar({ ddd: '21', numero: '33334444' }).ok, true);
});

test('formatado', () => {
  assert.equal(numeroFormatado({ ddd: '21', numero: '999163148' }), '(21) 99916-3148');
  assert.equal(numeroFormatado({ ddd: '11', numero: '33334444' }), '(11) 3333-4444');
});
