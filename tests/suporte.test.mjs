import test from 'node:test';
import assert from 'node:assert/strict';
import { responder, normalizar, distancia, linkNaPergunta, INTENCOES } from '../app/js/lib/suporte.js';

test('normaliza acento, maiúscula e pontuação', () => {
  assert.equal(normalizar('  Ôi, TUDO bem?! '), 'oi tudo bem');
});

test('distância de edição', () => {
  assert.equal(distancia('rotulo', 'rotlo'), 1);
  assert.equal(distancia('etiqueta', 'etiketa'), 2);
});

test('acha a resposta certa com erro de digitação e sem acento', () => {
  assert.equal(responder('como faço o rotlo do meu sabonete?').id, 'rotulo');
  assert.equal(responder('quero fazer uma etiketa').id, 'rotulo');
  assert.equal(responder('meu watsap nao ta no link').id, 'whatsapp');
  assert.equal(responder('nao tenho instagram, como abrir conta?').id, 'instagram-conta');
  assert.equal(responder('quanto custa depois do beta').id, 'planos');
  assert.equal(responder('lista inci').id, 'inci');
});

test('cada resposta leva pra algum lugar ou pra atendente', () => {
  for (const i of INTENCOES) {
    assert.ok(i.resposta.length > 20, i.id);
    assert.ok(i.link === '' || i.link.startsWith('#'), i.id);
  }
  const r = responder('quero falar com uma pessoa');
  assert.equal(r.id, 'email');
  assert.equal(r.atendente, true);
});

test('saudação curta responde, pergunta sem encaixe devolve null', () => {
  assert.equal(responder('oi').id, 'saudacao');
  assert.equal(responder('bom dia!').id, 'saudacao');
  assert.equal(responder('xyz abc kkk'), null);
  assert.equal(responder(''), null);
});

test('link colado na pergunta é reconhecido', () => {
  assert.equal(linkNaPergunta('olha esse https://www.instagram.com/artesana.app/ aqui'), 'https://www.instagram.com/artesana.app/');
  assert.equal(linkNaPergunta('tenta canva.com/x'), 'canva.com/x');
  assert.equal(linkNaPergunta('sem link'), '');
});
