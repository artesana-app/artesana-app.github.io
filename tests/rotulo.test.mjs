import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeA4, corTexto, PRESETS } from '../app/js/lib/rotulo.js';

test('redondo 50mm cabe 3x5 = 15', () => {
  const g = gradeA4({ largura: 50, altura: 50 });
  assert.equal(g.colunas, 3);
  assert.equal(g.linhas, 5);
  assert.equal(g.total, 15);
  assert.equal(g.posicoes.length, 15);
});

test('retangular 70x40 cabe 2x6 = 12', () => {
  const g = gradeA4({ largura: 70, altura: 40 });
  assert.equal(g.colunas, 2);
  assert.equal(g.linhas, 6);
  assert.equal(g.total, 12);
});

test('maior que a folha = 0 sem quebrar', () => {
  const g = gradeA4({ largura: 300, altura: 50 });
  assert.equal(g.total, 0);
  assert.deepEqual(g.posicoes, []);
});

test('primeira posicao = margem, segunda desloca largura+espaco', () => {
  const g = gradeA4({ largura: 50, altura: 50, margem: 8, espaco: 3 });
  assert.deepEqual(g.posicoes[0], { x: 8, y: 8 });
  assert.deepEqual(g.posicoes[1], { x: 61, y: 8 });
  assert.deepEqual(g.posicoes[3], { x: 8, y: 61 });
});

test('valores invalidos viram 0', () => {
  assert.equal(gradeA4({ largura: 0, altura: 50 }).total, 0);
  assert.equal(gradeA4({ largura: 'abc', altura: 50 }).total, 0);
});

test('cor do texto por contraste', () => {
  assert.equal(corTexto('#FFF5EF'), '#2C1A1E');
  assert.equal(corTexto('#FFB18B'), '#2C1A1E');
  assert.equal(corTexto('#4A6348'), '#FFF5EF');
  assert.equal(corTexto('#2C1A1E'), '#FFF5EF');
});

test('presets cobrem os 3 tipos', () => {
  assert.ok(PRESETS.some((p) => p.tipo === 'redondo'));
  assert.ok(PRESETS.some((p) => p.tipo === 'retangular'));
  assert.ok(PRESETS.some((p) => p.tipo === 'tag'));
});
