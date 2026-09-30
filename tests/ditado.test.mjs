import test from 'node:test';
import assert from 'node:assert/strict';
import { juntarDitado, limparFala, mensagemErroDitado } from '../app/js/lib/ditado.js';

test('campo vazio recebe a fala com maiúscula inicial', () => {
  assert.equal(juntarDitado('', 'comecei fazendo sabonete na cozinha de casa'), 'Comecei fazendo sabonete na cozinha de casa');
});

test('fala se junta ao que já estava escrito, com espaço', () => {
  assert.equal(juntarDitado('Comecei em 2019.', 'hoje vendo em feiras'), 'Comecei em 2019. Hoje vendo em feiras');
  assert.equal(juntarDitado('Sabonete de lavanda', 'e de alecrim'), 'Sabonete de lavanda e de alecrim');
});

test('espaço sobrando no fim do campo não vira dois espaços', () => {
  assert.equal(juntarDitado('Olá ', 'tudo bem'), 'Olá tudo bem');
});

test('depois de quebra de linha não entra espaço e começa com maiúscula', () => {
  assert.equal(juntarDitado('Linha um\n', 'linha dois'), 'Linha um\nLinha dois');
});

test('pontuação falada vira sinal', () => {
  assert.equal(limparFala('quero o kit de natal vírgula por favor ponto final'), 'quero o kit de natal, por favor.');
  assert.equal(limparFala('ainda tem aquele de lavanda ponto de interrogação'), 'ainda tem aquele de lavanda?');
  assert.equal(limparFala('oi ponto tudo bem'), 'oi. tudo bem');
});

test('fala vazia ou só espaços não muda o campo', () => {
  assert.equal(juntarDitado('Texto', '   '), 'Texto');
  assert.equal(juntarDitado('', ''), '');
});

test('erros da API têm mensagem em português e abortar fica em silêncio', () => {
  assert.match(mensagemErroDitado('not-allowed'), /microfone/);
  assert.match(mensagemErroDitado('network'), /internet/);
  assert.equal(mensagemErroDitado('aborted'), '');
  assert.match(mensagemErroDitado('qualquer-coisa'), /Tente de novo/);
});
