import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularProgresso } from '../app/js/lib/progresso.js';

test('vazio = 0 de 5', () => {
  const p = calcularProgresso({});
  assert.equal(p.feitas, 0);
  assert.equal(p.total, 5);
  assert.equal(p.etapas.length, 5);
  assert.ok(p.etapas.every((e) => e.ok === false));
});

test('todas as etapas preenchidas = 5', () => {
  const p = calcularProgresso({
    user: { nome: 'Bibi', marca: 'Flor' },
    onboarding: { nicho: 'sabonetes', historia: 'x', personalidade: 'delicada', publicoAlvo: 'mulheres' },
    instagram: { arroba: '@flor', perfisReferencia: ['@a'] },
  });
  assert.equal(p.feitas, 5);
});

test('nome sem marca nao conta a etapa 1', () => {
  assert.equal(calcularProgresso({ user: { nome: 'Bibi' } }).etapas[0].ok, false);
});

test('personalidade sem publico nao conta', () => {
  assert.equal(calcularProgresso({ onboarding: { personalidade: 'rustica' } }).etapas[3].ok, false);
});

test('instagram so com arroba ja conta', () => {
  const p = calcularProgresso({ instagram: { arroba: 'flor' } });
  assert.equal(p.etapas[4].ok, true);
  assert.equal(p.feitas, 1);
});

test('proxima etapa faltante', () => {
  const p = calcularProgresso({ user: { nome: 'B', marca: 'M' } });
  assert.equal(p.proxima.id, 'nicho');
  assert.equal(calcularProgresso({
    user: { nome: 'B', marca: 'M' },
    onboarding: { nicho: 'x', historia: 'y', personalidade: 'z', publicoAlvo: 'w' },
    instagram: { arroba: '@x' },
  }).proxima, null);
});
