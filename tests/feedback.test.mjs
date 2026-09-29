import test from 'node:test';
import assert from 'node:assert/strict';
import { validarFeedback, montarFeedback, NOTAS } from '../app/js/lib/feedback.js';

test('precisa de nota e de pelo menos um texto', () => {
  assert.equal(validarFeedback({}).ok, false);
  assert.match(validarFeedback({ gostou: 'os rótulos' }).erro, /nota/i);
  assert.match(validarFeedback({ nota: 4 }).erro, /conte/i);
  assert.equal(validarFeedback({ nota: 4, gostou: '   ' }).ok, false);
  assert.equal(validarFeedback({ nota: 4, dificil: 'achar o botão' }).ok, true);
});

test('nota fora de 1 a 5 é recusada', () => {
  assert.equal(validarFeedback({ nota: 0, gostou: 'x' }).ok, false);
  assert.equal(validarFeedback({ nota: 6, gostou: 'x' }).ok, false);
  assert.equal(validarFeedback({ nota: '3', gostou: 'x' }).ok, true);
});

test('há cinco notas com rótulo', () => {
  assert.equal(NOTAS.length, 5);
  assert.deepEqual(NOTAS.map((n) => n.valor), [1, 2, 3, 4, 5]);
  assert.ok(NOTAS.every((n) => n.rotulo));
});

test('texto traz nota, respostas, quem enviou e versão', () => {
  const t = montarFeedback({
    nota: 4, gostou: 'O rótulo em PDF', dificil: 'Achar o link do WhatsApp', sugestao: 'Mais modelos de tag',
    nome: 'Ana', marca: 'Ateliê Luz', versao: '1.2.0', aparelho: 'celular Android',
  });
  assert.match(t, /Feedback do artesaná\./);
  assert.match(t, /Nota: 4 de 5/);
  assert.match(t, /O rótulo em PDF/);
  assert.match(t, /Achar o link do WhatsApp/);
  assert.match(t, /Mais modelos de tag/);
  assert.match(t, /Ana/);
  assert.match(t, /Ateliê Luz/);
  assert.match(t, /1\.2\.0/);
  assert.match(t, /celular Android/);
  assert.ok(!t.includes('undefined'));
});

test('respostas vazias não aparecem no texto', () => {
  const t = montarFeedback({ nota: 5, gostou: 'Tudo', versao: '1.2.0' });
  assert.match(t, /Nota: 5 de 5/);
  assert.ok(!t.includes('O que foi difícil'));
  assert.ok(!t.includes('Sugestão'));
  assert.ok(!t.includes('undefined'));
});
